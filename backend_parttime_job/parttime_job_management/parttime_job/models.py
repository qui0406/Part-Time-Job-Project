from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField


from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Quản trị viên'),
        ('employer', 'Nhà tuyển dụng'),
        ('candidate', 'Ứng viên'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='candidate')
    avatar = CloudinaryField(null=True)

    def __str__(self):
        return self.username
    

class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Company(BaseModel):
    employer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company')
    name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    location = models.CharField(max_length=255)
    images = CloudinaryField(null=True)
    verified = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name
    

    
