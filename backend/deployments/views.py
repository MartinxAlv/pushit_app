from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Deployment, DeploymentStatus, Technician, Department
from projects.models import Project, ProjectField
from .serializers import (
    DeploymentSerializer, DeploymentCreateSerializer, DeploymentUpdateSerializer,
    DeploymentStatusSerializer, TechnicianSerializer, DepartmentSerializer
)
import pandas as pd
import os
from django.conf import settings
from django.http import HttpResponse
import uuid
import datetime

class DeploymentStatusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DeploymentStatus.objects.all().order_by('order')
    serializer_class = DeploymentStatusSerializer

class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class DeploymentViewSet(viewsets.ModelViewSet):
    queryset = Deployment.objects.all()
    serializer_class = DeploymentSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DeploymentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DeploymentUpdateSerializer
        return DeploymentSerializer
    
    def get_queryset(self):
        queryset = Deployment.objects.all()
        
        # Filter by project if provided
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by status if provided
        status_id = self.request.query_params.get('status')
        if status_id:
            queryset = queryset.filter(status_id=status_id)
            
        # Filter by technician if provided
        technician_id = self.request.query_params.get('technician')
        if technician_id:
            queryset = queryset.filter(technician_id=technician_id)
            
        # Filter by department if provided
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        """Import deployments from Excel"""
        project_id = request.data.get('project')
        file_obj = request.FILES.get('file')
        column_map = request.data.get('column_map', {})
        
        if not project_id:
            return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not file_obj:
            return Response({"error": "Excel file is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # Read Excel file
            df = pd.read_excel(file_obj)
            
            # Get the default status
            try:
                default_status = DeploymentStatus.objects.order_by('order').first()
            except:
                return Response({"error": "No deployment status defined. Please create at least one status."}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            # Convert column map from JSON string if needed
            if isinstance(column_map, str):
                try:
                    import json
                    column_map = json.loads(column_map)
                except:
                    column_map = {}
            
            # Create deployments from Excel data
            deployed_count = 0
            errors = []
            
            # Get field objects for validation
            project_fields = {str(field.id): field for field in project.fields.all()}
            
            # Create a reverse mapping from Excel column names to field IDs
            column_to_field = {col_name: field_id for field_id, col_name in column_map.items()}
            
            for index, row in df.iterrows():
                try:
                    # Create deployment with basic data
                    deployment_data = {
                        'project': project,
                        'deployment_id': f"DEP-{uuid.uuid4().hex[:6].upper()}",
                        'status': default_status
                    }
                    
                    # Map common fields if available in the Excel
                    common_field_map = {
                        'assigned_to': ['assigned_to', 'assignee', 'user', 'employee'],
                        'position': ['position', 'job_title', 'title', 'role'],
                        'location': ['location', 'site', 'building', 'office'],
                        'current_model': ['current_model', 'old_model', 'existing_model'],
                        'current_sn': ['current_sn', 'old_sn', 'existing_sn', 'current_serial'],
                        'new_model': ['new_model', 'target_model', 'model'],
                        'new_sn': ['new_sn', 'target_sn', 'serial_number', 'serial'],
                    }
                    
                    # Try to map common fields from Excel columns
                    for field_name, possible_headers in common_field_map.items():
                        for header in possible_headers:
                            if header in df.columns:
                                value = row[header]
                                if pd.notna(value):  # Check if value is not NaN
                                    deployment_data[field_name] = str(value)
                                break
                    
                    # Create the deployment
                    deployment = Deployment.objects.create(**deployment_data)
                    
                    # Process custom fields based on column mapping
                    for col_name, cell_value in row.items():
                        if pd.notna(cell_value) and col_name in column_to_field:
                            field_id = column_to_field[col_name]
                            if field_id in project_fields:
                                field = project_fields[field_id]
                                
                                # Convert value based on field type
                                if field.field_type == 'number':
                                    try:
                                        value = float(cell_value)
                                    except:
                                        value = cell_value
                                elif field.field_type == 'date':
                                    try:
                                        if isinstance(cell_value, datetime.datetime):
                                            value = cell_value.strftime('%Y-%m-%d')
                                        else:
                                            value = str(cell_value)
                                    except:
                                        value = str(cell_value)
                                else:
                                    value = str(cell_value)
                                
                                # Create deployment field
                                deployment.fields.create(
                                    field=field,
                                    value=value
                                )
                    
                    deployed_count += 1
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
            
            result = {
                "message": f"Successfully imported {deployed_count} deployments",
                "total": deployed_count
            }
            
            if errors:
                result["errors"] = errors
                
            return Response(result)
            
        except Exception as e:
            return Response({"error": f"Error processing Excel file: {str(e)}"}, 
                            status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        """Export deployments to Excel"""
        project_id = request.query_params.get('project')
        
        if not project_id:
            return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get deployments for this project
        deployments = Deployment.objects.filter(project=project)
        
        # Create DataFrame with common fields
        data = []
        
        for deployment in deployments:
            row = {
                'ID': deployment.deployment_id,
                'Status': deployment.status.name,
                'Assigned To': deployment.assigned_to,
                'Position': deployment.position,
                'Department': deployment.department.name if deployment.department else '',
                'Location': deployment.location,
                'Current Model': deployment.current_model,
                'Current SN': deployment.current_sn,
                'New Model': deployment.new_model,
                'New SN': deployment.new_sn,
                'Technician': deployment.technician.name if deployment.technician else '',
                'Technician Notes': deployment.technician_notes,
                'Deployment Date': deployment.deployment_date,
                'Created Date': deployment.created_date,
                'Updated Date': deployment.updated_date
            }
            
            # Add custom fields
            for field_value in deployment.fields.all():
                row[field_value.field.name] = field_value.value
            
            data.append(row)
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Create Excel file
        response = HttpResponse(content_type='application/vnd.ms-excel')
        response['Content-Disposition'] = f'attachment; filename="{project.name}_deployments.xlsx"'
        
        df.to_excel(response, index=False)
        return response
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update deployment status"""
        deployment = self.get_object()
        status_id = request.data.get('status')
        
        if not status_id:
            return Response({"error": "Status ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_status = DeploymentStatus.objects.get(pk=status_id)
        except DeploymentStatus.DoesNotExist:
            return Response({"error": "Status not found"}, status=status.HTTP_404_NOT_FOUND)
        
        deployment.status = new_status
        deployment.save()
        
        serializer = self.get_serializer(deployment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_technician(self, request, pk=None):
        """Assign technician to deployment"""
        deployment = self.get_object()
        technician_id = request.data.get('technician')
        
        if technician_id:
            try:
                technician = Technician.objects.get(pk=technician_id)
                deployment.technician = technician
            except Technician.DoesNotExist:
                return Response({"error": "Technician not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # If technician_id is None, remove assignment
            deployment.technician = None
        
        deployment.save()
        
        serializer = self.get_serializer(deployment)
        return Response(serializer.data)