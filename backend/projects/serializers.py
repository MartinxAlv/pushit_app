from rest_framework import serializers
from .models import Project, ProjectField

class ProjectFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectField
        fields = ['id', 'name', 'field_type', 'is_required', 'order', 'options']

class ProjectSerializer(serializers.ModelSerializer):
    fields = ProjectFieldSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_date', 'expected_count', 'fields']
        read_only_fields = ['created_date']