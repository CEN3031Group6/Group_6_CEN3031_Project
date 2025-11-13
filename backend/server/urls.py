from django.urls import path, include
from django.contrib import admin

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("passkit/", include("api.passkit_urls")),
    path("accounts/", include("accounts.urls")),
    path("api-auth/", include("rest_framework.urls")),
]
