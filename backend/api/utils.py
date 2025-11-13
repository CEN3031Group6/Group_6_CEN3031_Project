import re
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
from .models import Station

def resolve_station_from_request(request):
    token = request.headers.get("X-Station-Token")
    if not token:
        raise NotAuthenticated("Missing X-Station-Token header.")
    try:
        return Station.objects.select_related("business").get(api_token=token)
    except Station.DoesNotExist:
        raise AuthenticationFailed("Invalid station token.")


def normalize_phone_number(value: str) -> str:
    """
    Basic normalization that keeps digits only and returns an E.164-like +<digits> format.
    Assumes US numbers when 10 digits are provided.
    """
    digits = re.sub(r"\D", "", value or "")
    if not digits:
        return ""
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        digits = f"1{digits}"
    return f"+{digits}"
