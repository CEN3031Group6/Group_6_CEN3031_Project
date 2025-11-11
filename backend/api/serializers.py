from rest_framework import serializers
from .models import Business, Customer, BusinessCustomer, LoyaltyCard, Station, Transaction

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class BusinessCustomerSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only = True)
    customer = CustomerSerializer(read_only = True)

    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source = "customer",
        write_only=True
    )

    class Meta:
        model = BusinessCustomer
        fields = ['id', 'business', 'customer', 'customer_id']


class LoyaltyCardSerializer(serializers.ModelSerializer):

    business_customer = BusinessCustomerSerializer(read_only = True)
    token = serializers.UUIDField(read_only=True)
    points_balance = serializers.IntegerField(read_only=True)
    wallet_status = serializers.CharField(read_only=True)
    apple_pass_id = serializers.CharField(read_only=True)
    google_pass_id = serializers.CharField(read_only=True)
    apple_push_token = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


    business_customer_id = serializers.PrimaryKeyRelatedField(
        queryset = BusinessCustomer.objects.all(),
        source = "business_customer",
        write_only = True
    )

    class Meta:
        model = LoyaltyCard
        fields = [
            "token",
            "points_balance",
            "wallet_status",
            "apple_pass_id",
            "google_pass_id",
            "apple_push_token",
            "created_at",
            "updated_at",
            "business_customer",
            "business_customer_id",
        ]

class StationSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only = True)

    class Meta:
        model = Station
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    station = StationSerializer(read_only = True)
    points_earned = serializers.IntegerField(read_only=True)
    loyalty_card = LoyaltyCardSerializer(read_only = True)

    loyalty_card_id = serializers.PrimaryKeyRelatedField(
        queryset = LoyaltyCard.objects.all(),
        source = "loyalty_card",
        write_only = True
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "loyalty_card",
            "loyalty_card_id",
            "station",
            "points_earned",
            "amount",
            "created_at",
        ]