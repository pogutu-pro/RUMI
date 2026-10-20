import uuid

from django.db import models
from django.utils import timezone


class ListingEnquiry(models.Model):
    """Someone interested in a vacant unit; the landlord is alerted."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='listing_enquiries')
    unit = models.ForeignKey('properties.RentalUnit', on_delete=models.CASCADE, related_name='enquiries')
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, default='')
    message = models.TextField(blank=True, default='')
    handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'listings_enquiry'
        ordering = ['-created_at']
