from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessViewSet, CustomerViewSet, LoyaltyCardViewSet, StationViewSet, TransactionViewSet

router = DefaultRouter()

router.register(r'business', BusinessViewSet)
router.register(r'customer', CustomerViewSet)
router.register(r'loyaltycard', LoyaltyCardViewSet)
router.register(r'station', StationViewSet)
router.register(r'transaction', TransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]