from rest_framework import serializers
from .models import Deployment, DeploymentField, DeploymentStatus, Technician, Department

class TechnicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Technician
        fields = ['id', 'username', 'name', 'email']

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'division']

class DeploymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeploymentStatus
        fields = ['id', 'name', 'order']

class DeploymentFieldSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source='field.name', read_only=True)
    field_type = serializers.CharField(source='field.field_type', read_only=True)
    
    class Meta:
        model = DeploymentField
        fields = ['id', 'field', 'field_name', 'field_type', 'value']

class DeploymentSerializer(serializers.ModelSerializer):
    fields = DeploymentFieldSerializer(many=True, read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    technician_name = serializers.CharField(source='technician.name', read_only=True, allow_null=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Deployment
        fields = [
            'id', 'project', 'project_name', 'deployment_id', 'status', 'status_name',
            'assigned_to', 'position', 'department', 'department_name', 'location',
            'current_model', 'current_sn', 'new_model', 'new_sn',
            'technician', 'technician_name', 'technician_notes',
            'created_date', 'updated_date', 'deployment_date', 'fields'
        ]
        read_only_fields = ['created_date', 'updated_date']

class DeploymentCreateSerializer(serializers.ModelSerializer):
    custom_fields = serializers.DictField(required=False)
    
    class Meta:
        model = Deployment
        fields = [
            'project', 'deployment_id', 'status',
            'assigned_to', 'position', 'department', 'location',
            'current_model', 'current_sn', 'new_model', 'new_sn',
            'technician', 'technician_notes', 'deployment_date',
            'custom_fields'
        ]
    
    def create(self, validated_data):
        custom_fields = validated_data.pop('custom_fields', {})
        deployment = Deployment.objects.create(**validated_data)
        
        # Create deployment fields
        if custom_fields:
            for field_id, value in custom_fields.items():
                DeploymentField.objects.create(
                    deployment=deployment,
                    field_id=field_id,
                    value=str(value)
                )
        
        return deployment

class DeploymentUpdateSerializer(serializers.ModelSerializer):
    custom_fields = serializers.DictField(required=False)
    
    class Meta:
        model = Deployment
        fields = [
            'status', 'assigned_to', 'position', 'department', 'location',
            'current_model', 'current_sn', 'new_model', 'new_sn',
            'technician', 'technician_notes', 'deployment_date',
            'custom_fields'
        ]
    
    def update(self, instance, validated_data):
        custom_fields = validated_data.pop('custom_fields', {})
        
        # Update the deployment instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update custom fields
        if custom_fields:
            for field_id, value in custom_fields.items():
                deployment_field, created = DeploymentField.objects.get_or_create(
                    deployment=instance,
                    field_id=field_id,
                    defaults={'value': str(value)}
                )
                if not created:
                    deployment_field.value = str(value)
                    deployment_field.save()
        
        return instance