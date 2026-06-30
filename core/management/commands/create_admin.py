from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import os

class Command(BaseCommand):
    help = 'Creates a superuser if one does not exist, using env vars'

    def handle(self, *args, **options):
        username = os.environ.get('ADMIN_USERNAME', 'lizastationery')
        password = os.environ.get('ADMIN_PASSWORD')
        
        if not password:
            self.stdout.write(self.style.WARNING('ADMIN_PASSWORD not set, skipping'))
            return
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS(f'User {username} already exists'))
            return
        
        User.objects.create_superuser(username=username, email='', password=password)
        self.stdout.write(self.style.SUCCESS(f'Superuser {username} created'))