from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api.models import Business
from accounts.models import BusinessUser
from .serializers import BusinessSignupSerializer

