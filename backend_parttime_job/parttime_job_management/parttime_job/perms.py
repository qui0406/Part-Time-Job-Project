from rest_framework.permissions import BasePermission
from rest_framework import permissions

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsEmployer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employer'

class IsCandidate(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'candidate'

class OwnerPerms(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) and request.user == obj

class CommentOwner(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) and request.user == obj.user

class ImageOwner(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) and request.user == obj.company.user