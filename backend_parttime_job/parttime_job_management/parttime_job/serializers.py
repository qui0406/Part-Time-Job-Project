from rest_framework import serializers  
from parttime_job.models import User, Company, CompanyImage, CompanyApprovalHistory, Job, Application, Follow, Notification, Rating, EmployerRating, VerificationDocument, Conversation, Message, CommentDetail, ReplyCommetFromEmployerDetail  
import re
from django.core.exceptions import ValidationError
from cloudinary.uploader import upload


class ItemSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url
        return data


class UserSerializer(serializers.ModelSerializer):
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
        fields = ['id', 'first_name', 'last_name', 'username', 'email',
                  'phone_number', 'password', 'role', 'avatar']
        extra_kwargs = {'password': {'write_only': True}}

class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username',
                  'email', 'phone_number', 'password']

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))
        return super().update(instance, validated_data)
    
class CompanyImageSerializer(ItemSerializer):
    class Meta:
        model = CompanyImage
        fields = ['image']


class CompanySerializer(serializers.ModelSerializer):
    images = serializers.ListField(child=serializers.ImageField(), write_only=True, required=True)
    image_list = serializers.SerializerMethodField()
    followed = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()

    def create(self, validated_data):
        images = validated_data.pop('images') 
        user = self.context['request'].user
        company = Company.objects.create(user=user, **validated_data)

        for image in images:
            CompanyImage.objects.create(company=company, image=image)

        return company


    def get_followed(self, obj):    
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(
                user=request.user, company=obj, active = True).exists()
        return False
    
    def get_image_list(self, obj):
        images = obj.images.all()
        return CompanyImageSerializer(images, many=True).data
    

    def validate_images(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Cần ít nhất 3 hình ảnh môi trường làm việc.")
        for image in value:
            if image.content_type not in ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']:
                raise serializers.ValidationError("Chỉ chấp nhận ảnh JPEG, PNG, JPG, WEBP, GIF")
        return value

    def validate_company_name(self, value):
        if not value:
            raise serializers.ValidationError("Tên công ty không được để trống.")
        return value


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
    
    def get_follower_count(self, obj):
        return Follow.objects.filter(company=obj).count()

class CompanyApprovalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyApprovalHistory
        fields = ['company', 'approved_by', 'is_approved',
                  'is_rejected', 'reason', 'timestamp']

class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ['id', 'company', 'company_name', 'title', 'description',
                  'location', 'skills','from_salary', 'to_salary', 'working_time', 'active']
        extra_kwargs = {
            'company': {'read_only': True},
            'active': {'read_only': True}
        }

    def get_company_name(self, obj):
        return obj.company.company_name

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
    user =serializers.SerializerMethodField(read_only=True)
    cv = serializers.FileField(required=True)
    status_display = serializers.SerializerMethodField()

    
    class Meta:
        model = Application
        fields = [
            'id', 'education', 'experience', 'current_job',
            'hope_salary', 'cv', 'status', 'status_display', 'employer_note', 'user',
        ]
        read_only_fields = ['status', 'employer_note']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }
    
    
    def get_status_display(self, obj):
        return obj.get_status_display() 

    def validate(self, data):
        request = self.context.get('request')
        user = request.user
        job = request.data.get('job_id')
        if job is None:
            
            raise serializers.ValidationError("Thông tin công việc là bắt buộc")

        existing_application = Application.objects.filter(job=job, user=user)
        if self.instance:
            existing_application = existing_application.exclude(pk=self.instance.pk)

        if existing_application.exists():
            raise serializers.ValidationError("Bạn đã nộp đơn ứng tuyển cho công việc này rồi")

        return data

    def validate_cv(self, value):
        if not value.name.endswith(('.pdf', '.docx', '.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError("Chỉ hỗ trợ file PDF, DOCX, JPG, JPEG, PNG.")
        return value


class ApplicationJobSerializer(serializers.ModelSerializer):
    job = serializers.SerializerMethodField(read_only=True)
    company = serializers.SerializerMethodField(read_only=True)  
    user = serializers.SerializerMethodField(read_only=True)
    cv = serializers.FileField(required=True)
    status_display = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job', 'education', 'experience', 'current_job',
            'hope_salary', 'cv', 'status', 'status_display', 'employer_note', 'user', 'company', 'created_date', 'updated_date'
        ]
        read_only_fields = ['status', 'employer_note', 'company', 'user']

    def get_job(self, obj):
        return obj.job.title 
    
    def get_company(self, obj):
        return obj.job.company.company_name 
    
    def get_user(self, obj):
        return {
            'username': obj.user.username,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    

class ApplicationDetailSerializer(ApplicationSerializer):
    job = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)

    class Meta(ApplicationSerializer.Meta):
        fields = ApplicationSerializer.Meta.fields + ['job', 'user']
        read_only_fields = ['status', 'employer_note', 'user']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }
    
    def get_job(self, obj):
        return {
            'id': obj.job.id,
            'title': obj.job.title,
            'company_name': obj.job.company.company_name,
            'company': obj.job.company.id
        }

        
