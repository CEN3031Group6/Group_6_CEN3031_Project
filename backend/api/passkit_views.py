from django.conf import settings
from django.http import HttpResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LoyaltyCard
from .passkit import (
    build_pkpass,
    ensure_card_auth_token,
    list_serial_numbers,
    register_device,
    unregister_device,
)


def _expected_pass_type():
    return settings.APPLE_PASS_TYPE_IDENTIFIER


def _require_pass_type(pass_type_identifier: str):
    if pass_type_identifier != _expected_pass_type():
        raise NotFound("Unknown pass type identifier.")


def _get_card(serial_number):
    return get_object_or_404(LoyaltyCard, token=serial_number)


def _require_pass_authorization(request, card: LoyaltyCard):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("ApplePass "):
        raise PermissionDenied("Missing ApplePass authorization header.")
    token = auth_header.split(" ", 1)[1].strip()
    ensure_card_auth_token(card)
    if token != card.apple_auth_token:
        raise PermissionDenied("Invalid pass authentication token.")


class DeviceRegistrationView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, device_library_identifier, pass_type_identifier, serial_number):
        _require_pass_type(pass_type_identifier)
        card = _get_card(serial_number)
        _require_pass_authorization(request, card)

        push_token = request.data.get("pushToken")
        if not push_token:
            return Response({"error": "pushToken required"}, status=status.HTTP_400_BAD_REQUEST)

        created = register_device(card, device_library_identifier, pass_type_identifier, push_token)
        return Response(status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request, device_library_identifier, pass_type_identifier, serial_number):
        _require_pass_type(pass_type_identifier)
        card = _get_card(serial_number)
        _require_pass_authorization(request, card)

        unregister_device(card, device_library_identifier, pass_type_identifier)
        return Response(status=status.HTTP_200_OK)

    def get(self, *args, **kwargs):
        return HttpResponseNotAllowed(["POST", "DELETE"])


class DeviceRegistrationListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, device_library_identifier, pass_type_identifier):
        _require_pass_type(pass_type_identifier)
        passes_updated_since = request.query_params.get("passesUpdatedSince")
        serials, last_updated = list_serial_numbers(
            device_library_identifier,
            pass_type_identifier,
            passes_updated_since,
        )
        return Response(
            {
                "lastUpdated": last_updated,
                "serialNumbers": serials,
            }
        )


class PassDownloadView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, pass_type_identifier, serial_number):
        _require_pass_type(pass_type_identifier)
        card = _get_card(serial_number)
        _require_pass_authorization(request, card)
        pkpass = build_pkpass(card)
        response = HttpResponse(pkpass, content_type="application/vnd.apple.pkpass")
        response["Content-Disposition"] = f'attachment; filename="{serial_number}.pkpass"'
        return response
