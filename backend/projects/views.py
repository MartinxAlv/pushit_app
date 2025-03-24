# backend/projects/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, ProjectField
from .serializers import ProjectSerializer, ProjectFieldSerializer
import pandas as pd
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.db import models
from backend.permissions import IsAdminUser

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    def get_permissions(self):
        """
        Only admins can create projects
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'create_with_excel']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        # Set the current user as the creator
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_with_excel(self, request):
        """Create a project with an Excel file"""
        name = request.data.get('name')
        description = request.data.get('description')
        expected_count = request.data.get('expected_count', 0)
        file_obj = request.FILES.get('file')
        
        if not name:
            return Response({"error": "Project name is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create the project
        project = Project.objects.create(
            name=name,
            description=description,
            expected_count=expected_count,
            created_by=request.user
        )
        
        if file_obj:
            try:
                # Read Excel file
                df = pd.read_excel(file_obj)
                
                # Get column headers
                columns = df.columns.tolist()
                
                # Create project fields based on Excel columns
                for idx, col_name in enumerate(columns):
                    # Try to determine field type based on data
                    col_data = df[col_name].dropna()
                    if len(col_data) == 0:
                        field_type = 'text'  # Default to text if no data
                    elif pd.api.types.is_numeric_dtype(col_data):
                        field_type = 'number'
                    elif pd.api.types.is_datetime64_dtype(col_data):
                        field_type = 'date'
                    else:
                        field_type = 'text'
                    
                    # Create the project field
                    ProjectField.objects.create(
                        project=project,
                        name=col_name,
                        field_type=field_type,
                        is_required=False,
                        order=idx
                    )
                
                return Response({
                    "message": "Project created successfully with Excel columns",
                    "project_id": project.id,
                    "columns": columns
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                # If Excel processing fails, delete the project and return error
                project.delete()
                return Response({"error": f"Excel processing error: {str(e)}"}, 
                                status=status.HTTP_400_BAD_REQUEST)
        
        # If no file, just return the created project
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_field(self, request, pk=None):
        """Add a new field to the project"""
        try:
            project = self.get_object()
            name = request.data.get('name')
            field_type = request.data.get('field_type', 'text')
            is_required = request.data.get('is_required', False)
            options = request.data.get('options')
        
            if not name:
                return Response({"error": "Field name is required"}, 
                                status=status.HTTP_400_BAD_REQUEST)
        
            # Get the highest order and add 1
            max_order = project.fields.aggregate(models.Max('order'))['order__max'] or -1
        
            # Format options correctly
            if field_type == 'dropdown' and options:
                # If options is a string, try to convert it to a list
                if isinstance(options, str):
                    options = [opt.strip() for opt in options.split(',')]
        
            field = ProjectField.objects.create(
                project=project,
                name=name,
                field_type=field_type,
                is_required=is_required,
                order=max_order + 1,
                options=options
            )
        
            serializer = ProjectFieldSerializer(field)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'], url_path='remove-field/(?P<field_id>[^/.]+)')
    def remove_field(self, request, pk=None, field_id=None):
        """Remove a field from the project"""
        project = self.get_object()
        
        try:
            field = project.fields.get(id=field_id)
            field.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectField.DoesNotExist:
            return Response({"error": "Field not found"}, 
                            status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def import_excel(self, request, pk=None):
        """Import Excel data into an existing project"""
        project = self.get_object()
        file_obj = request.FILES.get('file')
    
        if not file_obj:
            return Response({"error": "Excel file is required"}, status=status.HTTP_400_BAD_REQUEST)
    
        try:
            # Read Excel file
            df = pd.read_excel(file_obj)
        
            # Process data and create deployments
            # You may want to adapt this based on your specific needs
        
            return Response({
                "message": "Excel data imported successfully",
                "rows_processed": len(df)
            })
        except Exception as e:
            return Response({"error": f"Error processing Excel file: {str(e)}"}, 
                            status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def analyze_excel(self, request):
        """Analyze Excel file and return column information without importing"""
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_excel(file_obj)
            columns = df.columns.tolist()
            
            # Analyze each column
            column_info = []
            for col_name in columns:
                col_data = df[col_name].dropna()
                
                # Determine data type
                if pd.api.types.is_numeric_dtype(col_data):
                    field_type = 'number'
                elif pd.api.types.is_datetime64_dtype(col_data):
                    field_type = 'date'
                else:
                    field_type = 'text'
                    
                    # Check if it might be a dropdown
                    unique_values = col_data.unique()
                    if len(unique_values) <= 10 and len(unique_values) > 0 and len(col_data) > 0:
                        if len(unique_values) / len(col_data) < 0.2:  # If less than 20% are unique
                            field_type = 'dropdown'
                
                column_info.append({
                    'name': col_name,
                    'field_type': field_type,
                    'sample_values': col_data.head(5).tolist() if len(col_data) > 0 else []
                })
            
            return Response({
                "columns": column_info,
                "row_count": len(df)
            })
            
        except Exception as e:
            return Response({"error": f"Excel processing error: {str(e)}"}, 
                            status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def export_template(self, request, pk=None):
        """Generate an Excel template for this project"""
        project = self.get_object()
        
        # Create DataFrame with headers
        headers = ["Status", "Assigned To", "Position", "Department", "Location"]
        
        # Add custom field headers
        for field in project.fields.all().order_by('order'):
            headers.append(field.name)
        
        df = pd.DataFrame(columns=headers)
        
        # Create response
        response = HttpResponse(content_type='application/vnd.ms-excel')
        response['Content-Disposition'] = f'attachment; filename="{project.name}_template.xlsx"'
        df.to_excel(response, index=False)
        
        return response
    

    @action(detail=True, methods=['post'])
    def import_excel(self, request, pk=None):
        """Import Excel data into an existing project"""
        project = self.get_object()
        file_obj = request.FILES.get('file')
    
        if not file_obj:
            return Response({"error": "Excel file is required"}, status=status.HTTP_400_BAD_REQUEST)
    
        try:
            # Read Excel file
            df = pd.read_excel(file_obj)
        
            # Get the default deployment status
            from deployments.models import DeploymentStatus, Deployment
        
            try:
                default_status = DeploymentStatus.objects.order_by('order').first()
                if not default_status:
                    return Response({"error": "No deployment status found. Please create at least one status."},
                                status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error": f"Error getting default status: {str(e)}"},
                          status=status.HTTP_400_BAD_REQUEST)
        
            # Create a mapping of column names to field ids
            field_map = {}
            for field in project.fields.all():
                field_map[field.name] = field.id
        
            # Process each row in the Excel file
            deployments_created = 0
            errors = []
        
            for idx, row in df.iterrows():
                try:
                    # Basic deployment data
                    deployment_data = {
                        'project': project,
                        'deployment_id': f"DEP-{idx+1:04d}",
                        'status': default_status
                    }
                
                    # Map common fields
                    common_fields = {
                        'assigned_to': ['Assigned To', 'Assignee', 'User', 'Employee'],
                        'position': ['Position', 'Title', 'Role', 'Job Title'],
                        'location': ['Location', 'Office', 'Site', 'Building'],
                        'current_model': ['Current Model', 'Old Model', 'Existing Model'],
                        'current_sn': ['Current SN', 'Old SN', 'Existing SN'],
                        'new_model': ['New Model', 'Model', 'Target Model'],
                        'new_sn': ['New SN', 'SN', 'Serial Number']
                    }
                
                    # Try to map common fields
                    for field, possible_names in common_fields.items():
                        for name in possible_names:
                            if name in df.columns and pd.notna(row[name]):
                                deployment_data[field] = str(row[name])
                                break
                
                    # Create the deployment
                    deployment = Deployment.objects.create(**deployment_data)
                
                    # Process custom fields
                    from deployments.models import DeploymentField
                
                    for column in df.columns:
                        # Skip empty cells
                        if pd.isna(row[column]):
                            continue
                        
                        # Check if this column matches a project field
                        field_id = None
                        for field_name, field_id_value in field_map.items():
                            if column.lower() == field_name.lower():
                                field_id = field_id_value
                                break
                    
                        if field_id:
                            # Create deployment field
                            DeploymentField.objects.create(
                                deployment=deployment,
                                field_id=field_id,
                                value=str(row[column])
                            )
                
                    deployments_created += 1
                
                except Exception as e:
                    errors.append(f"Error in row {idx+1}: {str(e)}")
        
            result = {
                "message": f"Successfully imported {deployments_created} deployments",
                "total_created": deployments_created
            }
        
            if errors:
                result["errors"] = errors
            
            return Response(result)
        
        except Exception as e:
            return Response({"error": f"Error processing Excel file: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST)