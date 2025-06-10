from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailAuthBackend:
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(Q(email=username) | Q(username=username))
            if user.check_password(password) and user.is_active:
                return user
        except User.MultipleObjectsReturned:
            # Log error or handle if you expect duplicates (not ideal)
            return None
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None