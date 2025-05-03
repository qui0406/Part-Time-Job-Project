from rest_framework import serializers  # type: ignore
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job
from rest_framework.views import APIView  # type: ignore
from rest_framework.response import Response  # type: ignore
from django.contrib.auth import authenticate  # type: ignore
import re


class ItemSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url
        return data


class UserSerializer(serializers.ModelSerializer):
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng!")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Tên đăng nhập đã được sử dụng!")
        return value

    def create(self, validated_data):
        data = validated_data.copy()
        u = User(**data)
        u.set_password(u.password)
        u.save()
        return u

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['avatar'] = instance.avatar.url if instance.avatar else ''
        return data

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email',
                  'phone_number', 'password', 'role', 'avatar']
        extra_kwargs = {'password': {'write_only': True}}


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username',
                  'email', 'phone_number', 'password']

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Email này đã được sử dụng!")
        return value

    def validate_username(self, value):
        user = self.instance
        if User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Tên đăng nhập đã được sử dụng!")
        return value

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))
        return super().update(instance, validated_data)


class CompanyImageSerializer(ItemSerializer):
    class Meta:
        model = CompanyImage
        fields = ['image']


class CompanySerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=True
    )
    image_list = CompanyImageSerializer(
        source='images', many=True, read_only=True)

    def validate_images(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Cần ít nhất 3 hình ảnh môi trường làm việc.")

        for image in value:
            if image.content_type not in ['image/jpeg', 'image/png']:
                raise serializers.ValidationError("Chỉ chấp nhận ảnh JPEG hoặc PNG.")
            if image.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Ảnh phải nhỏ hơn 5MB.")

        return value

    def validate_company_name(self, value):
        if not value:
            raise serializers.ValidationError(
                "Tên công ty không được để trống.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        # Kiểm tra xem người dùng đã có công ty chưa
        if Company.objects.filter(user=user).exists():
            raise serializers.ValidationError("Người dùng đã có công ty.")

        images_data = validated_data.pop('images', [])

        # Tạo công ty
        company = Company.objects.create(user=user, **validated_data)

        # Tạo hình ảnh công ty
        for image in images_data:
            CompanyImage.objects.create(company=company, image=image)

        return company

    def update(self, instance, validated_data):
        # Loại bỏ ảnh và chi nhánh nếu có từ validated_data
        validated_data.pop('images', None)
        return super().update(instance, validated_data)

    class Meta:
        model = Company
        fields = ['id', 'user', 'company_name', 'company_phone',
                  'company_email', 'description', 'tax_id', 'images',
                  'image_list', 'address', 'latitude', 'longitude', 'is_approved', 'is_rejected']
        extra_kwargs = {
            'user': {'read_only': True}
        }


class CompanyApprovalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyApprovalHistory
        fields = ['company', 'approved_by', 'is_approved',
                  'is_rejected', 'reason', 'timestamp']


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['id', 'company', 'title', 'description',
                  'location', 'skills', 'salary', 'working_time', 'active']
        extra_kwargs = {
            'company': {'read_only': True},
            'active': {'read_only': True}
        }

    def validate_title(self, value):
        if not value:
            raise serializers.ValidationError("Tiêu đề không được để trống.")
        return value

    def validate_description(self, value):
        if not value:
            raise serializers.ValidationError("Mô tả không được để trống.")
        return value

    def validate_location(self, value):
        if not value:
            raise serializers.ValidationError("Địa chỉ không được để trống.")
        return value

    def validate_skills(self, value):
        if not value:
            raise serializers.ValidationError("Kỹ năng không được để trống.")
        return value

    def validate_salary(self, value):
        if not value:
            raise serializers.ValidationError("Mức lương không được để trống.")
        return value

    def validate_working_time(self, value):
        if not value:
            raise serializers.ValidationError(
                "Thời gian làm việc không được để trống.")
        return value
