from django.urls import path
from .views import BusinessSignupView

urlpatterns = [
    path("business-signup/", BusinessSignupView.as_view(), name="business-signup"),
]
