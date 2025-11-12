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
