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


# Hồ sơ ứng viên
class CandidateProfile(BaseModel):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="candidate_profile")
    address = models.TextField(blank=True)

    def __str__(self):
        return self.user.last_name + " " + self.user.first_name


# Đơn ứng tuyển
class Application(BaseModel):
    STATUS_CHOICES = (
        ('pending', 'Đang chờ'),
        ('accepted', 'Đã chấp nhận'),
        ('rejected', 'Đã từ chối'),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name="applications")

    education = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    current_job = models.TextField(blank=True)
    hope_salary = models.CharField(max_length=100, blank=True)
    cv = CloudinaryField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    employer_note = models.TextField(blank=True)

    class Meta:
        unique_together = ('job', 'candidate')

    def __str__(self):
        return f"{self.candidate.user.username()} ứng tuyển {self.job.title}"



# class VerificationDocument(BaseModel):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     document = models.FileField(upload_to="verifications/")
#     status = models.CharField(max_length=20, choices=(
#         ('pending', 'Đang chờ'),
#         ('approved', 'Đã duyệt'),
#         ('rejected', 'Từ chối'),
#     ), default='pending')
#     submitted_at = models.DateTimeField(auto_now_add=True)


# class FollowCompany(BaseModel):
#     candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE)
#     employer = models.ForeignKey(EmployerProfile, on_delete=models.CASCADE)
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         unique_together = ('candidate', 'employer')

# class Rating(BaseModel):
#     from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ratings_given")
#     to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ratings_received")
#     job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
#     rating = models.PositiveIntegerField()
#     comment = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)


# class Notification(BaseModel):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     message = models.TextField()
#     is_read = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)
