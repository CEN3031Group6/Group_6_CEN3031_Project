from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Business, Customer, LoyaltyCard, Station, Transaction


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('__str__',)  # uses model's __str__
    search_fields = ('user__username', 'phone_number')


@admin.register(LoyaltyCard)
class LoyaltyCardAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'business', 'customer')
    list_filter = ('business',)
    search_fields = ('customer__user__username',)


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('name', 'business')
    list_filter = ('business',)
    search_fields = ('name',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'loyalty_card', 'station', 'amount', 'created_at')
    list_filter = ('created_at', 'station__business')
    search_fields = ('loyalty_card__customer__user__username',)