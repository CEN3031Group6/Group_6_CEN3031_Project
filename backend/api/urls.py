from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessViewSet, CustomerViewSet, BusinessCustomerViewSet, LoyaltyCardViewSet, StationViewSet, TransactionViewSet

router = DefaultRouter()

router.register(r'businesses', BusinessViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'businesscustomers', BusinessCustomerViewSet)
router.register(r'loyaltycards', LoyaltyCardViewSet)
router.register(r'stations', StationViewSet)
router.register(r'transactions', TransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]