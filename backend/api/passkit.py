import base64
import hashlib
import json
import logging
import os
import subprocess
import tempfile
import zipfile
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from shutil import copyfile

from django.conf import settings
from django.utils import timezone

from .models import LoyaltyCard, PassRegistration
from .push import PassRegistrationPayload, send_wallet_pass_update


logger = logging.getLogger(__name__)

PLACEHOLDER_ICON = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
)


class PassKitError(Exception):
    pass


def ensure_card_auth_token(card: LoyaltyCard) -> LoyaltyCard:
    if not card.apple_auth_token:
        secret = getattr(settings, "APPLE_PASS_AUTH_TOKEN_SECRET", "changeme")
        raw = f"{secret}:{card.token}:{timezone.now().timestamp()}".encode("utf-8")
        card.apple_auth_token = hashlib.sha256(raw).hexdigest()
        card.save(update_fields=["apple_auth_token", "updated_at"])
    return card


def _write_placeholder_png(path: Path):
    with open(path, "wb") as image_file:
        image_file.write(PLACEHOLDER_ICON)


def _resolve_asset_dir() -> Path:
    configured = getattr(settings, "APPLE_PASS_ASSET_DIR", "")
    path = Path(configured) if configured else Path(settings.BASE_DIR) / "certs"
    if not path.is_absolute():
        path = Path(settings.BASE_DIR) / path
    return path


def _write_assets(tmpdir: Path):
    asset_dir = _resolve_asset_dir()
    assets = {}

    def copy_with_fallback(dest: str, *candidates: str) -> Path:
        dest_path = tmpdir / dest
        copied = False
        for candidate in candidates:
            src_path = asset_dir / candidate
            if src_path.exists():
                try:
                    copyfile(src_path, dest_path)
                    copied = True
                    break
                except OSError:
                    copied = False
        if not copied:
            _write_placeholder_png(dest_path)
        return dest_path

    assets["icon.png"] = copy_with_fallback("icon.png", "icon.png", "icon@2x.png")
    assets["icon@2x.png"] = copy_with_fallback("icon@2x.png", "icon@2x.png", "icon.png")
    assets["logo.png"] = copy_with_fallback("logo.png", "logo.png", "logo@2x.png")
    assets["logo@2x.png"] = copy_with_fallback("logo@2x.png", "logo@2x.png", "logo.png")
    assets["strip.png"] = copy_with_fallback("strip.png", "strip.png", "strip@2x.png")
    assets["strip@2x.png"] = copy_with_fallback("strip@2x.png", "strip@2x.png", "strip.png")

    return assets


def _build_pass_json(card: LoyaltyCard) -> dict:
    business = card.business_customer.business
    earn_rate = business.reward_rate.quantize(Decimal("1"))
    redeem_percent = (business.redemption_rate * 100).quantize(Decimal("1"))
    return {
        "formatVersion": 1,
        "passTypeIdentifier": settings.APPLE_PASS_TYPE_IDENTIFIER,
        "serialNumber": str(card.token),
        "teamIdentifier": settings.APPLE_PASS_TEAM_ID,
        "organizationName": business.name,
        "description": f"{business.name} Loyalty",
        "logoText": business.name,
        "backgroundColor": business.background_color,
        "foregroundColor": business.primary_color,
        "labelColor": "#FFFFFF",
        "webServiceURL": settings.APPLE_PASS_WEB_SERVICE_URL,
        "authenticationToken": card.apple_auth_token,
        "barcode": {
            "format": "PKBarcodeFormatQR",
            "message": str(card.token),
            "messageEncoding": "iso-8859-1",
        },
        "barcodes": [
            {
                "format": "PKBarcodeFormatQR",
                "message": str(card.token),
                "messageEncoding": "iso-8859-1",
            }
        ],
        "storeCard": {
            "primaryFields": [
                {
                    "key": "points",
                    "label": "Points Balance",
                    "value": card.points_balance,
                }
            ],
            "secondaryFields": [
                {
                    "key": "reward_rate",
                    "label": "Earn Rate",
                    "value": f"{earn_rate} pt per $1",
                },
                {
                    "key": "redeem",
                    "label": "Redeem",
                    "value": f"{business.redemption_points} pts → {redeem_percent}% off",
                },
            ],
            "backFields": [
                {
                    "key": "customer",
                    "label": "Customer",
                    "value": card.business_customer.customer.name,
                },
                {
                    "key": "phone",
                    "label": "Phone",
                    "value": card.business_customer.customer.phone_number,
                },
            ],
        },
    }


def _create_manifest(file_map):
    manifest = {}
    for name, path in file_map.items():
        with open(path, "rb") as handle:
            manifest[name] = hashlib.sha1(handle.read()).hexdigest()
    return manifest


def _write_manifest(tmpdir: Path, manifest: dict):
    manifest_path = tmpdir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as manifest_file:
        json.dump(manifest, manifest_file, separators=(",", ":"))
    return manifest_path


def _have_signing_materials() -> bool:
    cert_path = getattr(settings, "APPLE_PASS_CERT_PATH", "")
    wwdr_path = getattr(settings, "APPLE_PASS_WWDR_CERT_PATH", "")
    return os.path.exists(cert_path) and os.path.exists(wwdr_path)


