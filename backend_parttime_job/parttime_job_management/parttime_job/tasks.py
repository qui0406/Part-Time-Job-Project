from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from .models import Job, User

@shared_task
def send_job_email_to_user(user_id, job_id):
    user = User.objects.get(id=user_id)
    job = Job.objects.get(id=job_id)
    company = job.company

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
    msg.send()
