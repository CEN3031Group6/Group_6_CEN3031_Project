from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Business
from accounts.models import BusinessUser
from .serializers import BusinessSignupSerializer


def serialize_user(user: BusinessUser):
    business = getattr(user, "business", None)
    return {
        "id": str(user.pk),
        "username": user.username,
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "business": {
            "id": str(business.pk) if business else None,
            "name": business.name if business else None,
        },
    }


class BusinessSignupView(APIView):
    authentication_class = []
    permission_classes = []

    def post(self, request):
        ser = BusinessSignupSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        business = Business.objects.create(
            name=ser.validated_data["business_name"],
            reward_rate=ser.validated_data["reward_rate"],
            redemption_points=ser.validated_data["redemption_points"],
            redemption_rate=ser.validated_data["redemption_rate"],
            logo_url=ser.validated_data["logo_url"],
            primary_color=ser.validated_data["primary_color"],
            background_color=ser.validated_data["background_color"],
        )

        user = BusinessUser.objects.create_user(
            username=ser.validated_data["username"],
            password=ser.validated_data["password"],
            business=business,
        )

        return Response(
            {
                "business_id": str(business.pk),
                "business_name": business.name,
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


@method_decorator(csrf_exempt, name="dispatch")
class BusinessLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=username, password=password)

        if user is None:
            try:
                fallback_user = BusinessUser.objects.get(email__iexact=username)
                user = authenticate(request, username=fallback_user.username, password=password)
            except BusinessUser.DoesNotExist:
                user = None

        if user is None:
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        return Response(serialize_user(user), status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(serialize_user(request.user))


class BusinessLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordUpdateSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class PasswordUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(current_password):
            return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
