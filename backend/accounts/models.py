from django.contrib.auth.models import AbstractUser
from django.db import models
from api.models import Business

class BusinessUser(AbstractUser):

    business = models.OneToOneField(
        Business,
        null=True,
        blank=True,
        on_delete = models.CASCADE,
        related_name = 'account'

    )