def _create_signature(tmpdir: Path, manifest_path: Path):
    cert_path = settings.APPLE_PASS_CERT_PATH
    wwdr_path = settings.APPLE_PASS_WWDR_CERT_PATH
    password = settings.APPLE_PASS_CERT_PASSWORD

    signer_cert = tmpdir / "signer_cert.pem"
    signer_key = tmpdir / "signer_key.pem"
    wwdr_pem = tmpdir / "wwdr.pem"

    try:
        subprocess.run(
            [
                "openssl",
                "pkcs12",
                "-in",
                cert_path,
                "-clcerts",
                "-nokeys",
                "-out",
                str(signer_cert),
                "-passin",
                f"pass:{password}",
                "-passout",
                "pass:",
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        subprocess.run(
            [
                "openssl",
                "pkcs12",
                "-in",
                cert_path,
                "-nocerts",
                "-nodes",
                "-out",
                str(signer_key),
                "-passin",
                f"pass:{password}",
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        subprocess.run(
            [
                "openssl",
                "x509",
                "-in",
                wwdr_path,
                "-inform",
                "DER",
                "-out",
                str(wwdr_pem),
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        signature_path = tmpdir / "signature"
        subprocess.run(
            [
                "openssl",
                "smime",
                "-binary",
                "-sign",
                "-certfile",
                str(wwdr_pem),
                "-signer",
                str(signer_cert),
                "-inkey",
                str(signer_key),
                "-in",
                str(manifest_path),
                "-out",
                str(signature_path),
                "-outform",
                "DER",
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        return signature_path
    except subprocess.CalledProcessError as exc:
        logger.warning("Failed to sign pass manifest: %s", exc)
        raise PassKitError("Could not sign pass manifest.") from exc


def _write_unsigned_signature(tmpdir: Path):
    signature_path = tmpdir / "signature"
    with open(signature_path, "wb") as sig:
        sig.write(b"unsigned")
    return signature_path


def build_pkpass(card: LoyaltyCard) -> bytes:
    ensure_card_auth_token(card)

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)

        assets = _write_assets(tmpdir)
        pass_body = _build_pass_json(card)
        pass_json_path = tmpdir / "pass.json"
        with open(pass_json_path, "w", encoding="utf-8") as pass_file:
            json.dump(pass_body, pass_file, separators=(",", ":"))

        file_map = {"pass.json": pass_json_path}
        file_map.update({name: path for name, path in assets.items()})
        manifest = _create_manifest(file_map)
        manifest_path = _write_manifest(tmpdir, manifest)
        file_map["manifest.json"] = manifest_path

        if _have_signing_materials():
            try:
                signature_path = _create_signature(tmpdir, manifest_path)
            except PassKitError:
                signature_path = _write_unsigned_signature(tmpdir)
        else:
            signature_path = _write_unsigned_signature(tmpdir)

        file_map["signature"] = signature_path

        pkpass_path = tmpdir / "pass.pkpass"
        with zipfile.ZipFile(pkpass_path, "w") as zf:
            for name, path in file_map.items():
                zf.write(path, arcname=name)

        with open(pkpass_path, "rb") as output:
            return output.read()


def register_device(card: LoyaltyCard, device_identifier: str, pass_type_identifier: str, push_token: str):
    ensure_card_auth_token(card)
    registration, created = PassRegistration.objects.update_or_create(
        loyalty_card=card,
        device_library_identifier=device_identifier,
        pass_type_identifier=pass_type_identifier,
        defaults={"push_token": push_token},
    )
    return created


def unregister_device(card: LoyaltyCard, device_identifier: str, pass_type_identifier: str):
    PassRegistration.objects.filter(
        loyalty_card=card,
        device_library_identifier=device_identifier,
        pass_type_identifier=pass_type_identifier,
    ).delete()


def _parse_updated_since(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def list_serial_numbers(device_identifier: str, pass_type_identifier: str, passes_updated_since: str | None):
    since_dt = _parse_updated_since(passes_updated_since)
    serials = []
    latest = None
    qs = PassRegistration.objects.select_related("loyalty_card").filter(
        device_library_identifier=device_identifier,
        pass_type_identifier=pass_type_identifier,
    )
    for registration in qs:
        card = registration.loyalty_card
        if since_dt and card.updated_at <= since_dt:
            continue
        serials.append(str(card.token))
        latest = max(latest or card.updated_at, card.updated_at)
    latest_tag = latest.isoformat() if latest else timezone.now().isoformat()
    return serials, latest_tag


def notify_loyalty_card_updated(card: LoyaltyCard):
    registrations = list(
        PassRegistration.objects.filter(loyalty_card=card).only("pk", "push_token")
    )
    if not registrations:
        return

    now = timezone.now()
    PassRegistration.objects.filter(pk__in=[registration.pk for registration in registrations]).update(
        updated_at=now
    )

    payloads = [
        PassRegistrationPayload(push_token=registration.push_token, serial_number=str(card.token))
        for registration in registrations
        if registration.push_token
    ]
    if not payloads:
        return

    try:
        send_wallet_pass_update(payloads)
    except Exception:  # pragma: no cover - best effort network call
        logger.exception("Failed to send wallet update for card %s", card.pk)
