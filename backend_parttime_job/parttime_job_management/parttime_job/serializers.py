from rest_framework import serializers # type: ignore
from parttime_job.models import User
from rest_framework.views import APIView # type: ignore
from rest_framework.response import Response # type: ignore
from django.contrib.auth import authenticate # type: ignore
import re

from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError # type: ignore
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator


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


        
