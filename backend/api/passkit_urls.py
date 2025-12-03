from django.urls import path

from .passkit_views import (
    DeviceRegistrationListView,
    DeviceRegistrationView,
    PassDownloadView,
    PassKitLogView,
)

urlpatterns = [
    path(
        "v1/devices/<str:device_library_identifier>/registrations/<str:pass_type_identifier>/<uuid:serial_number>",
        DeviceRegistrationView.as_view(),
        name="passkit-device-registration",
    ),
    path(
        "v1/devices/<str:device_library_identifier>/registrations/<str:pass_type_identifier>",
        DeviceRegistrationListView.as_view(),
        name="passkit-device-registration-list",
    ),
    path(
        "v1/passes/<str:pass_type_identifier>/<uuid:serial_number>",
        PassDownloadView.as_view(),
        name="passkit-pass-download",
    ),
    path(
        "v1/log",
        PassKitLogView.as_view(),
        name="passkit-log",
    ),
]
