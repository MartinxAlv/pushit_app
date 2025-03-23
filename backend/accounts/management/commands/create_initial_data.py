# backend/accounts/management/commands/create_initial_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from deployments.models import DeploymentStatus, Department

class Command(BaseCommand):
    help = 'Creates initial data for the application'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating initial data...')
        
        # Create default admin user if none exists
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'  # Remember to change this in production!
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin.username}'))
        
        # Create default technician user if none exists
        if not User.objects.filter(username='tech').exists():
            tech = User.objects.create_user(
                username='tech',
                email='tech@example.com',
                password='tech123',  # Remember to change this in production!
                first_name='Default',
                last_name='Technician',
                is_staff=False
            )
            self.stdout.write(self.style.SUCCESS(f'Created technician user: {tech.username}'))
        
        # Create default deployment statuses if none exist
        default_statuses = [
            {'name': 'Pending', 'order': 1},
            {'name': 'In Progress', 'order': 2},
            {'name': 'On Hold', 'order': 3},
            {'name': 'Completed', 'order': 4},
            {'name': 'Cancelled', 'order': 5}
        ]
        
        for status_data in default_statuses:
            status, created = DeploymentStatus.objects.get_or_create(
                name=status_data['name'],
                defaults={'order': status_data['order']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created deployment status: {status.name}'))
        
        # Create some default departments if none exist
        if Department.objects.count() == 0:
            default_departments = [
                {'name': 'IT', 'division': 'Technology'},
                {'name': 'Finance', 'division': 'Corporate'},
                {'name': 'HR', 'division': 'Corporate'},
                {'name': 'Marketing', 'division': 'Sales'},
                {'name': 'Operations', 'division': 'Production'}
            ]
            
            for dept_data in default_departments:
                dept = Department.objects.create(
                    name=dept_data['name'],
                    division=dept_data['division']
                )
                self.stdout.write(self.style.SUCCESS(f'Created department: {dept.name}'))
        
        self.stdout.write(self.style.SUCCESS('Initial data creation completed!'))