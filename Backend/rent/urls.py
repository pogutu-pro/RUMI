from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
for prefix, viewset in views.viewset_mapping:
    router.register(prefix, viewset, basename=prefix)

urlpatterns = router.urls
