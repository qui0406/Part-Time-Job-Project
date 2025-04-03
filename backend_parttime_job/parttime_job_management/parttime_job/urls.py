from django.urls import path, include
from rest_framework.routers import DefaultRouter
from parttime_job import views
import oauth2_provider.views as oauth2_views
from django.conf import settings


router = DefaultRouter()
# router.register('login', views.AuthUserLoginView, basename='login')
router.register('user', views.UserViewSet, basename='register')


urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.AuthUserLoginView.as_view(), name='login')
]