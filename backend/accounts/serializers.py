from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'first_name', 'last_name']
        read_only_fields = ['is_superuser']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['id']
    
    def validate_password(self, value):
        validate_password(value)
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_staff=validated_data.get('is_staff', False)
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'is_staff']
    
    def validate_password(self, value):
        if value:
            validate_password(value)
        return value
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class PasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate_password(self, value):
        validate_password(value)
        return value

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})