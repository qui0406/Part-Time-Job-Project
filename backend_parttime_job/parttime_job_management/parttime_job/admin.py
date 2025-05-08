from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Job, Company, Application, Notification, Rating, EmployerRating
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models.functions import TruncMonth
from django.db.models import Count
from datetime import datetime, timedelta

class MyUserAdmin(UserAdmin):
    list_display = ['id', 'username', 'email', 'is_active', 'is_staff', 'avatar']
    list_filter = [ 'is_active']
    search_fields = ['username', 'email']
    ordering = ['id']

    # fieldsets = UserAdmin.fieldsets + (
    #     ('Thông tin bổ sung', {'fields': ('role', 'avatar')}),
    # )

class StatsReportView(APIView):
    permission_classes = [IsAdminUser]  # Chỉ Admin được xem

    def get(self, request):
        # 6 tháng gần nhất
        today = datetime.today()
        six_months_ago = today - timedelta(days=180)

        # Việc làm theo tháng
        jobs_by_month = (
            Job.objects.filter(created_date__gte=six_months_ago)
            .annotate(month=TruncMonth("created_date"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        job_labels = [entry["month"].strftime("%m/%Y") for entry in jobs_by_month]
        job_counts = [entry["count"] for entry in jobs_by_month]

        # Người dùng theo vai trò
        candidates_by_month = (
            User.objects.filter(role='candidate', created_date__gte=six_months_ago)
            .annotate(month=TruncMonth("created_date"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        employers_by_month = (
            User.objects.filter(role='employer', created_date__gte=six_months_ago)
            .annotate(month=TruncMonth("created_date"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        def format_stats(entries):
            return {
                "labels": [e["month"].strftime("%m/%Y") for e in entries],
                "data": [e["count"] for e in entries]
            }

        return Response({
            "job_stats": {
                "labels": job_labels,
                "data": job_counts
            },
            "candidate_stats": format_stats(candidates_by_month),
            "employer_stats": format_stats(employers_by_month)
        })

admin.site.register(User, MyUserAdmin)
