from datetime import timedelta
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP

from django.db import transaction as db_transaction
from django.db.models import Count, Sum, Max, Q
from django.db.models.functions import TruncDate
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Business,
    BusinessCustomer,
    Customer,
    LoyaltyCard,
    PassRegistration,
    Station,
    Transaction,
)
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
        return Transaction.objects.filter(station__business=biz)

    def perform_create(self, serializer):
        biz = self.request.user.business
        redeem_requested = serializer.validated_data.pop("redeem", False)
        loyalty_card = serializer.validated_data.get("loyalty_card")
        amount = serializer.validated_data["amount"]

        station = resolve_station_from_request(self.request)
        if station.business != biz:
            raise PermissionDenied("Station does not belong to your business.")

        if loyalty_card:
            if loyalty_card.business_customer.business != biz:
                raise PermissionDenied("Cannot create a transaction for a loyalty card outside your business.")

            with db_transaction.atomic():
                card = LoyaltyCard.objects.select_for_update().get(pk=loyalty_card.pk)
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
        else:
            serializer.save(
                station=station,
                loyalty_card=None,
                points_earned=0,
                points_redeemed=0,
                final_amount=amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            )


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


class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biz = request.user.business

        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)
        previous_period_start = seven_days_ago - timedelta(days=7)

        active_loyalty_cards = LoyaltyCard.objects.filter(
            business_customer__business=biz
        ).count()
        active_loyalty_cards_prev = LoyaltyCard.objects.filter(
            business_customer__business=biz,
            created_at__lt=seven_days_ago,
        ).count()

        repeat_customers = (
            BusinessCustomer.objects.filter(business=biz)
            .annotate(
                txn_count=Count(
                    "loyaltycard__transaction",
                    filter=Q(loyaltycard__transaction__created_at__gte=seven_days_ago),
                )
            )
            .filter(txn_count__gte=2)
            .count()
        )
        repeat_customers_prev = (
            BusinessCustomer.objects.filter(business=biz)
            .annotate(
                txn_count=Count(
                    "loyaltycard__transaction",
                    filter=Q(
                        loyaltycard__transaction__created_at__gte=previous_period_start,
                        loyaltycard__transaction__created_at__lt=seven_days_ago,
                    ),
                )
            )
            .filter(txn_count__gte=2)
            .count()
        )

        points_redeemed = (
            Transaction.objects.filter(
                loyalty_card__business_customer__business=biz,
                created_at__gte=seven_days_ago,
            ).aggregate(total=Sum("points_redeemed"))["total"]
            or 0
        )

        points_redeemed_prev = (
            Transaction.objects.filter(
                loyalty_card__business_customer__business=biz,
                created_at__gte=previous_period_start,
                created_at__lt=seven_days_ago,
            ).aggregate(total=Sum("points_redeemed"))["total"]
            or 0
        )

        wallet_installs = PassRegistration.objects.filter(
            loyalty_card__business_customer__business=biz,
            updated_at__gte=seven_days_ago,
        ).count()

        wallet_installs_prev = PassRegistration.objects.filter(
            loyalty_card__business_customer__business=biz,
            updated_at__gte=previous_period_start,
            updated_at__lt=seven_days_ago,
        ).count()

        return Response(
            {
                "active_loyalty_cards": active_loyalty_cards,
                "active_loyalty_cards_prev": active_loyalty_cards_prev,
                "repeat_customers": repeat_customers,
                "repeat_customers_prev": repeat_customers_prev,
                "points_redeemed_7d": points_redeemed,
                "points_redeemed_prev": points_redeemed_prev,
                "wallet_pass_installs": wallet_installs,
                "wallet_pass_prev": wallet_installs_prev,
            }
        )


class DashboardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biz = request.user.business
        now = timezone.now()

        station_activity = {
            item["station_id"]: item["last_activity"]
            for item in Transaction.objects.filter(station__business=biz)
            .values("station_id")
            .annotate(last_activity=Max("created_at"))
        }

        stations = (
            Station.objects.filter(business=biz)
            .select_related("prepared_loyalty_card__business_customer__customer")
            .order_by("name")
        )

        station_data = []
        offline_threshold = now - timedelta(hours=12)
        for station in stations:
            prepared_slot = None
            if station.prepared_loyalty_card:
                prepared_slot = {
                    "customer": station.prepared_loyalty_card.business_customer.customer.name,
                    "token": str(station.prepared_loyalty_card.token),
                }

            last_activity = station_activity.get(station.id)
            if not last_activity and not station.prepared_at:
                status = "online"
            else:
                reference_time = station.prepared_at or last_activity or now
                status = "offline" if reference_time < offline_threshold else "online"

            station_data.append(
                {
                    "id": str(station.pk),
                    "name": station.name,
                    "status": status,
                    "prepared_slot": prepared_slot,
                    "updated": (station.prepared_at or last_activity).isoformat()
                    if (station.prepared_at or last_activity)
                    else None,
                }
            )

        start_date = now - timedelta(days=90)
        revenue_rows = (
            Transaction.objects.filter(
                station__business=biz,
                created_at__gte=start_date,
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .order_by("day")
            .annotate(total=Sum("amount"))
        )
        revenue_trend = [
            {"date": row["day"].isoformat(), "total": float(row["total"])}
            for row in revenue_rows
        ]

        recent_transactions = []
        txn_qs = (
            Transaction.objects.filter(station__business=biz)
            .select_related(
                "loyalty_card__business_customer__customer",
                "station",
            )
            .order_by("-created_at")[:8]
        )
        for txn in txn_qs:
            customer_name = (
                txn.loyalty_card.business_customer.customer.name
                if txn.loyalty_card
                else "Guest checkout"
            )
            recent_transactions.append(
                {
                    "id": str(txn.pk),
                    "customer": customer_name,
                    "station": txn.station.name,
                    "amount": float(txn.amount),
                    "points_earned": txn.points_earned,
                    "points_redeemed": txn.points_redeemed,
                    "created_at": txn.created_at.isoformat(),
                }
            )

        top_customers = (
            BusinessCustomer.objects.filter(business=biz)
            .annotate(
                visits=Count("loyaltycard__transaction"),
                points=Sum("loyaltycard__transaction__points_earned"),
            )
            .filter(visits__gt=0)
            .select_related("customer")
            .order_by("-visits")[:5]
        )

        top_customers_payload = [
            {
                "name": bc.customer.name,
                "visits": bc.visits,
                "points": bc.points or 0,
            }
            for bc in top_customers
        ]

        return Response(
            {
                "station_readiness": station_data,
                "revenue_trend": revenue_trend,
                "recent_transactions": recent_transactions,
                "top_customers": top_customers_payload,
            }
        )
