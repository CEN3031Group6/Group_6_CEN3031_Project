import uuid
from decimal import Decimal

from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import BusinessUser
from api.models import Business, BusinessCustomer, Customer, LoyaltyCard, Station, PassRegistration, Transaction
from api.passkit import ensure_card_auth_token


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

    def create_station(self, name="Front Counter"):
        return Station.objects.create(business=self.business, name=name)


class BusinessViewSetTests(AuthenticatedBusinessAPITestCase):
    def test_list_returns_only_authenticated_business(self):
        create_business(name="Other Biz")

        response = self.client.get(reverse("business-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], str(self.business.pk))


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
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], str(owned_relation.pk))

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
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["token"], str(owned_card.token))

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
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["business"]["id"], str(self.business.pk))

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
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], str(self.customer.pk))


class LoyaltyCardIssuanceTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.station = self.create_station()
        self.client.credentials(HTTP_X_STATION_TOKEN=self.station.api_token)
        self.url = reverse("loyaltycard-issue")

    def test_issue_creates_customer_link_and_card(self):
        payload = {"customer_name": "Sam Customer", "phone_number": "(555) 111-2222"}
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 1)
        self.assertEqual(BusinessCustomer.objects.count(), 1)
        self.assertEqual(LoyaltyCard.objects.count(), 1)

        station = Station.objects.get(pk=self.station.pk)
        self.assertIsNotNone(station.prepared_loyalty_card)
        self.assertIn("prepared_pass_url", response.data)
        self.assertEqual(response.data["loyalty_card"]["qr_payload"], response.data["loyalty_card"]["token"])

    def test_issue_is_idempotent_for_phone(self):
        payload = {"customer_name": "Sam Customer", "phone_number": "(555) 111-2222"}
        first = self.client.post(self.url, payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.client.post(self.url, payload, format="json")
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 1)
        self.assertEqual(BusinessCustomer.objects.count(), 1)
        self.assertEqual(LoyaltyCard.objects.count(), 1)


class StationPreparedPassTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.station = self.create_station()
        self.client.credentials(HTTP_X_STATION_TOKEN=self.station.api_token)
        self.issue_url = reverse("loyaltycard-issue")

    def test_prepared_pass_endpoint_returns_and_clears_card(self):
        payload = {"customer_name": "Jess", "phone_number": "555-222-3333"}
        self.client.post(self.issue_url, payload, format="json")

        url = reverse("station-prepared-pass", args=[self.station.pk])
        response = self.client.get(f"{url}?token={self.station.api_token}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("loyalty_card_token", response.data)

        station = Station.objects.get(pk=self.station.pk)
        self.assertIsNone(station.prepared_loyalty_card)


class TransactionFlowTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.station = self.create_station()
        self.client.credentials(HTTP_X_STATION_TOKEN=self.station.api_token)
        self.business.reward_rate = Decimal("1.500")
        self.business.redemption_points = 100
        self.business.redemption_rate = Decimal("0.10")
        self.business.save()

        customer = self.create_customer("Dana")
        bc = BusinessCustomer.objects.create(business=self.business, customer=customer)
        self.card = LoyaltyCard.objects.create(business_customer=bc, points_balance=0)
        self.url = reverse("transaction-list")

    def test_transaction_accrues_points(self):
        payload = {"loyalty_card_id": str(self.card.pk), "amount": "12.00"}
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["points_earned"], 18)
        self.assertEqual(response.data["points_redeemed"], 0)
        self.assertEqual(response.data["final_amount"], "12.00")

        self.card.refresh_from_db()
        self.assertEqual(self.card.points_balance, 18)

    def test_transaction_redeems_when_requested_and_sufficient_points(self):
        self.card.points_balance = 110
        self.card.save()

        payload = {"loyalty_card_id": str(self.card.pk), "amount": "50.00", "redeem": True}
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["points_redeemed"], 100)
        self.assertEqual(response.data["final_amount"], "45.00")

        self.card.refresh_from_db()
        self.assertEqual(self.card.points_balance, 85)

    def test_transaction_rejects_station_from_other_business(self):
        other_business = create_business("Other Biz")
        other_station = Station.objects.create(business=other_business, name="Other Station")

        payload = {"loyalty_card_id": str(self.card.pk), "amount": "10.00"}
        self.client.credentials(HTTP_X_STATION_TOKEN=other_station.api_token)
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class BusinessCustomerDeletionTests(AuthenticatedBusinessAPITestCase):
    def test_delete_prunes_customer_when_no_other_links(self):
        customer = self.create_customer("Ruth")
        bc = BusinessCustomer.objects.create(business=self.business, customer=customer)
        LoyaltyCard.objects.create(business_customer=bc)

        url = reverse("businesscustomer-detail", args=[bc.pk])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Customer.objects.filter(pk=customer.pk).exists())


class PassKitEndpointsTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.station = self.create_station()
        customer = self.create_customer("Kara")
        bc = BusinessCustomer.objects.create(business=self.business, customer=customer)
        self.card = LoyaltyCard.objects.create(business_customer=bc, points_balance=10)
        ensure_card_auth_token(self.card)

    def test_station_prepared_pass_returns_pkpass(self):
        self.station.prepared_loyalty_card = self.card
        self.station.save(update_fields=["prepared_loyalty_card"])

        url = reverse("station-prepared-pass", args=[self.station.pk])
        response = self.client.get(f"{url}?token={self.station.api_token}&platform=apple&clear=false")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/vnd.apple.pkpass")

    def test_device_registration_and_listing(self):
        pass_type = settings.APPLE_PASS_TYPE_IDENTIFIER
        device_id = "ABC123DEVICE"
        register_url = reverse(
            "passkit-device-registration",
            args=[device_id, pass_type, self.card.token],
        )
        auth_header = f"ApplePass {self.card.apple_auth_token}"

        post_response = self.client.post(
            register_url,
            {"pushToken": "push-token-1"},
            format="json",
            HTTP_AUTHORIZATION=auth_header,
        )
        self.assertEqual(post_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            PassRegistration.objects.filter(
                loyalty_card=self.card,
                device_library_identifier=device_id,
            ).exists()
        )

        list_url = reverse(
            "passkit-device-registration-list",
            args=[device_id, pass_type],
        )
        list_response = self.client.get(list_url, {"passesUpdatedSince": "1970-01-01T00:00:00Z"})
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertIn(str(self.card.token), list_response.data["serialNumbers"])

    def test_pass_download_requires_authorization(self):
        pass_type = settings.APPLE_PASS_TYPE_IDENTIFIER
        download_url = reverse(
            "passkit-pass-download",
            args=[pass_type, self.card.token],
        )

        forbidden = self.client.get(download_url)
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.get(
            download_url,
            HTTP_AUTHORIZATION=f"ApplePass {self.card.apple_auth_token}",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/vnd.apple.pkpass")


class DashboardMetricsTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("dashboard-metrics")
        self.station = self.create_station()

        repeat_customer = self.create_customer("Repeat Customer")
        self.repeat_bc = BusinessCustomer.objects.create(
            business=self.business,
            customer=repeat_customer,
        )
        self.repeat_card = LoyaltyCard.objects.create(business_customer=self.repeat_bc)

        single_customer = self.create_customer("Single Customer")
        self.single_bc = BusinessCustomer.objects.create(
            business=self.business,
            customer=single_customer,
        )
        self.single_card = LoyaltyCard.objects.create(business_customer=self.single_bc)

        Transaction.objects.create(
            loyalty_card=self.repeat_card,
            station=self.station,
            amount=Decimal("10.00"),
            points_earned=10,
            points_redeemed=100,
        )
        Transaction.objects.create(
            loyalty_card=self.repeat_card,
            station=self.station,
            amount=Decimal("5.00"),
            points_earned=5,
            points_redeemed=0,
        )
        Transaction.objects.create(
            loyalty_card=self.single_card,
            station=self.station,
            amount=Decimal("8.00"),
            points_earned=8,
            points_redeemed=0,
        )

        PassRegistration.objects.create(
            loyalty_card=self.repeat_card,
            device_library_identifier="device-123",
            pass_type_identifier="pass.test",
            push_token="push-token",
        )

    def test_dashboard_metrics(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_loyalty_cards"], 2)
        self.assertEqual(response.data["repeat_customers"], 1)
        self.assertEqual(response.data["wallet_pass_installs"], 1)
        self.assertEqual(response.data["points_redeemed_7d"], 100)


class DashboardDetailTests(AuthenticatedBusinessAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("dashboard-data")
        self.station = self.create_station()

        cust = self.create_customer("Detail Dana")
        bc = BusinessCustomer.objects.create(business=self.business, customer=cust)
        card = LoyaltyCard.objects.create(business_customer=bc)

        Transaction.objects.create(
            loyalty_card=card,
            station=self.station,
            amount=Decimal("12.34"),
            points_earned=12,
            points_redeemed=0,
        )

    def test_dashboard_detail_payload(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("station_readiness", response.data)
        self.assertIn("revenue_trend", response.data)
        self.assertIn("recent_transactions", response.data)
        self.assertIn("top_customers", response.data)
