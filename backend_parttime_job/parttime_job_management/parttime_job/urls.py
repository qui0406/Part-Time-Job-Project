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
router.register('company-approved', views.CompanyIsApprovedViewSet, basename='company-approved')
router.register('job-list', views.JobListViewSet, basename='job-list')
router.register('job', views.JobViewSet, basename='job')
router.register('application-profile', views.ApplicationViewSet, basename='application-profile')
router.register('review-application', views.EmployerReviewApplicationViewSet, basename='review-application')
router.register('notification', views.NotificationViewSet, basename='notification')
router.register('ratings', views.RatingViewSet, basename='rating')
router.register('employer-ratings', views.EmployerRatingViewSet, basename='employer-rating')
# router.register('follow', views.FollowViewSet, basename='follow')
router.register('stats', views.StatsViewSet, basename='stats')
router.register('verify-document', views.VerifyDocumentViewSet, basename='verify-document')



urlpatterns = [
    path('', include(router.urls)),
    path('debug-token/', debug_token_view), 
]