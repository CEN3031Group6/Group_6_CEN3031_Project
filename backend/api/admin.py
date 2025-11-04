from django.contrib import admin
from .models import Business, Customer, BusinessCustomer, LoyaltyCard, Station, Transaction


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone_number")
    search_fields = ("name", "phone_number")


@admin.register(BusinessCustomer)
class BusinessCustomerAdmin(admin.ModelAdmin):
    list_display = ("business", "customer")
    list_filter = ("business",)
    search_fields = ("customer__name", "customer__phone_number")


@admin.register(LoyaltyCard)
class LoyaltyCardAdmin(admin.ModelAdmin):
    list_display = ("token", "get_business", "get_customer", "points_balance", "wallet_status")
    list_filter = ("business_customer__business", "wallet_status")
    search_fields = ("business_customer__customer__name", "business_customer__customer__phone_number")

    def get_business(self, obj):
        return obj.business_customer.business
    get_business.short_description = "Business"

    def get_customer(self, obj):
        return obj.business_customer.customer
    get_customer.short_description = "Customer"


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("name", "business")
    list_filter = ("business",)
    search_fields = ("name", "business__name")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "loyalty_card", "station", "amount", "points_earned", "created_at")
    list_filter = ("created_at", "station")
    search_fields = (
        "loyalty_card__business_customer__customer__name",
        "loyalty_card__business_customer__customer__phone_number",
    )

