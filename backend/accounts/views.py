from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from backend.permissions import IsAdminUser
from .serializers import (
    UserSerializer, 
    UserCreateSerializer, 
    UserUpdateSerializer, 
    PasswordResetSerializer, 
    LoginSerializer
)

# Standalone login view
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'username': user.username,
                'is_admin': user.is_staff,
                'email': user.email
            })
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# User viewset for CRUD operations
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Only admins can manage users
        """
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user information"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset a user's password (admin only)"""
        user = self.get_object()
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'detail': 'Password has been reset successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)