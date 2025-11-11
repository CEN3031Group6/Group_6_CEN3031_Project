from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import BusinessUser

@admin.register(BusinessUser)
class BusinessUserAdmin(UserAdmin):
    model = BusinessUser
    list_display = ('username', 'email', 'business', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'business')
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password', 'business')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'business', 'is_staff', 'is_active'),
        }),
    )
    search_fields = ('username', 'email')
    ordering = ('username',)
