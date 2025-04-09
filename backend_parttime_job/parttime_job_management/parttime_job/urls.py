from django.urls import path, include
from rest_framework.routers import DefaultRouter
from parttime_job import views
import oauth2_provider.views as oauth2_views
from django.conf import settings
from django_rest_passwordreset import urls as reset_password_urls
from parttime_job.views import debug_token_view

router = DefaultRouter()
# router.register('login', views.AuthUserLoginView, basename='login')
router.register('user', views.UserViewSet, basename='register')

urlpatterns = [
    path('', include(router.urls)),
    path('debug-token/', debug_token_view),  #
    # path('send-email/', views.send_test_email, name='send_test_email')
]