from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Business, Customer, BusinessCustomer, LoyaltyCard, Station, Transaction
from .serializers import BusinessSerializer, CustomerSerializer, BusinessCustomerSerializer, LoyaltyCardSerializer, StationSerializer, TransactionSerializer

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer

    def get_queryset(self):
        biz = self.request.user.business
        return Business.objects.filter(pk = biz)

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

class LoyaltyCardViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyCard.objects.all()
    serializer_class = LoyaltyCardSerializer

    def get_queryset(self):
        biz = self.request.user.business
        return LoyaltyCard.objects.filter(business_customer__business = biz)

    def perform_create(self, serializer):
        biz = self.request.user.business
        bc = serializer.validated_data["business_customer"]

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

    def get_queryset(self, serializer):
        biz = self.request.user.business
        return Transaction.objects.filter(business = biz)
