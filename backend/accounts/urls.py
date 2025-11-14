from django.urls import path
from .views import (
    BusinessLoginView,
    BusinessLogoutView,
    BusinessSignupView,
    CurrentUserView,
    PasswordUpdateView,
)

urlpatterns = [
    path("business-signup/", BusinessSignupView.as_view(), name="business-signup"),
    path("login/", BusinessLoginView.as_view(), name="accounts-login"),
    path("logout/", BusinessLogoutView.as_view(), name="accounts-logout"),
    path("me/", CurrentUserView.as_view(), name="accounts-me"),
    path("password/", PasswordUpdateView.as_view(), name="accounts-password"),
]
