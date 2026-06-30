from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import os

class Command(BaseCommand):
    help = 'Creates or updates a superuser using env vars'

    def handle(self, *args, **options):
        username = os.environ.get('ADMIN_USERNAME', 'lizastationery')
        password = os.environ.get('ADMIN_PASSWORD')

        if not password:
            self.stdout.write(self.style.WARNING('ADMIN_PASSWORD not set, skipping'))
            return

        user, created = User.objects.get_or_create(username=username, defaults={'is_staff': True, 'is_superuser': True})
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f'Superuser {username} created'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Superuser {username} password updated'))