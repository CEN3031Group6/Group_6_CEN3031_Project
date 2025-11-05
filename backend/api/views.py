from rest_framework import viewsets
from .models import Business, Customer, BusinessCustomer, LoyaltyCard, Station, Transaction
from .serializers import BusinessSerializer, CustomerSerializer, BusinessCustomerSerializer, LoyaltyCardSerializer, StationSerializer, TransactionSerializer

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class BusinessCustomerViewSet(viewsets.ModelViewSet):
    queryset = BusinessCustomer.objects.all()
    serializer_class = BusinessCustomerSerializer

class LoyaltyCardViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyCard.objects.all()
    serializer_class = LoyaltyCardSerializer

class StationViewSet(viewsets.ModelViewSet):
    queryset = Station.objects.all()
    serializer_class = StationSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
