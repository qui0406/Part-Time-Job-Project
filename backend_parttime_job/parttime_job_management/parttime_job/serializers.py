from rest_framework import serializers
from parttime_job.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
import re

class ItemSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url
        return data


# class CompanyImageSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = CompanyImage
#         fields = ['image', 'description']


# class CompanySerializer(serializers.ModelSerializer):
#     company_images = CompanyImageSerializer(many=True)

#     class Meta:
#         model = Company
#         fields = ['company_name', 'tax_code', 'company_images']

 
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'phone_number', 'role', 'avatar']


class RegisterSerializer(serializers.ModelSerializer):
    # company = CompanySerializer(required=False)  # Only for employer
    avatar = serializers.ImageField(required=False)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        """ Kiểm tra xem email đã tồn tại chưa """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng!")
        return value
    
    def validate_password(self, value):
        """ Kiểm tra mật khẩu có đủ mạnh hay không """
        if len(value) < 8:
            raise serializers.ValidationError("Mật khẩu phải có ít nhất 8 ký tự!")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất một số!")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất một chữ hoa!")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất một chữ thường!")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError("Mật khẩu phải chứa ít nhất một ký tự đặc biệt!")

        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['avatar'] = instance.avatar.url if instance.avatar else ''
        return data

    def create(self, validated_data):
        data = validated_data.copy()
        u = User(**data)
        u = User(
            email=validated_data['email'],
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            role=validated_data['role'],
            avatar=validated_data['avatar'],
        )
        u.set_password(validated_data['password'])
        u.save()
        return u

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'phone_number', 'password', 'role', 'avatar']
        extra_kwargs = {'password': {'write_only': True}}


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField()
    password = serializers.CharField(max_length=128, write_only=True)
    role = serializers.CharField(read_only=True)

    def validate(self, data):
        email = data['email']
        password = data['password']
        user = authenticate(email=email, password=password)

        if user is None:
            raise serializers.ValidationError("Invalid login credentials")

        try:
            validation = {
                'email': user.email,
                "password": user.password,
                'role': user.role,
            }
            return validation
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid login credentials")