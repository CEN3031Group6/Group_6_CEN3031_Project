from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import BusinessUser
from api.models import Business


class BusinessSignupViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("business-signup")
        self.payload = {
            "business_name": "Test Coffee",
            "reward_rate": Decimal("1.500"),
            "redemption_points": 100,
            "redemption_rate": Decimal("0.10"),
            "logo_url": "https://example.com/logo.png",
            "primary_color": "#123456",
            "background_color": "#abcdef",
            "username": "testowner",
            "password": "super-secret",
        }

    def test_business_signup_creates_business_and_user(self):
        response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Business.objects.count(), 1)
        self.assertEqual(BusinessUser.objects.count(), 1)

        business = Business.objects.get()
        user = BusinessUser.objects.get()

        self.assertEqual(user.business, business)
        self.assertTrue(user.check_password(self.payload["password"]))

        self.assertEqual(response.data["business_id"], str(business.pk))
        self.assertEqual(response.data["business_name"], business.name)
        self.assertEqual(response.data["username"], user.username)

    def test_signup_requires_required_fields(self):
        incomplete_payload = {**self.payload}
        incomplete_payload.pop("business_name")

        response = self.client.post(self.url, incomplete_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("business_name", response.data)


class BusinessAuthViewTests(APITestCase):
    def setUp(self):
        self.business = Business.objects.create(
            name="Auth Biz",
            reward_rate=Decimal("1.0"),
            redemption_points=100,
            redemption_rate=Decimal("0.10"),
            logo_url="https://example.com/logo.png",
            primary_color="#000000",
            background_color="#ffffff",
        )
        self.user = BusinessUser.objects.create_user(
            username="owner1",
            email="owner@example.com",
            password="pass1234",
            business=self.business,
        )

    def test_login_with_username(self):
        response = self.client.post(
            reverse("accounts-login"),
            {"username": "owner1", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["business"]["name"], self.business.name)

    def test_login_with_email(self):
        response = self.client.post(
            reverse("accounts-login"),
            {"username": "owner@example.com", "password": "pass1234"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            reverse("accounts-login"),
            {"username": "owner1", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)


class CurrentUserViewTests(APITestCase):
    def setUp(self):
        self.business = Business.objects.create(
            name="Current User Biz",
            reward_rate=Decimal("1.0"),
            redemption_points=100,
            redemption_rate=Decimal("0.10"),
            logo_url="https://example.com/logo.png",
            primary_color="#000000",
            background_color="#ffffff",
        )
        self.user = BusinessUser.objects.create_user(
            username="currentuser",
            password="pass1234",
            business=self.business,
        )

    def test_requires_authentication(self):
        response = self.client.get(reverse("accounts-me"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_user_when_authenticated(self):
        self.client.login(username="currentuser", password="pass1234")
        response = self.client.get(reverse("accounts-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["business"]["name"], self.business.name)


class LogoutViewTests(APITestCase):
    def setUp(self):
        self.business = Business.objects.create(
            name="Logout Biz",
            reward_rate=Decimal("1.0"),
            redemption_points=100,
            redemption_rate=Decimal("0.10"),
            logo_url="https://example.com/logo.png",
            primary_color="#000000",
            background_color="#ffffff",
        )
        self.user = BusinessUser.objects.create_user(
            username="logoutuser",
            password="pass1234",
            business=self.business,
        )

    def test_logout_clears_session(self):
        self.client.login(username="logoutuser", password="pass1234")
        response = self.client.post(reverse("accounts-logout"))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        me_response = self.client.get(reverse("accounts-me"))
        self.assertEqual(me_response.status_code, status.HTTP_403_FORBIDDEN)
