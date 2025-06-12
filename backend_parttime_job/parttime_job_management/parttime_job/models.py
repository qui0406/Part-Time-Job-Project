from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

from django.conf import settings
from django.core import signing
from django.core.validators import validate_email
import hashlib

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
    email = models.EmailField(unique=True, blank=True, validators=[validate_email])
    avatar = CloudinaryField(null= False)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    is_verified = models.BooleanField(default=False)  
    modified_date = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    firebase_uid = models.CharField(max_length=255, blank=True, null=True, help_text="Firebase user UID")
    firebase_email = models.EmailField(blank=True, null=True, help_text="Firebase authentication email")
    _firebase_password = models.BinaryField(max_length=255, blank=True, null=True)

    @property
    def firebase_password(self):
        if self._firebase_password:
            try:
                # Decode bytes to string and load the signed value
                password_str = self._firebase_password.decode('utf-8')
                return signing.loads(password_str)
            except (signing.BadSignature, UnicodeDecodeError, ValueError) as e:
                return None
        return None

    @firebase_password.setter
    def firebase_password(self, value):
        if value:
            # Serialize and encode to bytes
            self._firebase_password = signing.dumps(value).encode('utf-8')
        else:
            self._firebase_password = None

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Company(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="employer_profile")
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
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="images")
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


class Job(BaseModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="jobs")
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.TextField()
    skills = models.TextField()
    working_time = models.CharField(max_length=100)
    from_salary = models.FloatField(validators=[MinValueValidator(0)], default=0, blank=True, null=True)
    to_salary = models.FloatField(validators=[MinValueValidator(0)], default=0, blank=True, null=True)
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
        return self.job.title


class Notification(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, null=True, blank=True) 

    def __str__(self):
        return self.message

class Follow(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    class Meta:
        unique_together = ('user', 'company')
    def __str__(self):
        return self.company.company_name


class Rating(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    is_reading = models.BooleanField(default=False)  

    class Meta:
        unique_together = ('user', 'company', 'job')

    def __str__(self):
        return f"{self.user.username} - {self.company.company_name} - {self.rating}" 

class CommentDetail(BaseModel):
    rating_employer = models.OneToOneField('Rating', on_delete=models.CASCADE, related_name='comment_employer_rating') 
    employer_reply = models.TextField(blank=True)
    
    def __str__(self):
        return self.employer_reply
    
class ReplyCommetFromEmployerDetail(BaseModel):
    rating_candidate = models.OneToOneField('EmployerRating', on_delete=models.CASCADE, related_name='reply_candidate_rating') 
    candidate_reply = models.TextField(blank=True)
    
    def __str__(self):
        return self.candidate_reply


class EmployerRating(BaseModel):
    employer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="given_applicant_ratings") 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="candidate_ratings")
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    is_reading = models.BooleanField(default=False)  

    class Meta:
        unique_together = ('employer', 'user', 'application')

    def __str__(self):
        return f"{self.employer.username} - {self.user.username} - {self.rating}"
    
class VerificationDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('id_card', 'CMND/CCCD'),
        ('business_license', 'Giấy phép kinh doanh'),
        ('student_card', 'Thẻ sinh viên'),
        ('other', 'Khác'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name="verification_documents")
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    document_front = CloudinaryField('document_front', resource_type='image', blank=True, null=True)
    document_back = CloudinaryField('document_back', resource_type='image', blank=True, null=True)
    selfie_image = CloudinaryField('selfie_image', resource_type='image', blank=True, null=True)

    verified = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reviewed_documents")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.document_type}"

class Conversation(BaseModel):
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name="candidate_conversations")
    employer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="employer_conversations")
    firebase_conversation_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        unique_together = ('candidate', 'employer')
        ordering = ['-created_date']

    def __str__(self):
        return self.candidate.username + " - " + self.employer.username

class Message(BaseModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    firebase_key = models.CharField(max_length=255, blank=True)  
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username} in {self.conversation.id}"
