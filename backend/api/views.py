from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP
from django.db import transaction as db_transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Business, Customer, BusinessCustomer, LoyaltyCard, Station, Transaction
from .serializers import (
    BusinessSerializer,
    CustomerSerializer,
    BusinessCustomerSerializer,
    LoyaltyCardSerializer,
    StationSerializer,
    TransactionSerializer,
    LoyaltyCardIssueSerializer,
)
from .utils import resolve_station_from_request
from .passkit import (
    build_pkpass,
    ensure_card_auth_token,
    notify_loyalty_card_updated,
)


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer

    def get_queryset(self):
        biz = self.request.user.business
        return Business.objects.filter(pk = biz.id)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]

class BusinessCustomerViewSet(viewsets.ModelViewSet):
    queryset = BusinessCustomer.objects.all()
    serializer_class = BusinessCustomerSerializer

    def get_queryset(self):
        biz = self.request.user.business
        return BusinessCustomer.objects.filter(business = biz)

    def perform_create(self, serializer):
        biz = self.request.user.business
        serializer.save(business = biz)

    def perform_destroy(self, instance):
        customer = instance.customer
        super().perform_destroy(instance)
        if not BusinessCustomer.objects.filter(customer=customer).exists():
            customer.delete()

class LoyaltyCardViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyCard.objects.all()
    serializer_class = LoyaltyCardSerializer

    def get_queryset(self):
        biz = self.request.user.business
        return LoyaltyCard.objects.filter(business_customer__business = biz)

    def perform_create(self, serializer):
        biz = self.request.user.business
        bc = serializer.validated_data.get("business_customer")

        if bc.business != biz:
            raise PermissionDenied("Cannot create card for another business's customer.")

        serializer.save()

class StationViewSet(viewsets.ModelViewSet):
    queryset = Station.objects.all()
    serializer_class = StationSerializer

    def get_queryset(self):
        biz = self.request.user.business
        return Station.objects.filter(business = biz)

    def perform_create(self, serializer):
        biz = self.request.user.business
        serializer.save(business = biz)

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def get_queryset(self):
        biz = self.request.user.business
        return Transaction.objects.filter(loyalty_card__business_customer__business = biz)

    def perform_create(self, serializer):
        biz = self.request.user.business
        redeem_requested = serializer.validated_data.pop("redeem", False)
        lc = serializer.validated_data["loyalty_card"]

        if lc.business_customer.business != biz:
            raise PermissionDenied("Cannot create a transaction for a loyalty card outside your business.")

        station = resolve_station_from_request(self.request)
        if station.business != biz:
            raise PermissionDenied("Station does not belong to your business.")

        amount = serializer.validated_data["amount"]
        with db_transaction.atomic():
            card = LoyaltyCard.objects.select_for_update().get(pk=lc.pk)
            points_earned = int(
                (amount * biz.reward_rate).quantize(Decimal("1"), rounding=ROUND_DOWN)
            )
            new_balance = card.points_balance + points_earned
            points_redeemed = 0
            final_amount = amount.quantize(Decimal("0.01"))

            if redeem_requested and new_balance >= biz.redemption_points:
                points_redeemed = biz.redemption_points
                new_balance -= points_redeemed
                discount = (amount * biz.redemption_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                final_amount = (amount - discount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                if final_amount < Decimal("0.00"):
                    final_amount = Decimal("0.00")

            card.points_balance = new_balance
            card.save(update_fields=["points_balance", "updated_at"])

            serializer.save(
                station=station,
                loyalty_card=card,
                points_earned=points_earned,
                points_redeemed=points_redeemed,
                final_amount=final_amount,
            )
        notify_loyalty_card_updated(card)


class LoyaltyCardIssueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LoyaltyCardIssueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        biz = request.user.business
        station = resolve_station_from_request(request)
        if station.business != biz:
            raise PermissionDenied("Station does not belong to your business.")

        phone = serializer.validated_data["phone_number"]
        name = serializer.validated_data["customer_name"]

        customer, created = Customer.objects.get_or_create(
            phone_number=phone,
            defaults={"name": name},
        )
        if not created and name and customer.name != name:
            customer.name = name
            customer.save(update_fields=["name"])

        business_customer, _ = BusinessCustomer.objects.get_or_create(
            business=biz,
            customer=customer,
        )
        loyalty_card, _ = LoyaltyCard.objects.get_or_create(
            business_customer=business_customer,
        )
        ensure_card_auth_token(loyalty_card)

        station.prepared_loyalty_card = loyalty_card
        station.prepared_at = timezone.now()
        station.save(update_fields=["prepared_loyalty_card", "prepared_at"])

        prepared_url = request.build_absolute_uri(
            reverse("station-prepared-pass", args=[station.pk])
        )
        prepared_url = f"{prepared_url}?token={station.api_token}"

        loyalty_card_data = LoyaltyCardSerializer(loyalty_card, context={"request": request}).data
        loyalty_card_data["qr_payload"] = str(loyalty_card.token)
        loyalty_card_data["authentication_token"] = loyalty_card.apple_auth_token

        return Response(
            {
                "customer": CustomerSerializer(customer).data,
                "business_customer_id": str(business_customer.pk),
                "loyalty_card": loyalty_card_data,
                "station_id": str(station.pk),
                "prepared_pass_url": prepared_url,
                "wallet": {
                    "apple": {"download_url": prepared_url + "&platform=apple"},
                    "google": {"download_url": prepared_url + "&platform=google"},
                },
            },
            status=status.HTTP_201_CREATED,
        )


class StationPreparedPassView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, pk):
        station = get_object_or_404(Station, pk=pk)
        token = request.query_params.get("token")
        if token != station.api_token:
            raise PermissionDenied("Invalid station token.")

        card = station.prepared_loyalty_card
        if not card:
            return Response({"detail": "No pass prepared."}, status=status.HTTP_404_NOT_FOUND)

        platform = request.query_params.get("platform", "json").lower()
        clear = request.query_params.get("clear", "true").lower() != "false"

        if platform == "apple":
            pkpass_bytes = build_pkpass(card)
            response = HttpResponse(pkpass_bytes, content_type="application/vnd.apple.pkpass")
            response["Content-Disposition"] = f'attachment; filename="{card.token}.pkpass"'
        else:
            payload = {
                "loyalty_card_token": str(card.token),
                "qr_payload": str(card.token),
                "apple_wallet_available": True,
            }
            response = Response(payload)

        if clear:
            station.prepared_loyalty_card = None
            station.prepared_at = None
            station.save(update_fields=["prepared_loyalty_card", "prepared_at"])

        return response


class LoyaltyCardQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, token):
        card = get_object_or_404(
            LoyaltyCard,
            token=token,
            business_customer__business=request.user.business,
        )
        return Response({"qr_payload": str(card.token)})
