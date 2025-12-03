import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import httpx
import jwt
from django.conf import settings

logger = logging.getLogger(__name__)


def _resolve_path(path_value: str) -> Optional[Path]:
    if not path_value:
        return None
    path = Path(path_value)
    if not path.is_absolute():
        path = Path(settings.BASE_DIR) / path
    return path


@dataclass
class PassRegistrationPayload:
    push_token: str
    serial_number: str


class AppleWalletPushClient:
    def __init__(self):
        self._private_key: Optional[str] = None
        self._jwt_token: Optional[str] = None
        self._jwt_issued_at: int = 0

    @property
    def _host(self) -> str:
        env = (getattr(settings, "APNS_ENV", "production") or "production").lower()
        if env in {"sandbox", "development", "dev"}:
            return "https://api.sandbox.push.apple.com"
        return "https://api.push.apple.com"

    @property
    def _topic(self) -> Optional[str]:
        topic = getattr(settings, "APNS_TOPIC", None)
        if topic:
            return topic
        return getattr(settings, "APPLE_PASS_TYPE_IDENTIFIER", None)

    def is_configured(self) -> bool:
        key_path = _resolve_path(getattr(settings, "APNS_AUTH_KEY_PATH", ""))
        return all(
            [
                getattr(settings, "APNS_KEY_ID", None),
                getattr(settings, "APNS_TEAM_ID", None),
                self._topic,
                key_path and key_path.is_file(),
            ]
        )

    def _load_private_key(self) -> Optional[str]:
        if self._private_key is not None:
            return self._private_key

        path = _resolve_path(getattr(settings, "APNS_AUTH_KEY_PATH", ""))
        if not path:
            logger.warning("APNs auth key path missing; cannot send wallet pushes.")
            return None

        try:
            self._private_key = path.read_text().strip()
        except OSError as exc:
            logger.warning("Failed to load APNs auth key: %s", exc)
            self._private_key = None
        return self._private_key

    def _current_jwt(self) -> Optional[str]:
        now = int(time.time())
        if self._jwt_token and now - self._jwt_issued_at < 45 * 60:
            return self._jwt_token

        private_key = self._load_private_key()
        key_id = getattr(settings, "APNS_KEY_ID", None)
        team_id = getattr(settings, "APNS_TEAM_ID", None)

        if not all([private_key, key_id, team_id]):
            return None

        headers = {"alg": "ES256", "kid": key_id}
        claims = {"iss": team_id, "iat": now}
        try:
            self._jwt_token = jwt.encode(
                claims,
                private_key,
                algorithm="ES256",
                headers=headers,
            )
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to create APNs JWT: %s", exc)
            self._jwt_token = None
            return None

        self._jwt_issued_at = now
        return self._jwt_token

    def send_pass_update(self, payload: PassRegistrationPayload) -> bool:
        if not self.is_configured():
            return False

        token = self._current_jwt()
        topic = self._topic
        if not token or not topic:
            return False

        url = f"{self._host}/3/device/{payload.push_token}"
        headers = {
            "authorization": f"bearer {token}",
            "apns-topic": topic,
            "apns-push-type": "background",
            "apns-priority": "5",
        }

        try:
            with httpx.Client(http2=True, timeout=10.0) as client:
                response = client.post(url, headers=headers, json={})
        except httpx.HTTPError as exc:
            logger.warning("APNs push failed for %s: %s", payload.serial_number, exc)
            return False

        if response.status_code not in (200, 201):
            logger.warning(
                "APNs push error (%s) for %s: %s",
                response.status_code,
                payload.serial_number,
                response.text,
            )
            return False

        return True


_client: Optional[AppleWalletPushClient] = None


def get_wallet_push_client() -> AppleWalletPushClient:
    global _client
    if _client is None:
        _client = AppleWalletPushClient()
    return _client


def send_wallet_pass_update(pass_payloads: Iterable[PassRegistrationPayload]) -> None:
    client = get_wallet_push_client()
    if not pass_payloads:
        return

    for payload in pass_payloads:
        client.send_pass_update(payload)
