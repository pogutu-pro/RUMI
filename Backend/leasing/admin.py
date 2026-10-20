from django.contrib import admin

from leasing.models import DebtCase, RentReview, TenancyDocument

admin.site.register(TenancyDocument)
admin.site.register(DebtCase)
admin.site.register(RentReview)
