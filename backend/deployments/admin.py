from django.contrib import admin
from .models import DeploymentStatus, Technician, Department, Deployment, DeploymentField

# Register the models
admin.site.register(DeploymentStatus)
admin.site.register(Technician)
admin.site.register(Department)
admin.site.register(Deployment)
admin.site.register(DeploymentField)