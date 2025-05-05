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


def send_job_notification(job_id):
    try:
        job = Job.objects.select_related("company").get(id=job_id)
        company = job.company
    except Job.DoesNotExist:
        return

    followers = Follow.objects.filter(company=company, active=True).select_related("user")

    for follow in followers:
        user = follow.user
        if user.is_verified:
            # Gửi notification trong hệ thống
            Notification.objects.create(
                user=user,
                message=f"Công ty {company.company_name} vừa đăng tin tuyển dụng mới: {job.title}",
            )

            # Gửi email
            subject = f"Tin tuyển dụng mới từ {company.company_name}"
            message = (
                f"Chào {user.username},\n\n"
                f"Công ty {company.company_name} vừa đăng tin tuyển dụng mới:\n"
                f"- Tiêu đề: {job.title}\n"
                f"- Mô tả: {job.description[:200]}...\n"
                f"- Xem chi tiết: {settings.SITE_URL}/jobs/{job.id}/\n\n"
                f"Trân trọng,\nHệ thống PartTime Job"
            )

            msg = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.send(fail_silently=True)