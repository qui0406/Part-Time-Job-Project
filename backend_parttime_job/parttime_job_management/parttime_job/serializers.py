from rest_framework import serializers # type: ignore
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job, Location
from rest_framework.views import APIView # type: ignore
from rest_framework.response import Response # type: ignore
from django.contrib.auth import authenticate # type: ignore
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
        fields = ['first_name', 'last_name', 'username', 'email', 'phone_number', 'password', 'role', 'avatar']
        extra_kwargs = {'password': {'write_only': True}}



class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'phone_number', 'password']

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
        child=serializers.ImageField(),
        write_only=True,
        required=True
    )
    image_list = CompanyImageSerializer(source='images', many=True, read_only=True)

    def validate_images(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Cần ít nhất 3 hình ảnh môi trường làm việc.")
        return value

    def create(self, validated_data):
        images_data = validated_data.pop('images')
        user = self.context['request'].user
        company = Company.objects.create(user=user, **validated_data)
        for image in images_data:
            CompanyImage.objects.create(company=company, image=image)
        return company

    def update(self, instance, validated_data):
        validated_data.pop('images', None)
        return super().update(instance, validated_data)

    class Meta:
        model = Company
        fields = ['id', 'user', 'company_name', 'company_address', 'company_phone',
                  'company_email', 'description', 'tax_id', 'images', 'image_list', 'is_approved', 'is_rejected']
        extra_kwargs = {
            'user': {'read_only': True}
        }
        
class CompanyApprovalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyApprovalHistory
        fields = ['company', 'approved_by', 'is_approved', 'is_rejected', 'reason', 'timestamp']


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

    def create(self, validated_data):
        # Lấy job từ validated_data
        job = validated_data.pop('job')
        # Tạo Location với job đã lấy
        location = Location.objects.create(job=job, **validated_data)
        return location



class JobSerializer(serializers.ModelSerializer):
    locations = LocationSerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = ['id', 'company', 'title', 'description', 'skills', 'salary', 'working_time', 'locations', 'active']
        extra_kwargs = {
            'company': {'read_only': True},
            'active': {'read_only': True}
        }

    def create(self, validated_data):
        locations_data = validated_data.pop('locations', [])
        job = Job.objects.create(**validated_data)
        for location_data in locations_data:
            Location.objects.create(job=job, **location_data)
        return job

    def update(self, instance, validated_data):
        locations_data = validated_data.pop('locations', None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if locations_data is not None:
            instance.locations.all().delete()  # clear old locations
            for location_data in locations_data:
                Location.objects.create(job=instance, **location_data)

        return instance