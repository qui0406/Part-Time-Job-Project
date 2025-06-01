from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_new_job_email(user_email, user_first_name, job_title, company_name):
    subject = f"Công ty {company_name} vừa đăng tin tuyển dụng mới!"
    message = (
        f"Chào {user_first_name},\n\n"
        f"Công ty {company_name} mà bạn theo dõi vừa đăng tin tuyển dụng: \"{job_title}\".\n"
        f"Hãy đăng nhập vào hệ thống để xem chi tiết và ứng tuyển nếu phù hợp.\n\n"
        f"Trân trọng,\n"
        f"Đội ngũ hỗ trợ"
    )
    from_email = settings.DEFAULT_FROM_EMAIL
    try:
        send_mail(subject, message, from_email, [user_email])
    except Exception as e:
        # Optional: Log error
        print(f"[ERROR] Gửi mail tới {user_email} thất bại: {str(e)}")

