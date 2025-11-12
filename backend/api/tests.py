import uuid
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import BusinessUser
from api.models import Business, BusinessCustomer, Customer, LoyaltyCard, Station


def create_business(name="Primary Biz"):
    return Business.objects.create(
        name=name,
        reward_rate=Decimal("1.500"),
        redemption_points=75,
        redemption_rate=Decimal("0.15"),
        logo_url=f"https://example.com/{name.replace(' ', '').lower()}.png",
        primary_color="#111111",
        background_color="#eeeeee",
    )


def unique_phone():
    return "+1" + str(uuid.uuid4().int)[:10]


class AuthenticatedBusinessAPITestCase(APITestCase):
    def setUp(self):
        super().setUp()
        self.business = create_business()
        self.user = BusinessUser.objects.create_user(
            username="owner",
            password="pass1234",
            business=self.business,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.user)

    def create_customer(self, name):
        return Customer.objects.create(name=name, phone_number=unique_phone())


class BusinessViewSetTests(AuthenticatedBusinessAPITestCase):
    def test_list_returns_only_authenticated_business(self):
        create_business(name="Other Biz")

        response = self.client.get(reverse("business-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(self.business.pk))


class BusinessCustomerViewSetTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("businesscustomer-list")

    def test_list_is_scoped_to_authenticated_business(self):
        owned_customer = self.create_customer("Alice")
        owned_relation = BusinessCustomer.objects.create(
            business=self.business,
            customer=owned_customer,
        )

        other_business = create_business("Other Biz")
        other_customer = Customer.objects.create(
            name="Bob",
            phone_number=unique_phone(),
        )
        BusinessCustomer.objects.create(
            business=other_business,
            customer=other_customer,
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(owned_relation.pk))

    def test_create_assigns_business_automatically(self):
        customer = self.create_customer("Charlie")

        response = self.client.post(
            self.url,
            {"customer_id": str(customer.pk)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["business"]["id"], str(self.business.pk))
        self.assertEqual(response.data["customer"]["id"], str(customer.pk))


class LoyaltyCardViewSetTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("loyaltycard-list")
        self.business_customer = BusinessCustomer.objects.create(
            business=self.business,
            customer=self.create_customer("Dana"),
        )

    def test_list_only_returns_cards_for_business(self):
        owned_card = LoyaltyCard.objects.create(
            business_customer=self.business_customer,
            points_balance=25,
        )

        other_business = create_business("Other Biz")
        other_bc = BusinessCustomer.objects.create(
            business=other_business,
            customer=Customer.objects.create(
                name="Eve",
                phone_number=unique_phone(),
            ),
        )
        LoyaltyCard.objects.create(
            business_customer=other_bc,
            points_balance=70,
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["token"], str(owned_card.token))

    def test_create_card_for_own_customer(self):
        response = self.client.post(
            self.url,
            {"business_customer_id": str(self.business_customer.pk)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["business_customer"]["id"], str(self.business_customer.pk))
        self.assertEqual(response.data["points_balance"], 0)


class StationViewSetTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("station-list")

    def test_list_returns_only_business_stations(self):
        Station.objects.create(business=self.business, name="Front Counter")

        other_business = create_business("Other Biz")
        Station.objects.create(business=other_business, name="Back Counter")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["business"]["id"], str(self.business.pk))

    def test_create_station_generates_api_token(self):
        response = self.client.post(
            self.url,
            {"name": "Register A"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["business"]["id"], str(self.business.pk))
        self.assertEqual(response.data["name"], "Register A")
        self.assertEqual(len(response.data["api_token"]), 64)

        station = Station.objects.get(pk=response.data["id"])
        self.assertEqual(station.business, self.business)
        self.assertEqual(len(station.api_token), 64)


class CustomerViewSetPermissionTests(APITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("customer-list")
        self.customer = Customer.objects.create(
            name="Sample Customer",
            phone_number=unique_phone(),
        )

    def test_non_admin_is_forbidden(self):
        user = BusinessUser.objects.create_user(
            username="basic-user",
            password="pass1234",
            business=create_business("Basic Biz"),
            is_staff=False,
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_customers(self):
        admin_user = BusinessUser.objects.create_user(
            username="admin-user",
            password="pass1234",
            business=create_business("Admin Biz"),
            is_staff=True,
        )
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(self.customer.pk))
