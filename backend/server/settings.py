import os
from pathlib import Path
from dotenv import load_dotenv
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")

CSRF_TRUSTED_ORIGINS = os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
if CSRF_TRUSTED_ORIGINS == [""]:
    CSRF_TRUSTED_ORIGINS = []

NGROK_DOMAIN = os.getenv("DJANGO_NGROK_DOMAIN")
if NGROK_DOMAIN:
    if NGROK_DOMAIN not in ALLOWED_HOSTS and "*" not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(NGROK_DOMAIN)
    origin = (
        NGROK_DOMAIN
        if NGROK_DOMAIN.startswith("http://") or NGROK_DOMAIN.startswith("https://")
        else f"https://{NGROK_DOMAIN}"
    )
    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)

SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = True

CSRF_TRUSTED_ORIGINS = os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
if CSRF_TRUSTED_ORIGINS == [""]:
    CSRF_TRUSTED_ORIGINS = []

NGROK_DOMAIN = os.getenv("DJANGO_NGROK_DOMAIN")
if NGROK_DOMAIN:
    if NGROK_DOMAIN not in ALLOWED_HOSTS and "*" not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(NGROK_DOMAIN)
    origin = (
        NGROK_DOMAIN
        if NGROK_DOMAIN.startswith("http://") or NGROK_DOMAIN.startswith("https://")
        else f"https://{NGROK_DOMAIN}"
    )
    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api",
    "accounts",
]

AUTH_USER_MODEL = "accounts.BusinessUser"

LOGIN_REDIRECT_URL = '/admin/'

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "server.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / 'backend' / 'templates'],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "server.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS if origin.strip()]
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.123:3000",
]
for origin in DEFAULT_CORS_ORIGINS:
    if origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(origin)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + ["X-Station-Token"]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[a-z0-9-]+\.ngrok-free\.dev$",
]

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "server.auth.CsrfExemptSessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_SCHEMA_CLASS": "rest_framework.schemas.openapi.AutoSchema",
}

# Apple Wallet / PassKit configuration (defaults for local dev)
APPLE_PASS_TYPE_IDENTIFIER = os.getenv("APPLE_PASS_TYPE_IDENTIFIER", "pass.com.example.placeholder")
APPLE_PASS_TEAM_ID = os.getenv("APPLE_PASS_TEAM_ID", "TEAMID0000")
APPLE_PASS_CERT_PATH = os.getenv("APPLE_PASS_CERT_PATH", "")
APPLE_PASS_CERT_PASSWORD = os.getenv("APPLE_PASS_CERT_PASSWORD", "")
APPLE_PASS_WWDR_CERT_PATH = os.getenv("APPLE_PASS_WWDR_CERT_PATH", "")
APPLE_PASS_WEB_SERVICE_URL = os.getenv("APPLE_PASS_WEB_SERVICE_URL", "https://localhost/passkit")
APPLE_PASS_AUTH_TOKEN_SECRET = os.getenv("APPLE_PASS_AUTH_TOKEN_SECRET", "changeme")
APPLE_PASS_ASSET_DIR = os.getenv("APPLE_PASS_ASSET_DIR", str(BASE_DIR / "certs"))

# APNs push configuration for Wallet updates
APNS_AUTH_KEY_PATH = os.getenv("APNS_AUTH_KEY_PATH", "")
APNS_KEY_ID = os.getenv("APNS_KEY_ID", "")
APNS_TEAM_ID = os.getenv("APNS_TEAM_ID", APPLE_PASS_TEAM_ID)
APNS_TOPIC = os.getenv("APNS_TOPIC", APPLE_PASS_TYPE_IDENTIFIER)
APNS_ENV = os.getenv("APNS_ENV", "production")
