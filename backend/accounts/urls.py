# backend/accounts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router for viewset
router = DefaultRouter()
router.register('users', views.UserViewSet)

urlpatterns = [
    # Direct function view for login
    path('login/', views.login_view, name='login'),
    
    # Include the router URLs for user operations
    path('', include(router.urls)),
]