from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from parttime_job.models import User
from rest_framework.views import APIView
from . import perms
from .serializers import UserSerializer
from oauth2_provider.views.generic import ProtectedResourceView
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.http.response import HttpResponse
from django.contrib.auth import authenticate
from oauth2_provider.models import AccessToken
from django.http import JsonResponse



# Create your views here.
class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [parsers.MultiPartParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def get_permissions(self):
        if self.action.__eq__('current_user'):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
        
    @action(methods=['get'], url_path='current-user', detail=False)
    def current_user(self, request):
        return Response(UserSerializer(request.user).data)

    #Cap nhat thong tin nguoi dung
    @action(methods=['get', 'patch'], url_path='update-user', detail=False,
             permission_classes = [permissions.IsAuthenticated])
    def get_current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(u, k, v)
                elif k.__eq__('password'):
                    u.set_password(v)
            u.save()
        return Response(UserSerializer(u).data)
    

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