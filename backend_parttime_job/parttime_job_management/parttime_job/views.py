# parttime_job/views.py (partial excerpt)
from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from . import paginators, perms, models, signals
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job, Application, Follow, Notification, Rating, EmployerRating, VerificationDocument, Conversation, Message, UserProfile, CommentDetail, ReplyCommetFromEmployerDetail
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from .serializers import UserSerializer, UserUpdateSerializer, CompanySerializer, CompanyImageSerializer, JobSerializer, ApplicationSerializer, FollowSerializer, NotificationSerializer, RatingSerializer, EmployerRatingSerializer, DocumentVerificationSerializer, ApplicationDetailSerializer, ConversationSerializer, MessageSerializer, CommentDetailSerializer, RatingDetailSerializer, RatingWithCommentSerializer, ReplyCommentEmployerDetailSerializer, RatingEmployerWithCommentSerializer
from oauth2_provider.views.generic import ProtectedResourceView
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate
from oauth2_provider.models import AccessToken
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser, FormParser
from django.views.decorators.cache import cache_page
from rest_framework import status as drf_status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from rest_framework.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import serializers
from rest_framework.permissions import IsAdminUser
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncQuarter, TruncYear
from django.db.models import Count, Avg
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
# from parttime_job.services.onfido_service import create_onfido_applicant
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import DocumentVerificationSerializer
from .services import IdAnalyzerService
from .models import VerificationDocument
import logging

logger = logging.getLogger(__name__)
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend  # Add this import
from .models import Message
from .serializers import MessageSerializer
from parttime_job.chat.services import sync_message_to_firebase

from firebase_admin import auth
from firebase_admin import auth
from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from .models import User, UserProfile
from .serializers import UserSerializer
from rest_framework.parsers import MultiPartParser


from parttime_job.firebase import initialize_firebase

initialize_firebase() 


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if self.action in ['current_user', 'update_user_info']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                #Tạo tài khoản Firebase khi tạo người dùng thành công
                firebase_user = auth.create_user(
                    email=serializer.validated_data.get('email'),
                    password=request.data.get('password') 
                )
                firebase_uid = firebase_user.uid

                UserProfile.objects.create(
                    user=user,
                    firebase_uid=firebase_uid,
                    firebase_email=serializer.validated_data['email'],
                    firebase_password=request.data.get('password') 
                )

            except Exception as e:
                logger.error("Tạo tài khoản thất bại")
                user.delete()
                return Response(
                    {"Tạo tài khoản Firebase thất bại: ", str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"message": "Tạo tài khoản thành công!", "user_id": str(user.id)},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['get'], url_path='current-user', detail=False)
    def current_user(self, request):
        return Response(UserSerializer(request.user).data)

    @action(methods=['patch'], url_path='update-user', detail=False)
    def update_user_info(self, request):
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompanyViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Company.objects.prefetch_related('images').filter(active=True)
    serializer_class = CompanySerializer
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if self.action in ['create_current_company']:
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        if self.action in ['update_company_info', 'get_count_followers']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        if self.action.__eq__('follow'):
            return [permissions.IsAuthenticated(), perms.IsCandidate()]
        return [permissions.AllowAny()]

    @action(methods=['get'], url_path='current-company', detail=False)
    def get_current_company(self, request):
        if not hasattr(request.user, 'employer_profile'):
            return Response({"detail": "User has no company."}, status=status.HTTP_404_NOT_FOUND)
        company = request.user.employer_profile
        serializer = self.get_serializer(company)
        return Response(serializer.data)

    @action(methods=['post'], url_path='create-company', detail=False)
    def create_current_company(self, request):
        if hasattr(request.user, 'employer_profile'):
            return Response({"detail": "User already has a company."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(methods=['patch'], url_path='update-company', detail=False)
    def update_company_info(self, request):

        company = request.user.employer_profile
        if company:
            serializer = self.get_serializer(company, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
        return Response({serializer.error}, status=status.HTTP_404_NOT_FOUND)

    # @action(methods=['post'], url_path='follow', detail=True, permission_classes=[permissions.IsAuthenticated, perms.IsCandidate])
    # def follow(self, request, pk=None):
    #     try:
    #         company = self.get_object()
    #         import pdb; pdb.set_trace()
    #         if not company.is_approved:
    #             return Response({"detail": "Cannot follow an unapproved company."}, status=status.HTTP_400_BAD_REQUEST)
    #     except Company.DoesNotExist:
    #         return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

    #     follow, created = Follow.objects.get_or_create(
    #         user=request.user, company=company, defaults={'active': True}
    #     )
    #     if not created:
    #         follow.active = not follow.active
    #         follow.save()

    #     serializer = FollowSerializer(follow)
    #     message = "Followed company." if follow.active else "Unfollowed company."
    #     return Response({"detail": message, "data": serializer.data}, status=status.HTTP_200_OK)


    # @action(methods=['get'], url_path='followers-count', detail=True)  
    # def get_count_followers(self, request, pk=None):
    #     try:
    #         company = self.get_object()
    #         followers_count = Follow.objects.filter(company=company, active=True).count()
    #         return Response({"followers_count": followers_count}, status=status.HTTP_200_OK)
    #     except Company.DoesNotExist:
    #         return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)


class CompanyListViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Company.objects.filter(active=True, is_approved=True)
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser]

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

class CompanyIsApprovedViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Company.objects.filter(active=True, is_approved=False, is_rejected=False)
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, perms.IsAdmin]
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['post'], url_path='is-approved', detail=True)
    def approve_company(self, request, pk=None):
        is_approved = request.data.get('is_approved')
        reason = request.data.get('reason', '')  

        if not is_approved:
            return Response({"detail": "Vui long cung cấp đầy đủ thông tin "},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            company = Company.objects.get(pk=pk, active=True)
            is_approved = bool(is_approved)
            company.is_approved = is_approved
            company.is_rejected = not is_approved
            company.save()

            CompanyApprovalHistory.objects.create(
                company=company,
                approved_by=request.user,
                is_approved=is_approved,
                is_rejected=not is_approved,
                reason=reason
            )

            #Duyệt thì cập nhật vai trò employer
            if is_approved:
                employer = company.user
                if employer.role != 'employer':
                    employer.role = 'employer'
                    employer.save()

            return Response({
                "detail": f"Công ty{'đã được phê duyệt' if is_approved else 'bị từ chối'}."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": "Không tìm thấy công ty"},
                            status=status.HTTP_404_NOT_FOUND)


import logging

logger = logging.getLogger(__name__)

class JobListViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Job.objects.filter(active=True, company__active=True, company__is_approved=True).prefetch_related('company')
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.JobPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        title = self.request.query_params.get('title')
        min_salary = self.request.query_params.get('min_salary')
        max_salary = self.request.query_params.get('max_salary')
        work_time = self.request.query_params.get('working_time')
        company_name = self.request.query_params.get('company_name')

        if title:
            queryset = queryset.filter(title__icontains=title)
        if min_salary:
            queryset = queryset.filter(salary__gte=float(min_salary))
        if max_salary:
            queryset = queryset.filter(salary__lte=float(max_salary))
        if work_time:
            queryset = queryset.filter(working_time__icontains=work_time)
        if company_name:
            queryset = queryset.filter(company__company_name__icontains=company_name)
        return queryset.distinct()
    

from .tasks import send_new_job_email
class JobViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Job.objects.filter(active=True, company__active=True, company__is_approved=True)
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = paginators.JobPagination
    

    def get_permissions(self):
        if self.action in ['create_job']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        return [permissions.AllowAny()]

    def list(self, request):
        queryset = self.get_queryset()
        title = request.query_params.get('title')
        min_salary = self.request.query_params.get('min_salary')
        max_salary = self.request.query_params.get('max_salary')
        work_time = self.request.query_params.get('working_time')

        if title:
            queryset = queryset.filter(title__icontains=title)
        if min_salary:
            queryset = queryset.filter(salary__gte=min_salary)
        if max_salary:
            queryset = queryset.filter(salary__lte=max_salary)
        if work_time:
            queryset = queryset.filter(working_time__icontains=work_time)
        queryset = queryset.distinct()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Fallback for non-paginated response (if pagination is disabled)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(methods=['post'], url_path='create-job', detail=False)
    def create_job(self, request):
        company = Company.objects.get(user=request.user, active=True, is_approved=True)
        if not company:
            return Response(
                {"detail": "Không tìm thấy công ty của bạn"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = JobSerializer(data=request.data, context={'request': request,'company': company})
        if serializer.is_valid():
            try:
                job = serializer.save(company=company)
                followers = Follow.objects.filter(company=company, active=True).select_related("user")

                for follow in followers:
                    user = follow.user
                    # send_new_job_email.delay(
                    #     user_email=user.email,
                    #     user_first_name=user.first_name,
                    #     job_title=job.title,
                    #     company_name=company.company_name
                    # )
                    try:
                        subject = f"Công ty {company.company_name} vừa đăng tin tuyển dụng mới!"
                        message = (
                            f"Chào {user.first_name},\n\n"
                            f"Công ty {company.company_name} mà bạn theo dõi vừa đăng tin tuyển dụng: \"{job.title}\".\n"
                            f"Hãy đăng nhập vào hệ thống để xem chi tiết và ứng tuyển nếu phù hợp.\n\n"
                            f"Trân trọng,\n"
                            f"Đội ngũ hỗ trợ"
                        )
                        from_email = settings.DEFAULT_FROM_EMAIL
                        send_mail(subject, message, from_email, [user.email])
                    except Exception as e:
                        print(f"Lỗi khi gửi email đến {user.email}: {str(e)}")

                job_data = JobSerializer(job).data
                return Response(
                    {
                        "message": "Tin tuyển dụng đã được tạo thành công!",
                        "job": job_data
                    },
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response(
                    {"detail": "Có lỗi xảy ra khi gửi thông báo."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class ApplicationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Application.objects.filter(active=True)
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.ApplicationPagination

    def get_permissions(self):
        if self.action in ['create_application', 'update_application']:
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        if self.action in ['get_all_my_applications', 'get_all_my_applications_nofilter']:
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        return [AllowAny()]

    
    def list(self, request):
        user = request.user
        company = Company.objects.filter(user=user, active=True, is_approved=True).first()
        if not company:
            return Response({"detail": "You do not have a verified company."}, status=403)

        jobs = Job.objects.filter(company=company, active=True)
        
        # CHỈ lấy application có status = 'pending'
        queryset = Application.objects.filter(active=True, job__in=jobs,status='pending').distinct()

        page = self.paginate_queryset(queryset)
        if page:
            serializer = ApplicationDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ApplicationDetailSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], url_path='all-accepted-applications', detail=False, serializer_class= ApplicationDetailSerializer)
    def all_accepted_applications(self, request):
        user = request.user
        company = Company.objects.filter(user=user, active=True, is_approved=True).first()
        if not company:
            return Response({"detail": "You do not have a verified company."}, status=403)

        jobs = Job.objects.filter(company=company, active=True)
        
        queryset = Application.objects.filter(active=True, job__in=jobs, status='accepted').distinct()

        page = self.paginate_queryset(queryset)
        if page:
            serializer = ApplicationDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ApplicationDetailSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        user = request.user
        application = get_object_or_404(Application, pk=pk, active=True)

        if application.job.company.user != user:
            return Response({"detail": "You do not have permission to update this application."},
                            status=drf_status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected']:
            return Response({"detail": "Invalid status. Must be 'accepted' or 'rejected'."},
                            status=drf_status.HTTP_400_BAD_REQUEST)

        application.status = new_status
        application.save()
        return Response({"detail": f"Application status updated to '{new_status}'."})

    @action(methods=['post'], url_path='apply', detail=False)
    def create_application(self, request):
        

        document_exists = VerificationDocument.objects.filter(user=request.user).exists()
        if not document_exists:
            return Response({"detail": "Bạn cần xác minh tài liệu trước khi nộp đơn ứng tuyển."}, status=status.HTTP_403_FORBIDDEN)
            
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({"detail": "Job ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            job = Job.objects.get(pk=job_id, active=True)
        except Job.DoesNotExist:
            return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        if Application.objects.filter(user=request.user, job=job).exists():
            return Response({"detail": "Đã nộp cv rồi!"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['job'] = job.id
        serializer = self.get_serializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user, job=job)
            
            return Response({"message": "Application submitted successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['patch'], url_path='my-applications', detail=True)
    def update_application(self, request, pk=None):
        if request.user.role != User.CANDIDATE:
            return Response({"detail": "Only candidates can update applications."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            application = Application.objects.get(pk=pk, user=request.user)
        except Application.DoesNotExist:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        if application.status != 'pending':
            return Response(
                {"detail": "Only pending applications can be updated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        job_id = request.data.get('job_id')
        data = request.data.copy()
        if job_id:
            try:
                job = Job.objects.get(pk=job_id, active=True)
                data['job'] = job.id
            except Job.DoesNotExist:
                return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(application, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['get'], url_path='my-all-applications', detail=False, serializer_class= ApplicationDetailSerializer)
    def get_all_my_applications(self, request):
        user = request.user

        # Lọc các đơn ứng tuyển đã được chấp nhận
        applications = Application.objects.filter(user=user, active=True, status='accepted').select_related('job__company')

        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], url_path='my-all-applications-nofilter', detail=False, serializer_class= ApplicationDetailSerializer)
    def get_all_my_applications_nofilter(self, request):
        user = request.user
        applications = Application.objects.filter(user=user,active=True).select_related('job__company')
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], url_path='notification-job-apply', detail=False, serializer_class= ApplicationDetailSerializer, permission_classes=[permissions.IsAuthenticated])
    def get_my_notification(self, request):
        user = request.user
        application = Application.objects.filter(user=user, active=True).order_by('-created_date')
        serializer = ApplicationSerializer(application, many=True)
        return Response(serializer.data)

class EmployerReviewApplicationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Application.objects.filter(active=True, status='pending')
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, perms.IsEmployer]
    parser_classes = [parsers.MultiPartParser, JSONParser]
    pagination_class = paginators.ApplicationPagination

    def list(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

    @action(methods=['post'], url_path='review', detail=True)
    def review_application(self, request, pk=None):
        try:
            application = Application.objects.get(pk=pk, active=True)
            
        except Application.DoesNotExist:
            return Response({"detail": "Không tìm thấy đơn ứng tuyển."}, status=status.HTTP_404_NOT_FOUND)
        
        status_choice = request.data.get('status')
        application.status = status_choice
        application.save()
        return Response({
            "detail": f"Đơn ứng tuyển đã {'được chấp nhận' if status_choice == 'accepted' else 'bị từ chối'}."
        }, status=status.HTTP_200_OK)



class NotificationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Notification.objects.filter(active=True)
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def list(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
logger = logging.getLogger(__name__)

class BaseRatingViewSet(viewsets.ViewSet, generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['perform_create', 'update_rating', 'delete_rating']:
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RatingViewSet(BaseRatingViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    paginator_classes = [paginators.RatingPagination]

    def get_permissions(self):
        if self.action in ['perform_create', 'update_rating', 'delete_rating']:
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        company_id = serializer.validated_data.get('company')
        job_id = serializer.validated_data.get('job')

        if Rating.objects.filter(user=user, company=company_id, job=job_id).exists():
            raise serializers.ValidationError("Bạn đã đánh giá công ty này cho công việc này rồi.")

        if not company_id:
            logger.error("Company is None in perform_create")
            raise serializers.ValidationError("Trường company không được để trống.")

        super().perform_create(serializer)


    @action(methods=['get'], url_path='list-rating-job-of-company', detail=False, permission_classes=[AllowAny])
    def list_ratings(self, request): #Tra ve tat ca danh gia cua 1 cong ty 
        company_id = request.query_params.get('company_id')
        job_id = request.query_params.get('job_id')
        queryset = Rating.objects.filter(active=True, job_id= job_id, company_id=company_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], url_path='rating-from-employer', detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_rating_from_employer(self, request):
        application_id = request.query_params.get('application_id')
        queryset = Rating.objects.filter(user=self.request.user, application_id=application_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], url_path='get-notification-rating', detail=False, permission_classes=[permissions.IsAuthenticated], paginator_classes= paginators.RatingPagination)
    def get_notification_rating(self, request): #Hien ra danh sach thong bao danh gia khi danh gia roi se mat 
        company_id = request.query_params.get('company_id')
        job_id = request.query_params.get('job_id')
        queryset = Rating.objects.filter(company_id=company_id, active=True, is_reading=False).order_by('-created_date')
        
        rating = Rating.objects.filter(company_id=company_id, job_id=job_id, active=True).first()

        if rating:
            has_comment = CommentDetail.objects.filter(rating_employer=rating,active=True).exists()
            if has_comment and not rating.is_reading:
                rating.is_reading = True
                rating.save()


        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RatingDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = RatingDetailSerializer(queryset, many=True)
        return Response(serializer.data)

        
    
    @action(methods=['get'], url_path='rating-average', detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_rating_average(self, request):
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response({"detail": "Company ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = Rating.objects.filter(company_id=company_id, active=True)
        if not queryset.exists():
            return Response({"detail": "No ratings found for this company."}, status=status.HTTP_404_NOT_FOUND)

        average_rating = queryset.aggregate(average_score=Avg('rating'))['average_score']
        return Response({"average_rating": average_rating}, status=status.HTTP_200_OK)
    

class EmployerRatingViewSet(BaseRatingViewSet):
    queryset = EmployerRating.objects.all()
    serializer_class = EmployerRatingSerializer
    permission_classes = [permissions.IsAuthenticated, perms.IsEmployer]

    def perform_create(self, serializer):
        employer = self.request.user
        user = serializer.validated_data.get('user')
        application = serializer.validated_data.get('application')
        if EmployerRating.objects.filter(employer=employer, user=user, application=application).exists():
            raise serializers.ValidationError("Bạn đã đánh giá ứng viên này cho đơn ứng tuyển này rồi.")
        serializer.save(employer=employer)

    @action(methods=['get'], url_path='list-rating-employer', detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_comment_from_employer(self, request):
        user = request.user
        queryset = EmployerRating.objects.filter(user= user, active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CommentDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = EmployerRating.objects.all()
    serializer_class = EmployerRatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.CommentPagination

    def get_permissions(self):
        if self.action in ['update_reply_comment', 'delete_reply_comment']:
            return [permissions.IsAuthenticated(), perms.OwnerPerms()]
        if self.action in ['get_all_comments', 'get_all_comments_by_job', 'reply_comment']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(methods=['get'], url_path='get-all-comments', detail=False)
    def get_all_comments(self, request):
        company_id = request.query_params.get('company_id')
        queryset = Rating.objects.filter(company_id = company_id, active=True).order_by('-created_date')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


    @action(methods=['get'], url_path='get-all-comments-by-job', detail=False, serializer_class= RatingWithCommentSerializer)
    def get_all_comments_by_job(self, request):
        job_id = request.query_params.get('job_id')
        company_id = request.query_params.get('company_id')
        if not job_id:
            return Response({"detail": "Job ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not company_id:
            return Response({"detail": "Company ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try: 
            comment_details = CommentDetail.objects.filter(
                rating_employer__job_id=job_id,
                rating_employer__company_id=company_id,
                active=True
            ).select_related('rating_employer')

            queryset = Rating.objects.filter(company_id = company_id, job_id = job_id , active=True).order_by('-created_date')
        except Rating.DoesNotExist:
            return Response({"detail": "No ratings found for this job."}, status=status.HTTP_404_NOT_FOUND)
        page = self.paginate_queryset(queryset)
        if page:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, comment_details, many=True, context={'request': request})
        return Response(serializer.data)
    

    @action(methods=['post'], url_path='reply-comment', detail=False, permission_classes=[permissions.IsAuthenticated, perms.IsEmployer])
    def reply_comment(self, request):
        rating_employer_id = request.data.get('rating_employer_id') # ID của đánh giá mà employer muốn trả lời
        employer_reply = request.data.get('employer_reply')

        if not rating_employer_id:
            return Response(
                {"detail": "Rating_employer_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not employer_reply:
            return Response(
                {"detail": "Reply content is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        parent_comment= Rating.objects.get(pk=rating_employer_id)

        if CommentDetail.objects.filter(rating_employer=parent_comment).exists():
            return Response(
                {"detail": "Đánh giá này đã được employer phản hồi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = {
            'employer_reply': employer_reply
        }

        if parent_comment:
            parent_comment.is_reading = True
            parent_comment.save()

        serializer = CommentDetailSerializer(data=data, context={'request': request, 'rating_employer': parent_comment})
        if serializer.is_valid():
            serializer.save(rating_employer=parent_comment) 
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['put', 'patch'], url_path='update-reply-comment', detail=True)
    def update_reply_comment(self, request, pk=None):
        employer_reply = request.query_params.get('employer_reply')
        if not employer_reply:
            return Response(
                {"detail": "Reply content is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        parent_comment = get_object_or_404(Rating, pk=pk)
        
        try:
            reply = CommentDetail.objects.get(rating_employer=parent_comment)
        except CommentDetail.DoesNotExist:
            return Response({"detail": "Không tồn tại phản hồi để cập nhật."}, status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra employer hiện tại có đúng là chủ sở hữu đánh giá không (bảo mật)
        if request.user != parent_comment.company.user:
            return Response({"detail": "Bạn không có quyền sửa phản hồi này."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CommentDetailSerializer(reply, data={'employer_reply': employer_reply}, partial=True,
                                            context={'request': request, 'rating_employer': parent_comment})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['delete'], url_path='delete-reply-comment', detail=True)
    def delete_reply_comment(self, request, pk=None):
        parent_comment = get_object_or_404(Rating, pk=pk)
        try:
            reply = CommentDetail.objects.get(rating_employer=parent_comment)
        except CommentDetail.DoesNotExist:
            return Response({"detail": "Không tồn tại phản hồi để xóa."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != parent_comment.company.user:
            return Response({"detail": "Bạn không có quyền xóa phản hồi này."}, status=status.HTTP_403_FORBIDDEN)

        reply.delete()
        return Response({"detail": "Phản hồi đã được xóa thành công."}, status=status.HTTP_204_NO_CONTENT)
    

class CommentEmployerDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Rating.objects.all()
    serializer_class = RatingDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.RatingPagination

    def get_permissions(self):
        if self.action in ['get_all_comments', 'get_all_comments_by_job', 'reply_comment']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(methods=['get'], url_path='get-all-comments', detail=False)
    def get_all_comments(self, request):
        employer_id = request.query_params.get('employer_id')
        application_id = request.query_params.get('application_id')
        user = request.user
        queryset = EmployerRating.objects.filter(user = user, employer_id = employer_id, application_id= application_id, active=True).order_by('-created_date')
       
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    

    @action(methods=['get'], url_path='get-notification-rating', detail=False, permission_classes=[permissions.IsAuthenticated], serializer_class= ReplyCommentEmployerDetailSerializer)
    def get_notification_rating(self, request): 
        user = request.user

        queryset = EmployerRating.objects.filter(user = user,
            active=True, is_reading=False).order_by('-created_date')

        return Response({
            "ratings": EmployerRatingSerializer(queryset, many=True, context={'request': request}).data
        }, status=status.HTTP_200_OK)


    @action(methods=['post'], url_path='reply-comment', detail=True, permission_classes=[IsAuthenticated, perms.IsCandidate])
    def reply_comment(self, request, pk=None):
        rating_id = request.data.get('rating_candidate_id')
        candidate_reply = request.data.get('candidate_reply')

        if not rating_id:
            return Response(
                {"detail": "Rating candidate ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not candidate_reply:
            return Response(
                {"detail": "Reply content is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rating_instance = EmployerRating.objects.get(pk=rating_id)
            
        except EmployerRating.DoesNotExist:
            return Response(
                {"detail": "Rating not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if rating_instance:
            rating_instance.is_reading = True
            rating_instance.save()

        data = {
            'candidate_reply': candidate_reply,
            'rating_candidate': rating_id,
        }

        serializer = ReplyCommentEmployerDetailSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(rating_candidate=rating_instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from datetime import datetime
class StatsViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    permission_classes = [perms.IsAdmin]
        
    @action(detail=False, methods=['get'], url_path='stats-quantity-job')
    def get_stats_quantity_job(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        if not from_date or not to_date:
            return Response(
                {"error": "Missing 'from_date' or 'to_date' query parameters (format: YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from_date = datetime.fromisoformat(from_date)
            to_date = datetime.fromisoformat(to_date)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use ISO format (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        quantity_job = Job.objects.filter(
            active=True,
            created_date__gte=from_date,
            created_date__lt=to_date
        ).count()

        return Response({
            "quantity_job": quantity_job
        }, status=status.HTTP_200_OK if quantity_job > 0 else status.HTTP_404_NOT_FOUND)


    @action(detail=False, methods=['get'], url_path='stats-quantity-candidate')
    def get_stats_quantity_candidate(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        if not from_date or not to_date:
            return Response(
                {"error": "Missing 'from_date' or 'to_date' query parameters (format: YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from_date = datetime.fromisoformat(from_date)
            to_date = datetime.fromisoformat(to_date)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use ISO format (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        quantity_user = User.objects.filter(active=True, role = 'candidate', created_date__gte=from_date,
            created_date__lt=to_date).count()
        if quantity_user > 0:
            return Response({
                "quantity_user": quantity_user
            }, status=status.HTTP_200_OK)
        return Response({"error": "No user found"}, status=status.HTTP_404_NOT_FOUND)


    @action(detail=False, methods=['get'], url_path='stats-quantity-employer')
    def get_stats_quantity_employer(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        if not from_date or not to_date:
            return Response(
                {"error": "Missing 'from_date' or 'to_date' query parameters (format: YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from_date = datetime.fromisoformat(from_date)
            to_date = datetime.fromisoformat(to_date)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use ISO format (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        quantity_employer = User.objects.filter(active=True, role = 'employer',
                                                created_date__gte=from_date,
                                            created_date__lt=to_date).count()
        if quantity_employer > 0:
            return Response({
                "quantity_employer": quantity_employer
            }, status=status.HTTP_200_OK)
        return Response({"error": "Employer not found"}, status=status.HTTP_404_NOT_FOUND)

        

class VerifyDocumentViewSet(viewsets.ViewSet, generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @action(methods=['post'], url_path='verify', detail=False)
    def verify_document(self, request):
        serializer = DocumentVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify with IdAnalyzer
            result = IdAnalyzerService.verify_document(
                document_front=serializer.validated_data.get('document_front'),
                document_back=serializer.validated_data.get('document_back'),
                selfie_image=serializer.validated_data.get('selfie_image')
            )

            if not result['success']:
                return Response({
                    'error': 'Xác minh thất bại',
                    'details': result['error'],
                    'error_code': result['error_code']
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save to database
            document = VerificationDocument.objects.create(
                user=request.user,
                document_type=serializer.validated_data.get('document_type'),
                document_front=serializer.validated_data.get('document_front'),
                document_back=serializer.validated_data.get('document_back'),
                selfie_image=serializer.validated_data.get('selfie_image'),
                verified=result['verified']
            )

            return Response({
                'verified': result['verified'],
                'details': result['details'],
                'document_id': document.id,
                'response': result 
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Verification error: {str(e)}")
            return Response({
                'error': 'Lỗi không mong muốn xảy ra',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

    @action(methods=['get'], url_path='status', detail=False)
    def get_status(self, request, pk=None):
        state = False
        try:
            document = VerificationDocument.objects.get(user=request.user)
            if document: 
                state = True
            return Response({
                'state':state
            }, status=status.HTTP_200_OK)
        except VerificationDocument.DoesNotExist:
            return Response({'state':state}, status=status.HTTP_404_NOT_FOUND)


class ConversationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated, perms.OwnerPerms]
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['get'], url_path='get-conversations', detail=False)
    def get_conversation(self, request):
        user = request.user
        employer_id = request.query_params.get('employer')
        candidate_id = request.query_params.get('candidate')
        
        try:
            if user.role == 'employer':
                if not candidate_id:
                    return Response({"detail": "Candidate ID is required."}, status=status.HTTP_400_BAD_REQUEST)
                conversation = Conversation.objects.get(employer=user, candidate_id=candidate_id)
            else:
                if not employer_id:
                    return Response({"detail": "Employer ID is required."}, status=status.HTTP_400_BAD_REQUEST)
                conversation = Conversation.objects.get(candidate=user, employer_id=employer_id)
            
            return Response({"conversation_id": conversation.id})
        except Conversation.DoesNotExist:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['get'], url_path='get-conversation-for-employer', detail = False)
    def get_conversation_for_employer(self, request):
        user = request.user
        conversations = Conversation.objects.filter(employer = user)
        serializer = self.get_serializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            conversation = serializer.save()
            return Response({"message": "Conversation created successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['conversation_id']
    permission_classes = [permissions.IsAuthenticated, perms.OwnerPerms]
    

    def get_queryset(self):
        queryset = super().get_queryset()
        conversation_id = self.request.query_params.get('conversation_id')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset

    def perform_create(self, serializer):
        message = serializer.save()
        firebase_key = sync_message_to_firebase(message)
        message.firebase_key = firebase_key
        message.save()