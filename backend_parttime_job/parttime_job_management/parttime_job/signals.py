from django.dispatch import receiver
from django_rest_passwordreset.signals import reset_password_token_created
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

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