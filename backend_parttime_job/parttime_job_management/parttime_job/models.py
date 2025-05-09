from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import PermissionsMixin
from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models
import uuid
from django.utils import timezone
# from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.validators import MinValueValidator, MaxValueValidator
from django_rest_passwordreset.signals import reset_password_token_created
from django.dispatch import receiver
from django.urls import reverse
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

from rest_framework.authtoken.models import Token
from django.conf import settings


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class User(AbstractUser, BaseModel):
    ADMIN = 'admin'
    EMPLOYER = 'employer'
    CANDIDATE = 'candidate'
    ROLE_CHOICES = (
        (ADMIN, 'Quản trị viên'),
        (EMPLOYER, 'Nhà tuyển dụng'),
        (CANDIDATE, 'Ứng viên'),
    )
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default=CANDIDATE)
    email = models.EmailField(unique=True, null=True, blank=True)
    avatar = CloudinaryField(null=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    is_verified = models.BooleanField(default=False)  # Xac thuc nguoi dung

    modified_date = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username


class Company(BaseModel):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="employer_profile")
    company_name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    company_phone = models.CharField(max_length=20, blank=True)
    company_email = models.EmailField(blank=True)
    address = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_approved = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)

    def __str__(self):
        return self.company_name


class CompanyImage(models.Model):
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="images")
    image = CloudinaryField()


class CompanyApprovalHistory(models.Model):
    company = models.ForeignKey(
        "Company", on_delete=models.CASCADE, related_name="approval_history")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    is_approved = models.BooleanField()
    is_rejected = models.BooleanField()
    reason = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = "Phê duyệt" if self.is_approved else "Từ chối"
        return f"{status} - {self.company.name} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class Job(BaseModel):
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="jobs")
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.TextField()
    skills = models.TextField()
    salary = models.CharField(max_length=100)
    working_time = models.CharField(max_length=100)

    def __str__(self):
        return self.title


class Application(BaseModel):
    STATUS_CHOICES = (
        ('pending', 'Đang chờ'),
        ('accepted', 'Đã chấp nhận'),
        ('rejected', 'Đã từ chối'),
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')

    education = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    current_job = models.TextField(blank=True)
    hope_salary = models.CharField(max_length=100, blank=True)
    cv = CloudinaryField('cv', resource_type='raw', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    employer_note = models.TextField(blank=True)

    class Meta:
        unique_together = ('job', 'user')

    def __str__(self):
        return f"{self.user.username if self.user else 'No User'} ứng tuyển {self.job.title}"



class Notification(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, null=True, blank=True) 

    def __str__(self):
        return f"Notification to {self.user.username} - {'Đã đọc' if self.is_read else 'Chưa đọc'}"

class Follow(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    class Meta:
        unique_together = ('user', 'company')
    def __str__(self):
        return f"{self.user.username} follows {self.company.company_name}"


class Rating(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ('user', 'company', 'job')

    def __str__(self):
        return f"Rating({self.user} → {self.company}): {self.rating}★"
    

class EmployerRating(BaseModel):
    employer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="given_applicant_ratings") 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="candidate_ratings")  # ứng viên
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ('employer', 'user', 'application')

    def __str__(self):
        return f"EmployerRating({self.employer.username} → {self.user.username}): {self.rating}★"


from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField

class VerificationDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('id_card', 'CMND/CCCD'),
        ('business_license', 'Giấy phép kinh doanh'),
        ('student_card', 'Thẻ sinh viên'),
        ('other', 'Khác'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_documents"
    )
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)

    document_front = CloudinaryField('document_front', resource_type='image', blank=True, null=True)
    document_back = CloudinaryField('document_back', resource_type='image', blank=True, null=True)
    selfie_image = CloudinaryField('selfie_image', resource_type='image', blank=True, null=True)

    verified = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_documents"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_document_type_display()} - {'Đã xác minh' if self.verified else 'Chưa xác minh'}"

# class Conversation(BaseModel):
#     participants = models.ManyToManyField(User, related_name="conversations")
#     job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)

# class Message(BaseModel):
#     conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
#     sender = models.ForeignKey(User, on_delete=models.CASCADE)
#     content = models.TextField()
#     sent_at = models.DateTimeField(auto_now_add=True)
#     is_read = models.BooleanField(default=False)
