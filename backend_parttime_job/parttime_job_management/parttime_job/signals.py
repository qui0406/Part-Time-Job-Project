from django.dispatch import receiver
from django_rest_passwordreset.signals import reset_password_token_created
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from celery import shared_task
from parttime_job.models import User, Job, Follow, Notification
from django.conf import settings
from django.core.mail import send_mail

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, **kwargs):
    link = f"parttime_job://reset-password?token={reset_password_token.key}"
    context = {'full_link': link, 'email_address': reset_password_token.user.email}

    html_message = render_to_string("email/user_reset_password.html", context)
    plain_message = strip_tags(html_message)

    msg = EmailMultiAlternatives(
        subject="Đặt lại mật khẩu",
        body=plain_message,
        from_email="anhqui04062004@gmail.com",
        to=[reset_password_token.user.email],
    )
    msg.attach_alternative(html_message, "text/html")
    msg.send()





# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from parttime_job.models import Application, Conversation, User
# from parttime_job.firebase import get_firebase_db

# @receiver(post_save, sender=Application)
# def create_conversation(sender, instance, **kwargs):
#     if instance.status == 'accepted':
#         candidate = instance.user
#         employer = instance.job.company.user
#         job = instance.job
        
#         # Kiểm tra conversation đã tồn tại
#         conversation = Conversation.objects.filter(
#             participants=candidate,
#             job=job
#         ).filter(participants=employer).first()
        
#         if not conversation:
#             conversation = Conversation.objects.create(job=job, firebase_conversation_id=f'conversation_{instance.id}')
#             conversation.participants.add(candidate, employer)
#             conversation.save()
            
#             # Cập nhật participants trong Firebase
#             firebase_db = get_firebase_db()
#             firebase_db.reference(f'conversations/conversation_{conversation.id}/participants').set({
#                 candidate.firebase_uid: True,
#                 employer.firebase_uid: True,
#             })