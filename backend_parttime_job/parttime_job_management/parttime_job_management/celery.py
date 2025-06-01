from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings

# set the default Django settings module for the 'celery' program.
# this is also used in manage.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parttime_job_management.settings')

app = Celery('parttime_job_management')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()
