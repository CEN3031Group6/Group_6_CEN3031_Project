from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api.models import Business
from accounts.models import BusinessUser
from .serializers import BusinessSignupSerializer

class BusinessSignupView(APIView):
    authentication_class = []
    permission_classes = []

    def post(self, request):
        ser = BusinessSignupSerializer(data = request.data)
        ser.is_valid(raise_exception = True)

        business = Business.objects.create(
            name = ser.validated_data["business_name"],
            reward_rate = ser.validated_data["reward_rate"],
            redemption_points = ser.validated_data["redemption_points"],
            redemption_rate = ser.validated_data["redemption_rate"],
            logo_url = ser.validated_data["logo_url"],
            primary_color = ser.validated_data["primary_color"],
            background_color = ser.validated_data["background_color"]
        )

        user = BusinessUser.objects.create_user(
            username = ser.validated_data["username"],
            password = ser.validated_data["password"],
            business = business
        )

        return Response(
            {
                "business_id": str(business.pk),
                "business_name": business.name,
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )
