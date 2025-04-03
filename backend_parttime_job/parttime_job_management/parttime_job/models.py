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

class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class User(AbstractUser, BaseModel, PermissionsMixin):
    ADMIN = 'admin'
    EMPLOYER = 'employer'
    CANDIDATE = 'candidate'
    ROLE_CHOICES = (
        (ADMIN, 'Quản trị viên'),
        (EMPLOYER, 'Nhà tuyển dụng'),
        (CANDIDATE, 'Ứng viên'),
    )
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='candidate')
    email = models.EmailField(unique=True, null=True, blank=True)
    avatar = CloudinaryField(null=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    active = models.BooleanField(default=True)

    username = models.CharField(max_length=40, unique=True)
    first_name = models.CharField(max_length=30, blank=False)
    last_name = models.CharField(max_length=50, blank=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    modified_date = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username
    

# class Company(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company')
#     company_name = models.CharField(max_length=255)
#     tax_code = models.CharField(max_length=50)
#     is_approved = models.BooleanField(default=False)

#     def __str__(self):
#         return self.company_name


# class CompanyImage(models.Model):
#     employer = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='work_images')
#     image = CloudinaryField(null=False)

#     def __str__(self):
#         return f"Ảnh của {self.employer.company_name}"
    

