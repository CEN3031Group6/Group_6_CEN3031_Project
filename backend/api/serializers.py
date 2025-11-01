from rest_framework import serializers
from .models import Business, Customer, LoyaltyCard, Station, Transaction

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class LoyaltyCardSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only = True)
    customer = CustomerSerializer(read_only = True)

    class Meta:
        model = LoyaltyCard
        fields = '__all__'

class StationSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only = True)

    class Meta:
        model = Station
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only = True)
    loyalty_card = LoyaltyCardSerializer(read_only = True)

    class Meta:
        model = Transaction
        fields = '__all__'