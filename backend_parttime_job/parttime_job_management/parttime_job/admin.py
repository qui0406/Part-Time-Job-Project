from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class MyUserAdmin(UserAdmin):
    list_display = ['id', 'username', 'email', 'is_active', 'is_staff', 'avatar']
    list_filter = [ 'is_active']
    search_fields = ['username', 'email']
    ordering = ['id']

    # fieldsets = UserAdmin.fieldsets + (
    #     ('Thông tin bổ sung', {'fields': ('role', 'avatar')}),
    # )


admin.site.register(User, MyUserAdmin)
