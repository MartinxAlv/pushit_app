from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to create projects.
    """
    def has_permission(self, request, view):
        # Allow GET requests for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For other methods (POST, PUT, DELETE), only allow admin users
        return request.user and request.user.is_staff