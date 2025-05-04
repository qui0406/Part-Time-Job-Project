# parttime_job/views.py (partial excerpt)
from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from . import paginators, perms, models, signals
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job, Application, CandidateProfile, Follow, Notification
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from .serializers import UserSerializer, UserUpdateSerializer, CompanySerializer, CompanyImageSerializer, JobSerializer, ApplicationSerializer, FollowSerializer, CandidateProfileSerializer, CommentEmployerSerializer, NotificationSerializer
from oauth2_provider.views.generic import ProtectedResourceView
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate
from oauth2_provider.models import AccessToken
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser, FormParser
from django.views.decorators.cache import cache_page


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
    permission_classes = [perms.IsEmployer, permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update_company_info']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        if self.action == 'create_current_company':
            return [permissions.IsAuthenticated(), perms.OwnerPerms()]
        return [permissions.AllowAny()]

    @action(methods=['get'], url_path='current-company', detail=False)
    def get_current_company(self, request):
        try:
            if not hasattr(request.user, 'employer_profile'):
                return Response({"detail": "Người dùng chưa có công ty."}, status=status.HTTP_404_NOT_FOUND)
            company = request.user.employer_profile
            serializer = self.get_serializer(company)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompanyViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Company.objects.prefetch_related('images').filter(active=True)
    serializer_class = CompanySerializer
    parser_classes = [parsers.MultiPartParser]
    permission_classes = [perms.IsEmployer, permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update_company_info']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        if self.action == 'create_current_company':
            return [permissions.IsAuthenticated(), perms.OwnerPerms()]
        return [permissions.AllowAny()]

    @action(methods=['get'], url_path='current-company', detail=False)
    def get_current_company(self, request):
        try:
            # Kiểm tra nếu người dùng không có công ty
            if not hasattr(request.user, 'employer_profile'):
                return Response({"detail": "Người dùng chưa có công ty."}, status=status.HTTP_404_NOT_FOUND)

            company = request.user.employer_profile
            serializer = self.get_serializer(company)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(methods=['post'], url_path='create-company', detail=False)
    def create_current_company(self, request):
        try:
            if hasattr(request.user, 'employer_profile'):
                return Response({"detail": "Tài khoản này đã có công ty"}, status=status.HTTP_400_BAD_REQUEST)
            data = request.data.copy()
            serializer = self.get_serializer(
                data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(methods=['patch'], url_path='update-company', detail=False)
    def update_company_info(self, request):
        try:
            company = request.user.employer_profile
            serializer = CompanySerializer(
                company, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Company.DoesNotExist:
            return Response({"detail": "Không tìm thấy công ty."}, status=404)
        

    @action(methods=['post'], url_path='follow', detail=True, permission_classes=[IsAuthenticated, perms.IsCandidate])
    def follow(self, request, pk=None):
        if request.user.role != User.CANDIDATE:
            return Response({"detail": "Chỉ ứng viên mới có thể theo dõi công ty."}, status=status.HTTP_403_FORBIDDEN)
        try:
            candidate_profile = request.user.candidate_profile
        except CandidateProfile.DoesNotExist:
            return Response({"detail": "Bạn chưa tạo hồ sơ ứng viên."}, status=status.HTTP_400_BAD_REQUEST)
        try:

            company = self.get_object()
            if not company.is_approved:
                return Response({"detail": "Không thể theo dõi công ty chưa được phê duyệt."}, status=status.HTTP_400_BAD_REQUEST)
        except Company.DoesNotExist:
            return Response({"detail": "Không tìm thấy công ty."}, status=status.HTTP_404_NOT_FOUND)
        
        follow, created = Follow.objects.get_or_create(
            candidate=candidate_profile,
            employer=company,
            defaults={'active': True}
        )

        if not created:
            follow.active = not follow.active
            follow.save()

        serializer = FollowSerializer(follow)
        return Response({
            "detail": "Đã theo dõi công ty." if follow.active else "Đã bỏ theo dõi công ty.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
        
    @action(methods=['get', 'post'], url_path='comments', detail=True)
    def get_comments(self, request, pk=None):
        if request.method == "POST":
            c = CommentEmployerSerializer(data={
                "content": request.data.get("content"),
                "company": pk,
                "user": request.user.pk
            })
            c.is_valid(raise_exception=True)
            c.save()
            return Response(CommentEmployerSerializer(c).data, status=status.HTTP_201_CREATED)

        comments = self.get_object().comment_set.filter(active=True).select_related('candidate_profile__user')
        return Response(CommentEmployerSerializer(comments, many=True).data, status=status.HTTP_200_OK)
            

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
            return Response({"detail": "Bạn chưa có công ty hoặc công ty chưa được phê duyệt."}, status=status.HTTP_403_FORBIDDEN)
        serializer = JobSerializer(data=request.data, context={
                                   'request': request, 'company': company})
        if serializer.is_valid():

            job= serializer.save(company=company)
            try:
                signals.send_job_notification(job.id)
            except Exception as e:
                return Response({"detail": "Có lỗi xảy ra khi gửi thông báo."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "Tin tuyển dụng đã được tạo thành công!"}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ApplicationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Application.objects.filter(active=True)
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if hasattr(self, 'action') and self.action in ['list', 'create_application', 'update_application']:
            return [permissions.IsAuthenticated(), perms.IsCandidate(), perms.OwnerPerms()]
        return [permissions.AllowAny()]

    def list(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

    @action(methods=['post'], url_path='apply', detail=False)
    def create_application(self, request):
        user = request.user
        job_id = request.data.get('job_id') 

        if not job_id:
            return Response({"detail": "Thiếu job_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.get(pk=job_id, active=True)
        except Job.DoesNotExist:
            return Response({"detail": "Không tìm thấy công việc."}, status=status.HTTP_404_NOT_FOUND)

        try:
            candidate_profile = user.candidate_profile
        except CandidateProfile.DoesNotExist:
            return Response({"detail": "Bạn chưa tạo hồ sơ ứng viên."}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['job'] = job.id
        serializer = self.get_serializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(candidate=candidate_profile, job=job)
            return Response({"message": "Đơn ứng tuyển đã được gửi thành công!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['patch'], url_path='my-applications', detail=True)
    def update_application(self, request, pk=None):
        if request.user.role != User.CANDIDATE:
            return Response({"detail": "Chỉ ứng viên mới có thể cập nhật đơn ứng tuyển."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            application = Application.objects.get(pk=pk, candidate__user=request.user)
        except Application.DoesNotExist:
            return Response({"detail": "Không tìm thấy đơn ứng tuyển."}, status=status.HTTP_404_NOT_FOUND)

        if application.status != 'pending':
            return Response({
                "detail": "Chỉ được cập nhật đơn ứng tuyển khi đang ở trạng thái chờ duyệt (pending)."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Xử lý dữ liệu job_id nếu có
        job_id = request.data.get('job_id')
        data = request.data.copy()

        if job_id:
            try:
                job = Job.objects.get(pk=job_id, active=True)
            except Job.DoesNotExist:
                return Response({"detail": "Không tìm thấy công việc."}, status=status.HTTP_404_NOT_FOUND)
            data['job'] = job.id

        # Tiến hành cập nhật
        serializer = self.get_serializer(application, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class EmployerReviewApplicationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Application.objects.filter(active=True, status='pending')
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, perms.IsEmployer, perms.OwnerPerms]
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
    pagination_class = paginators.NotificationPagination

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