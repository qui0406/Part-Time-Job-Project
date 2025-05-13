import pyrebase
from django.conf import settings
from parttime_job.models import Message
from django.contrib.auth.models import User

firebase = pyrebase.initialize_app(settings.FIREBASE_CONFIG)
db = firebase.database()

def stream_handler(message):
    if message["event"] in ["put", "patch"] and message["data"]:
        data = message["data"]
        sender = User.objects.get(username=data["sender"])
        receiver = User.objects.get(username=data["receiver"])
        Message.objects.update_or_create(
            firebase_key=message["path"].split("/")[-1],
            defaults={
                "sender": sender,
                "receiver": receiver,
                "content": data["content"],
                "timestamp": data["timestamp"]
            }
        )

db.child("messages").stream(stream_handler)