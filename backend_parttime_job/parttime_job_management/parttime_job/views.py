from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from parttime_job.models import User, Company, CompanyImage
from rest_framework.views import APIView
from . import perms
from .serializers import UserSerializer, UserUpdateSerializer, CompanySerializer, CompanyImageSerializer
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
        if self.action in ['get_current_company', 'update_company_info']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


    # @action(methods=['get'], url_path='current-company', detail=False)
    # def get_curent_company(self, request):
    #     """Lấy thông tin công ty của employer hiện tại"""
    #     try:
    #         company = request.user.employer_profile
    #         serializer = CompanySerializer(company)
    #         return Response(serializer.data)
    #     except Company.DoesNotExist:
    #         return Response({"detail": "Chưa tạo hồ sơ công ty."}, status=404)


    @action(methods=['post'], url_path='current-company', detail=False)
    def create_current_company(self, request):
        try:
            # Nếu đã tồn tại company
            if hasattr(request.user, 'employer_profile'):
                return Response({"detail": "Công ty đã tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = self.get_serializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    

    @action(methods=['patch'], url_path='update-company', detail=True)
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

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    

