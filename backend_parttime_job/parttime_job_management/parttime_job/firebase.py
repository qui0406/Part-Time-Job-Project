import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate('parttime_job/chat/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://app-chat-e506d-default-rtdb.firebaseio.com/'
})

def get_firebase_db():
    return db