from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Job, Company, Application, Notification, Rating, EmployerRating
from django.db.models.functions import TruncMonth
from django.db.models import Count
from datetime import datetime, timedelta

class MyUserAdmin(UserAdmin):
    list_display = ['id', 'username', 'email', 'is_active', 'is_staff', 'avatar']
    list_filter = [ 'is_active']
    search_fields = ['username', 'email']
    ordering = ['id']


admin.site.register(User, MyUserAdmin)
