from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, ProjectField
from .serializers import ProjectSerializer, ProjectFieldSerializer
import pandas as pd
from django.http import HttpResponse

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    @action(detail=True, methods=['post'])
    def import_excel(self, request, pk=None):
        """Import an Excel file to populate deployments"""
        project = self.get_object()
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)
        
        # Process the Excel file
        # This is a simplified version - you'll need to expand this
        try:
            df = pd.read_excel(file_obj)
            # Process data and create deployments
            # ...
            return Response({"message": "Import successful"})
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    
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