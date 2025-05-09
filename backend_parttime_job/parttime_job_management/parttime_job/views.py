# parttime_job/views.py (partial excerpt)
from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from . import paginators, perms, models, signals
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job, Application, Follow, Notification, Rating, EmployerRating, VerificationDocument
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from .serializers import UserSerializer, UserUpdateSerializer, CompanySerializer, CompanyImageSerializer, JobSerializer, ApplicationSerializer, FollowSerializer, NotificationSerializer, RatingSerializer, EmployerRatingSerializer, DocumentVerificationSerializer, ApplicationDetailSerializer
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
from django.db.models import Count
from datetime import datetime, timedelta
from django.utils import timezone

# from parttime_job.services.onfido_service import create_onfido_applicant


@csrf_exempt
def debug_token_view(request):
    return JsonResponse({
        'method': request.method,
        'content_type': request.content_type,
        'body': request.body.decode(),
        'POST': request.POST.dict()
    })


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
            return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['get'], url_path='current-user', detail=False)
    def current_user(self, request):
        return Response(UserSerializer(request.user).data)

    @action(methods=['patch'], url_path='update-user', detail=False)
    def update_user_info(self, request):
        user = request.user
        serializer = UserUpdateSerializer(
            user, data=request.data, partial=True)
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
        try:
            company = request.user.employer_profile
        except Company.DoesNotExist:
            return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['post'], url_path='follow', detail=True)
    def follow(self, request, pk=None):
        if request.user.role != User.CANDIDATE:
            return Response({"detail": "Only candidates can follow companies."}, status=status.HTTP_403_FORBIDDEN)
        try:
            company = self.get_object()
            if not company.is_approved:
                return Response({"detail": "Cannot follow an unapproved company."}, status=status.HTTP_400_BAD_REQUEST)
        except Company.DoesNotExist:
            return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

        follow, created = Follow.objects.get_or_create(
            user=request.user, company=company, defaults={'active': True}
        )
        if not created:
            follow.active = not follow.active
            follow.save()

        serializer = FollowSerializer(follow)
        message = "Followed company." if follow.active else "Unfollowed company."
        return Response({"detail": message, "data": serializer.data}, status=status.HTTP_200_OK)


    @action(methods=['get'], url_path='followers-count', detail=True)  
    def get_count_followers(self, request, pk=None):
        try:
            company = self.get_object()
            followers_count = Follow.objects.filter(company=company, active=True).count()
            return Response({"followers_count": followers_count}, status=status.HTTP_200_OK)
        except Company.DoesNotExist:
            return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)


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
    queryset = Company.objects.filter(
        active=True, is_approved=False, is_rejected=False)
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, perms.IsAdmin]
    parser_classes = [parsers.MultiPartParser]

    @action(detail=True, methods=['post'], url_path='is-approved')
    def approve_company(self, request, pk=None):
        is_approved = request.data.get('is_approved')
        reason = request.data.get('reason', '')  # Lý do phê duyệt hoặc từ chối

        if is_approved is None:
            return Response({"detail": "Vui lòng cung cấp giá trị 'is_approved'."},
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

            # Nếu duyệt => cập nhật vai trò employer
            if is_approved:
                employer = company.user
                if employer.role != 'employer':
                    employer.role = 'employer'
                    employer.save()

            return Response({
                "detail": f"Công ty đã được {'phê duyệt' if is_approved else 'từ chối'}."
            }, status=status.HTTP_200_OK)

        except Company.DoesNotExist:
            return Response({"detail": "Không tìm thấy công ty."},
                            status=status.HTTP_404_NOT_FOUND)


class JobListViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Job.objects.filter(active=True)
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

        if title:
            queryset = queryset.filter(title__icontains=title)
        if min_salary:
            queryset = queryset.filter(salary__gte=float(min_salary))
        if max_salary:
            queryset = queryset.filter(salary__lte=float(max_salary))
        if work_time:
            queryset = queryset.filter(working_time__icontains=work_time)

        return queryset.distinct()
    

class JobViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Job.objects.filter(active=True)
    serializer_class = JobSerializer

    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['create_job']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        return [permissions.AllowAny()]

    def get_permissions(self):
        if self.action in ['create_job']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        return [permissions.AllowAny()]
    def list(self, request):
        queryset = self.get_queryset()
        title = request.query_params.get('title')
        min_salary = request.query_params.get('min_salary')
        max_salary = request.query_params.get('max_salary')
        work_time = request.query_params.get('working_time')

        if title:
            queryset = queryset.filter(title__icontains=title)
        if min_salary:
            queryset = queryset.filter(salary__gte=min_salary)
        if max_salary:
            queryset = queryset.filter(salary__lte=max_salary)
        if work_time:
            queryset = queryset.filter(working_time__icontains=work_time)
        queryset = queryset.distinct()

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(methods=['post'], url_path='create-job', detail=False)
    def create_job(self, request):
        try:
            company = Company.objects.get(
                user=request.user, active=True, is_approved=True)
            
        except Company.DoesNotExist:
            return Response(
                {"detail": "Bạn chưa có công ty hoặc công ty chưa được phê duyệt."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = JobSerializer(data=request.data, context={
            'request': request,
            'company': company
        })
        

        if serializer.is_valid():
            try:
                
                job = serializer.save(company=company)
                
                followers = Follow.objects.filter(company=company, active=True).select_related("user")
                
                for follow in followers:
                    user = follow.user
                    
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
        if self.action == 'get_all_my_applications':
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]

    
    def list(self, request):
        user = request.user
        company = Company.objects.filter(user=user, active=True, is_approved=True).first()
        if not company:
            return Response({"detail": "You do not have a verified company."}, status=403)

        jobs = Job.objects.filter(company=company, active=True)
        
        # CHỈ lấy application có status = 'pending'
        queryset = Application.objects.filter(
            active=True,
            job__in=jobs,
            status='pending'  
        ).distinct()

        page = self.paginate_queryset(queryset)
        if page is not None:
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
        
        queryset = Application.objects.filter(
            active=True,
            job__in=jobs,
            status='accepted'  
        ).distinct()

        page = self.paginate_queryset(queryset)
        if page is not None:
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
        applications = Application.objects.filter(
            user=user,
            active=True,
            status='accepted'
        ).select_related('job__company')

        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)


    


class EmployerReviewApplicationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Application.objects.filter(active=True, status='pending')
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, perms.IsEmployer]
    parser_classes = [parsers.MultiPartParser]
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
            application = self.get_object()
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
    

class RatingViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['perform_create', 'update_rating']:
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        user = self.request.user
        company = serializer.validated_data.get('company')
        job = serializer.validated_data.get('job')
        if Rating.objects.filter(user=user, company=company, job=job).exists():
            raise serializers.ValidationError("Bạn đã đánh giá công ty này cho công việc này rồi.")
        serializer.save(user=user)


    @action(methods=['put','patch'], url_path='update-rating', detail=True)
    def update_rating(self, request, pk=None):
        try:
            rating = self.get_object()
        except Rating.DoesNotExist:
            return Response({"detail": "Không tìm thấy đánh giá."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(rating, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
    
    @action(methods=['delete'], url_path='delete-rating', detail=True)
    def delete_rating(self, request, pk=None):
        try:
            rating = self.get_object()
            self.check_object_permissions(request, rating) 
        except Rating.DoesNotExist:
            return Response({"detail": "Không tìm thấy đánh giá."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied:
            return Response({"detail": "Bạn không có quyền xóa đánh giá này."}, status=status.HTTP_403_FORBIDDEN)

        rating.delete()
        return Response({"detail": "Đánh giá đã được xóa."}, status=status.HTTP_204_NO_CONTENT)



class EmployerRatingViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = EmployerRating.objects.all()
    serializer_class = EmployerRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Chỉ xem được đánh giá do chính employer tạo
        return EmployerRating.objects.filter(employer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(employer=self.request.user)  
    
    @action(methods=['put','patch'], url_path='update-rating', detail=True)
    def update_rating(self, request, pk=None):
        try:
            rating = self.get_object()
        except EmployerRating.DoesNotExist:
            return Response({"detail": "Không tìm thấy đánh giá."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(rating, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], url_path='report')
    def report(self, request):
        today = datetime.today()
        six_months_ago = today - timedelta(days=180)

        granularity = request.query_params.get("granularity", "month").lower()

        if granularity == "day":
            trunc_fn = TruncDay
            label_format = "%d/%m"
        elif granularity == "week":
            trunc_fn = TruncWeek
            label_format = "Tuần %W/%Y"
        elif granularity == "month":
            trunc_fn = TruncMonth
            label_format = "%m/%Y"
        elif granularity == "quarter":
            trunc_fn = TruncQuarter
            label_format = "Q%q/%Y"  # sẽ xử lý thủ công
        elif granularity == "year":
            trunc_fn = TruncYear
            label_format = "%Y"
        else:
            return Response({"error": "Invalid granularity"}, status=400)

        def get_stats(qs, date_field="created_date"):
            return (
                qs.filter(**{f"{date_field}__gte": six_months_ago})
                .annotate(period=trunc_fn(date_field))
                .values("period")
                .annotate(count=Count("id"))
                .order_by("period")
            )

        def format_stats(entries):
            labels = []
            for e in entries:
                dt = e["period"]
                if granularity == "quarter":
                    quarter = (dt.month - 1) // 3 + 1
                    labels.append(f"Q{quarter}/{dt.year}")
                elif granularity == "week":
                    labels.append(f"Tuần {dt.strftime('%W')}/{dt.year}")
                else:
                    labels.append(dt.strftime(label_format))
            return {
                "labels": labels,
                "data": [e["count"] for e in entries]
            }

        return Response({
            "job_stats": format_stats(get_stats(Job.objects.all())),
            "candidate_stats": format_stats(get_stats(User.objects.filter(role='candidate'))),
            "employer_stats": format_stats(get_stats(User.objects.filter(role='employer')))
        })


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

class VerifyDocumentViewSet(viewsets.ViewSet):
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
                document_front=serializer.validated_data['document_front'],
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
                document_type=serializer.validated_data['document_type'],
                document_front=serializer.validated_data['document_front'],
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