from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job, Location
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from . import perms
from .serializers import UserSerializer, UserUpdateSerializer, CompanySerializer, CompanyImageSerializer, JobSerializer, LocationSerializer
from oauth2_provider.views.generic import ProtectedResourceView
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.http.response import HttpResponse
from django.contrib.auth import authenticate
from oauth2_provider.models import AccessToken
from django.http import JsonResponse

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse


@csrf_exempt
def debug_token_view(request):
    return JsonResponse({
        'method': request.method,
        'content_type': request.content_type,
        'body': request.body.decode(),
        'POST': request.POST.dict()
    })



# Create your views here.
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
    
    #Cap nhat thong tin nguoi dung
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
    permission_classes = [perms.IsEmployer, permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['update_company_info']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        if self.action.__eq__('create_current_company'):
            return [permissions.IsAuthenticated(), perms.OwnerPerms()]
        return [permissions.AllowAny()]


    @action(methods=['get'], url_path='current-company', detail=False)
    def get_current_company(self, request):
        try:
            # Nếu user chưa có công ty
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
            # Nếu đã tồn tại company
            if hasattr(request.user, 'employer_profile'):
                return Response({"detail": "Tài khoản này đã có công ty"}, status=status.HTTP_400_BAD_REQUEST)
            serializer = self.get_serializer(data=request.data, context={'request': request})
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

            serializer = CompanySerializer(company, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Company.DoesNotExist:
            return Response({"detail": "Không tìm thấy công ty."}, status=404)


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


class JobViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Job.objects.filter(active=True)
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['create_job', 'update_job', 'delete_job']:
            return [permissions.IsAuthenticated(), perms.IsEmployer(), perms.OwnerPerms()]
        return [permissions.AllowAny()]  # Default permission for other actions (list, retrieve)

    def list(self, request):
        queryset = self.get_queryset()

        title = request.query_params.get('title')
        min_salary = request.query_params.get('min_salary')
        max_salary = request.query_params.get('max_salary')
        location = request.query_params.get('location')
        work_time = request.query_params.get('work_time')

        if title:
            queryset = queryset.filter(title__icontains=title)
        
        if min_salary:
            queryset = queryset.filter(salary__gte=min_salary)
        if max_salary:
            queryset = queryset.filter(salary__lte=max_salary)
        
        if location:
            queryset = queryset.filter(locations__name__icontains=location)

        if work_time:
            queryset = queryset.filter(working_time__icontains=work_time)

         # Tránh trùng dữ liệu nếu một job có nhiều location phù hợp
        queryset = queryset.distinct()

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(methods=['post'], url_path='create-job', detail=False)
    def create_job(self, request):
        try:
            # Find the company associated with the user
            company = Company.objects.get(user=request.user, active=True, is_approved=True)
        except Company.DoesNotExist:
            return Response({"detail": "Bạn chưa có công ty hoặc công ty chưa được phê duyệt."}, status=status.HTTP_403_FORBIDDEN)

        serializer = JobSerializer(data=request.data, context={'request': request, 'company': company})

        if serializer.is_valid():
            serializer.save(company=company)  # Gán company vào serializer trước khi lưu
            return Response({"message": "Tin tuyển dụng đã được tạo thành công!"}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['put', 'patch'], url_path='update-job/(?P<job_id>[^/.]+)', detail=False)
    def update_job(self, request, job_id):
        try:
            company = Company.objects.get(user=request.user, active=True, is_approved=True)
        except Company.DoesNotExist:
            return Response({"detail": "Bạn chưa có công ty hoặc công ty chưa được phê duyệt."}, status=status.HTTP_403_FORBIDDEN)

        try:
            job = Job.objects.get(id=job_id, company=company)
        except Job.DoesNotExist:
            return Response({"detail": "Tin tuyển dụng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobSerializer(job, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Tin tuyển dụng đã được cập nhật thành công."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['delete'], url_path='delete-job/(?P<job_id>[^/.]+)', detail=False)
    def delete_job(self, request, job_id):
        try:
            company = Company.objects.get(user=request.user, active=True, is_approved=True)
        except Company.DoesNotExist:
            return Response({"detail": "Bạn chưa có công ty hoặc công ty chưa được phê duyệt."}, status=status.HTTP_403_FORBIDDEN)

        try:
            job = Job.objects.get(id=job_id, company=company, active=True)
        except Job.DoesNotExist:
            return Response({"detail": "Tin tuyển dụng không tồn tại hoặc bạn không có quyền xóa."}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete job by setting active to False
        job.active = False
        job.save()
        return Response({"message": "Tin tuyển dụng đã được xóa."}, status=status.HTTP_200_OK)

class LocationViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = LocationSerializer

    def get_permissions(self):
        if self.action in ['create', 'update_location', 'delete_location']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        # Lọc Location theo Job mà user yêu cầu (nếu có)
        job_id = self.request.query_params.get('job_id', None)
        if job_id:
            return Location.objects.filter(job_id=job_id)
        return Location.objects.all()

    
    def get_job(self, job_id):
        try:
            return Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            raise NotFound("Không tìm thấy công việc này.")

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        job = self.get_job(job_id)  # Lấy Job từ job_id
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Lưu Location liên kết với Job
        serializer.save(job=job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['patch'], url_path='update-location/(?P<id>[^/.]+)', detail=False)
    def update_location(self, request, id=None):
        try:
            location = Location.objects.get(pk=id)
        except Location.DoesNotExist:
            raise NotFound("Không tìm thấy chi nhánh.")
        
        job = location.job  # Lấy Job liên kết với Location
        serializer = self.get_serializer(location, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(job=job)  # Cập nhật lại thông tin Location
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['delete'], url_path='delete-location/(?P<id>[^/.]+)', detail=False)
    def delete_location(self, request, id=None):
        try:
            location = Location.objects.get(pk=id)
        except Location.DoesNotExist:
            raise NotFound("Không tìm thấy chi nhánh.")
        
        location.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