class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ['id', 'user', 'company', 'created_date']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_date']


class RatingSerializer(serializers.ModelSerializer):
    job = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    company= serializers.SerializerMethodField()

    class Meta:
        model = Rating
        fields = ['id', 'user', 'company', 'job', 'rating', 'comment', 'created_date', 'updated_date', 'is_reading']
        read_only_fields = ['id', 'user', 'created_date', 'updated_date']

    def validate(self, data):
        user = self.context['request'].user
        request = self.context['request']
        company = request.data.get('company')
        job = request.data.get('job')
        if not job:
            raise serializers.ValidationError("Trường job là bắt buộc")
        elif not company:
            raise serializers.ValidationError("Trường company là bắt buộc khi không có job.")

        if not self.instance:
            if Rating.objects.filter(user=user, company=company, job=job).exists():
                raise serializers.ValidationError("Bạn đã đánh giá công ty này cho công việc này rồi.")

        return data
    
    def get_user(self, obj):
        return obj.user.username
        
    
    def get_company(self, obj):
        if obj.company:
            return obj.company.id
            
    
    def get_job(self, obj):
        if obj.job:
            return obj.job.id
            
    

class RatingDetailSerializer(RatingSerializer):
    job = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)
    company= serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)


    class Meta(RatingSerializer.Meta):
        fields = RatingSerializer.Meta.fields + ['user', 'company', 'job', 'is_reading', 'user_name']
        read_only_fields = ['id', 'created_date', 'updated_date', 'user', 'company', 'job']
    
    def get_user(self, obj):
        return obj.user.username
    
    def get_company(self, obj):
        if obj.company:
            return obj.company.company_name
    
    def get_job(self, obj):
        if obj.job:
            return obj.job.title
        
    def get_user_name(self, obj):
        return obj.user.username 
    

class EmployerRatingSerializer(serializers.ModelSerializer):
    employer = serializers.StringRelatedField(read_only=True)
    job = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)
    company= serializers.SerializerMethodField(read_only=True)

    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EmployerRating
        fields = ['id', 'employer', 'user', 'job', 'user_name', 'company', 'rating', 'comment', 'is_reading', 'created_date', 'updated_date']
        read_only_fields = ['id', 'employer', 'created_date', 'updated_date']

    def validate(self, data):
        request = self.context['request']
        user = request.user
        application = request.data.get('application')

        if not application:
            raise serializers.ValidationError({"application": "Bạn cần cung cấp application để đánh giá."})

        return data
    
    def get_candidate_reply(self, obj):
        try:
            reply = getattr(obj, 'comment_employer_rating')
            if reply.active:
                return {
                    'candidate_reply': reply.candidate_reply,
                    'created_date': reply.created_date,
                    'updated_date': reply.updated_date
                }
        except Exception as e:
            return str(e)
        
    def get_user(self, obj):
        return obj.user.username
    
    
    def get_company(self, obj):
        if obj.application.job.company:
            return obj.application.job.company.company_name
            
    
    def get_job(self, obj):
        if obj.application.job:
            return obj.application.job.title
            
        
    def get_user_name(self, obj):
        return obj.user.username 
    

    
class CommentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentDetail
        fields = ['id', 'employer_reply', 'created_date', 'updated_date']
        read_only_fields = ['id', 'created_date', 'updated_date']

    def validate(self, data):
        if self.context['request'].user.role != 'employer':
            raise serializers.ValidationError({"detail": "Chỉ employer mới có thể trả lời."})
        
        rating_employer = self.context.get('rating_employer')
        if rating_employer and hasattr(rating_employer, 'reply'):
            raise serializers.ValidationError({"detail": "Employer đã trả lời đánh giá này."})
        return data
    
class ReplyCommentEmployerDetailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(read_only=True)
    comment = serializers.SerializerMethodField(read_only=True)
    rating = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ReplyCommetFromEmployerDetail
        fields = ['user', 'candidate_reply','comment', 'rating', 'created_date',  'updated_date' ]
        read_only_fields = ['user', 'user_name', 'application', 'job', 'company', 'comment', 'rating', 'created_date', 'updated_date']

    def get_user(self, obj):
        return obj.rating_candidate.user.username 
    
    def get_comment(self, obj):
        return obj.rating_candidate.comment
    
    def get_rating(self, obj):
        return obj.rating_candidate.rating 

    def validate(self, data):
        rating_candidate = data.get('rating_candidate')
        candidate_reply = data.get('candidate_reply')

        if not candidate_reply:
            raise serializers.ValidationError({"candidate_reply": "câu trả lời không được để trống"})

        if rating_candidate and ReplyCommetFromEmployerDetail.objects.\
        filter(rating_candidate=rating_candidate).exists():
            raise serializers.ValidationError(
                {"detail": "Đã có đánh giá từ employer cho rating này"}
            )
        return data
    

    
class RatingWithCommentSerializer(serializers.ModelSerializer):
    reply = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Rating
        fields = ['id','user', 'job', 'company', 'rating', 'created_date', 'comment', 'reply']

    def get_reply(self, rating):
        reply = CommentDetail.objects.filter(rating_employer=rating, active=True)
        return CommentDetailSerializer(reply, many=True).data
    
    def get_user(self, obj):
        return obj.user.username
        
    
    def get_job(self, obj):
        if obj.job:
            return obj.job.title
            

class RatingEmployerWithCommentSerializer(serializers.ModelSerializer):
    reply = serializers.SerializerMethodField()
    employer = serializers.StringRelatedField(read_only=True)  
    user = serializers.SerializerMethodField(read_only=True) 
    application = serializers.SerializerMethodField(read_only=True)  
    job = serializers.SerializerMethodField(read_only=True) 
    company = serializers.SerializerMethodField(read_only=True) 

    class Meta:
        model = EmployerRating
        fields = ['id', 'employer', 'user', 'application', 'rating', 'comment', 'created_date', 'job',          'company', 'reply']
        read_only_fields = ['id', 'employer', 'user', 'application', 'rating', 'comment', 'created_date', 'job', 'company', 'reply']
    def get_reply(self, rating):
        reply = ReplyCommetFromEmployerDetail.objects.filter(rating_candidate=rating, active=True)
        return ReplyCommentEmployerDetailSerializer(reply, many=True, context=self.context).data
    
    def get_user(self, obj):
        return obj.user.username
        
    
    def get_job(self, obj):
        if obj.application and obj.application.job:
            return obj.application.job.title
            
    
    def get_company(self, obj):
        if obj.application and obj.application.job and obj.application.job.company:
            return obj.application.job.company.company_name
            
    
    def get_application(self, obj):
        if obj.application:
            return obj.application.job.title


class DocumentVerificationSerializer(serializers.Serializer):
    document_front = serializers.FileField()
    document_back = serializers.FileField(required=True)
    selfie_image = serializers.FileField(required=True)
    document_type = serializers.ChoiceField(choices=VerificationDocument.DOCUMENT_TYPE_CHOICES)

    def validate_document_front(self, value):
        return self.validate_file(value, "Hình mặt trước tài liệu")

    def validate_document_back(self, value):
        return self.validate_file(value, "Hình mặt sau tài liệu") if value else value

    def validate_selfie_image(self, value):
        return self.validate_file(value, "Hình selfie") if value else value

    def validate_file(self, file, field_name):
        if not file:
            raise serializers.ValidationError(f"{field_name} là bắt buộc.")
        file_name = file.name.lower()
        valid_extensions = ['.jpg', '.jpeg', '.png']
        if not any(file_name.endswith(ext) for ext in valid_extensions):
            raise serializers.ValidationError(
                f"{field_name} không hợp lệ. Chỉ chấp nhận file JPG hoặc PNG."
            )
        return file

class ConversationSerializer(serializers.ModelSerializer):
    candidate_username = serializers.SerializerMethodField()
    employer_username = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'candidate', 'employer', 'created_date', 'candidate_username', 'employer_username', 'last_message']
        read_only_fields = ['created_date']

    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content,
                'sender': last_message.sender.username,
                'timestamp': last_message.timestamp
            }
        
    def get_candidate_username(self, obj):
        return obj.candidate.username 
    
    def get_employer_username(self, obj):
        return obj.employer.username 

class MessageSerializer(serializers.ModelSerializer):
    conversation = ConversationSerializer(read_only=True)
    conversation_id = serializers.PrimaryKeyRelatedField(queryset=Conversation.objects.all(), 
                                                         source='conversation', write_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'conversation_id', 'sender', 'receiver', 'content', 'timestamp']