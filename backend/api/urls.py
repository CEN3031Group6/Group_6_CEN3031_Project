from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusinessViewSet,
    CustomerViewSet,
    BusinessCustomerViewSet,
    LoyaltyCardViewSet,
    StationViewSet,
    TransactionViewSet,
    LoyaltyCardIssueView,
    StationPreparedPassView,
    LoyaltyCardQRView,
    DashboardMetricsView,
    DashboardDetailView,
)

router = DefaultRouter()

router.register(r'businesses', BusinessViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'businesscustomers', BusinessCustomerViewSet)
router.register(r'loyaltycards', LoyaltyCardViewSet)
router.register(r'stations', StationViewSet)
router.register(r'transactions', TransactionViewSet)


urlpatterns = [
    path('loyaltycards/issue/', LoyaltyCardIssueView.as_view(), name='loyaltycard-issue'),
    path('loyaltycards/<uuid:token>/qr/', LoyaltyCardQRView.as_view(), name='loyaltycard-qr'),
    path('stations/<uuid:pk>/prepared-pass/', StationPreparedPassView.as_view(), name='station-prepared-pass'),
    path('dashboard-metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('dashboard-data/', DashboardDetailView.as_view(), name='dashboard-data'),
    path('', include(router.urls)),
]
