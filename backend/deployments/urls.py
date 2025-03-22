from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeploymentViewSet, DeploymentStatusViewSet, TechnicianViewSet, DepartmentViewSet

router = DefaultRouter()
router.register(r'deployments', DeploymentViewSet)
router.register(r'statuses', DeploymentStatusViewSet)
router.register(r'technicians', TechnicianViewSet)
router.register(r'departments', DepartmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]