from django.db import models
import secrets
import uuid

class Business(models.Model):

    id = models.UUIDField(
        primary_key = True,
        default = uuid.uuid4,
        editable = False
    )

    name = models.CharField(
        max_length = 100,
        unique = True
    )
    # How many points a customer earns per unit of currency spent.
    reward_rate = models.DecimalField(
        max_digits = 6,
        decimal_places = 3,
        help_text = "Points awarded per 1.00 currency unit"
    )
    # The number of points needed to redeem a reward.
    redemption_points = models.PositiveIntegerField(
        help_text = "Amount of points needed to redeem a reward"
    )

    # The monetary value of one redemption or reward in percentage for discount.
    redemption_rate = models.DecimalField(
        max_digits = 3,
        decimal_places = 2,
        help_text = "Discount percentage in decimal form for reward on a redemption"
    )

    logo_url = models.URLField()

    primary_color = models.CharField(
        max_length = 7,
        default = "#000000"
    )

    background_color = models.CharField(
        max_length = 7,
        default = "#FFFFFF"
    )

    def __str__(self):
        return self.name

class Customer(models.Model):

    id = models.UUIDField(
        primary_key = True,
        default = uuid.uuid4,
        editable = False
    )

    name = models.CharField(
        max_length = 100
    )

    phone_number = models.CharField(
        max_length = 20,
        unique = True
    )

    def __str__(self):
        return self.name

class BusinessCustomer(models.Model):

    id = models.UUIDField(
        primary_key = True,
        default = uuid.uuid4,
        editable = False
    )

    business = models.ForeignKey(
        Business,
        on_delete = models.CASCADE
    )

    customer = models.ForeignKey(
        Customer,
        on_delete = models.PROTECT
    )

    class Meta:
        unique_together = ('business', 'customer')

    def __str__(self):
        return f"{self.business} | {self.customer}"


class LoyaltyCard(models.Model):

    business_customer = models.ForeignKey(
        BusinessCustomer,
        on_delete = models.CASCADE
    )

    token = models.UUIDField(
        primary_key = True,
        default = uuid.uuid4,
        editable = False
    )

    points_balance = models.PositiveIntegerField(
        default = 0
    )

    created_at = models.DateTimeField(
        auto_now_add = True
    )

    updated_at = models.DateTimeField(
        auto_now = True
    )

    apple_pass_id = models.CharField(
        max_length = 128,
        blank = True,
        null = True
    )

    google_pass_id = models.CharField(
        max_length=128,
        blank=True,
        null=True
    )

    apple_push_token = models.CharField(
        max_length = 256,
        blank = True,
        null = True
    )

    wallet_status = models.CharField(
        max_length = 20,
        choices=[('active', 'Active'),
                 ('revoked', 'Revoked'),
                 ('expired', 'Expired')],
        default='active'
    )

    def __str__(self):
        return f"Customer: {self.business_customer.customer.name} | Points: {self.points_balance}"

class Station(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    api_token = models.CharField(
        max_length=64,
        unique=True,
        editable=False
    )

    def save(self, *args, **kwargs):
        if not self.api_token:
            self.api_token = secrets.token_hex(32)
        super().save(*args, **kwargs)

    business = models.ForeignKey(
        Business,
        on_delete = models.CASCADE
    )

    name = models.CharField(
        max_length = 50
    )

    def __str__(self):
        return f"{self.name} ({self.business.name})"

class Transaction(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    loyalty_card = models.ForeignKey(
        LoyaltyCard,
        on_delete = models.CASCADE
    )

    station = models.ForeignKey(
        Station,
        on_delete = models.CASCADE
    )

    points_earned = models.PositiveIntegerField(
        default = 0
    )

    amount = models.DecimalField(
        max_digits = 10,
        decimal_places = 2
    )

    created_at = models.DateTimeField(
        auto_now_add = True
    )

    def __str__(self):
        return f"Txn {self.id} | {self.points_earned} pts"


