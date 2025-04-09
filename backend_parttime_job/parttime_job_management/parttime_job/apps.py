from django.apps import AppConfig


class ParttimeJobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'parttime_job'

    def ready(self):
        import parttime_job.signals
