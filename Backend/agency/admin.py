from django.contrib import admin

from agency.models import OwnerStatement, OwnerTransaction, PropertyOwner

admin.site.register(PropertyOwner)
admin.site.register(OwnerStatement)
admin.site.register(OwnerTransaction)
