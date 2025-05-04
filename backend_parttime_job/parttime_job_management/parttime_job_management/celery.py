from __future__ import absolute_import, unicode_literals
import os
from backend_parttime_job.parttime_job_management.parttime_job_management.celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parttime_job_management.settings')
app = Celery('parttime_job')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()