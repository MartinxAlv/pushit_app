from django.db import models
from projects.models import Project, ProjectField

class DeploymentStatus(models.Model):
    name = models.CharField(max_length=50)
    order = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Deployment Statuses"

class Technician(models.Model):
    username = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    
    def __str__(self):
        return self.name

class Department(models.Model):
    name = models.CharField(max_length=100)
    division = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return self.name

class Deployment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deployments')
    deployment_id = models.CharField(max_length=20)
    status = models.ForeignKey(DeploymentStatus, on_delete=models.PROTECT)
    
    # Common fields
    assigned_to = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    
    # Device information
    current_model = models.CharField(max_length=100, blank=True)
    current_sn = models.CharField(max_length=100, blank=True)
    new_model = models.CharField(max_length=100, blank=True)
    new_sn = models.CharField(max_length=100, blank=True)
    
    # Assignment
    technician = models.ForeignKey(Technician, on_delete=models.SET_NULL, null=True, blank=True)
    technician_notes = models.TextField(blank=True)
    
    # Tracking
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    deployment_date = models.DateField(null=True, blank=True)
    
    # Custom fields will be stored in DeploymentField
    
    def __str__(self):
        return f"{self.project.name} - {self.deployment_id}"

class DeploymentField(models.Model):
    deployment = models.ForeignKey(Deployment, on_delete=models.CASCADE, related_name='fields')
    field = models.ForeignKey(ProjectField, on_delete=models.CASCADE)
    value = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.deployment.deployment_id} - {self.field.name}"