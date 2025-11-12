from rest_framework import serializers

class BusinessSignupSerializer(serializers.Serializer):
    # business fields
    business_name = serializers.CharField(max_length=100)
    reward_rate = serializers.DecimalField(max_digits=6, decimal_places=3)
    redemption_points = serializers.IntegerField()
    redemption_rate = serializers.DecimalField(max_digits=3, decimal_places=2)
    logo_url = serializers.URLField()
    primary_color = serializers.CharField(max_length=7)
    background_color = serializers.CharField(max_length=7)

    # user fields
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)