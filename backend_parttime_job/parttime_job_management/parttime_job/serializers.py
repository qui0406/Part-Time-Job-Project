from rest_framework import serializers  # type: ignore
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job, Application, Follow, Notification, Rating, EmployerRating, VerificationDocument
from rest_framework.views import APIView  # type: ignore
from rest_framework.response import Response  # type: ignore
from django.contrib.auth import authenticate  # type: ignore
import re
from django.core.exceptions import ValidationError
from cloudinary.uploader import upload


class ItemSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url
        return data


class UserSerializer(serializers.ModelSerializer):
    
    def validate_email(self, value):
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', value):
            raise serializers.ValidationError("Email không hợp lệ.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng!")
        return value

    def validate_username(self, value):
        if not re.match(r'^[\w\d_-]{3,20}$', value):
            raise serializers.ValidationError("Tên đăng nhập chỉ chứa chữ, số, dấu gạch dưới hoặc gạch ngang, dài 3-20 ký tự.")
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
    
    followed = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()

    def get_followed(self, obj):    
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(
                user=request.user, company=obj,active=True).exists()
        return False
    
    def get_follower_count(self, obj):
        return Follow.objects.filter(company=obj).count()

    def validate_images(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Cần ít nhất 3 hình ảnh môi trường làm việc.")

        for image in value:
            if image.content_type not in ['image/jpeg', 'image/png']:
                raise serializers.ValidationError("Chỉ chấp nhận ảnh JPEG hoặc PNG.")
            # if image.size > 5 * 1024 * 1024:
            #     raise serializers.ValidationError("Ảnh phải nhỏ hơn 5MB.")

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
                  'company_email', 'description', 'tax_id', 'images', 'followed', 'follower_count',
                  'image_list', 'address', 'latitude', 'longitude', 'is_approved', 'is_rejected']
        extra_kwargs = {
            'user': {'read_only': True}
        }

    def get_company_name(self, obj):
        return obj.company_name

class CompanyApprovalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyApprovalHistory
        fields = ['company', 'approved_by', 'is_approved',
                  'is_rejected', 'reason', 'timestamp']


class JobSerializer(serializers.ModelSerializer):
    company = CompanySerializer()
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





class ApplicationSerializer(serializers.ModelSerializer):
    # job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all())
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    cv = serializers.FileField(required=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    company = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job', 'education', 'experience', 'current_job',
            'hope_salary', 'cv', 'status', 'status_display', 'employer_note', 'user', 'company'
        ]
        read_only_fields = ['status', 'employer_note']

    def validate(self, data):
        user = self.context['request'].user
        job = data.get('job')
        if job is None:
            raise serializers.ValidationError("Job information is required.")

        existing_application = Application.objects.filter(job=job, user=user)
        if self.instance:
            existing_application = existing_application.exclude(pk=self.instance.pk)

        if existing_application.exists():
            raise serializers.ValidationError("You have already applied for this job.")

        return data

    def validate_cv(self, value):
        if not value.name.endswith(('.pdf', '.docx', '.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError("Unsupported file type. Please upload a PDF, DOCX, or image file.")
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 5MB.")
        return value

    def create(self, validated_data):
        cv_file = validated_data.pop('cv', None)
        job = validated_data.get('job')
        user = self.context['request'].user

        if cv_file:
            upload_result = upload(cv_file, resource_type='raw')
            validated_data['cv'] = upload_result['secure_url']

        validated_data['user'] = user
        validated_data['company'] = job.company 

        return super().create(validated_data)



class ApplicationDetailSerializer(ApplicationSerializer):
    job = JobSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta(ApplicationSerializer.Meta):
        fields = ApplicationSerializer.Meta.fields + ['job', 'user']
        read_only_fields = ['status', 'employer_note', 'user']

        
class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ['id', 'user', 'company', 'created_date']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_date']


class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'company', 'job', 'rating', 'comment', 'created_date', 'updated_date']
        read_only_fields = ['id', 'user', 'created_date', 'updated_date']

    def validate(self, data):
        user = self.context['request'].user
        company = data.get('company')
        job = data.get('job')

        if self.instance:
            # Skip duplicate check when updating
            return data

        if Rating.objects.filter(user=user, company=company, job=job).exists():
            raise serializers.ValidationError("Bạn đã đánh giá công ty này cho công việc này rồi.")
        return data

class EmployerRatingSerializer(serializers.ModelSerializer):
    employer = serializers.StringRelatedField(read_only=True)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    application = serializers.PrimaryKeyRelatedField(queryset=Application.objects.all(), required=False, allow_null=True)

    class Meta:
        model = EmployerRating
        fields = ['id', 'employer', 'user', 'application', 'rating', 'comment', 'created_date', 'updated_date']
        read_only_fields = ['id', 'employer', 'created_date', 'updated_date']

    def validate(self, data):
        employer = self.context['request'].user
        user = data.get('user')
        application = data.get('application')

        if self.instance:
            # Skip duplicate check when updating
            return data

        if EmployerRating.objects.filter(employer=employer, user=user, application=application).exists():
            raise serializers.ValidationError("Bạn đã đánh giá ứng viên này cho đơn ứng tuyển này rồi.")
        return data

import mimetypes
class DocumentVerificationSerializer(serializers.Serializer):
    document_front = serializers.FileField()
    document_back = serializers.FileField(required=False, allow_null=True)
    selfie_image = serializers.FileField(required=False, allow_null=True)
    document_type = serializers.ChoiceField(choices=VerificationDocument.DOCUMENT_TYPE_CHOICES)

    def validate_document_front(self, value):
        return self._validate_file(value, "Hình mặt trước tài liệu")

    def validate_document_back(self, value):
        return self._validate_file(value, "Hình mặt sau tài liệu") if value else value

    def validate_selfie_image(self, value):
        return self._validate_file(value, "Hình selfie") if value else value

    def _validate_file(self, file, field_name):
        if not file:
            raise serializers.ValidationError(f"{field_name} là bắt buộc.")

        mime_type, _ = mimetypes.guess_type(file.name)
        valid_types = ['image/jpeg', 'image/png']

        if mime_type not in valid_types:
            raise serializers.ValidationError(
                f"{field_name} không hợp lệ. Chỉ chấp nhận file JPG hoặc PNG."
            )

        if file.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError(
                f"{field_name} quá lớn. Kích thước tối đa là 5MB."
            )

        return file