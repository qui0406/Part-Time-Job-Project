from django.urls import path, include
from rest_framework.routers import DefaultRouter
from parttime_job import views
import oauth2_provider.views as oauth2_views
from django.conf import settings
from django_rest_passwordreset import urls as reset_password_urls
from parttime_job.views import debug_token_view
from rest_framework import routers



router = DefaultRouter()
router.register('user', views.UserViewSet, basename='register')
router.register('company', views.CompanyViewSet, basename='company')
router.register('company-list', views.CompanyListViewSet, basename='company-list')

urlpatterns = [
    path('', include(router.urls)),
    path('debug-token/', debug_token_view), 
]