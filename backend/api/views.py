from rest_framework import viewsets
from .models import Business, Customer, LoyaltyCard, Station, Transaction
from .serializers import BusinessSerializer, CustomerSerializer, LoyaltyCardSerializer, StationSerializer, TransactionSerializer

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class LoyaltyCardViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyCard.objects.all()
    serializer_class = LoyaltyCardSerializer

class StationViewSet(viewsets.ModelViewSet):
    queryset = Station.objects.all()
    serializer_class = StationSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
