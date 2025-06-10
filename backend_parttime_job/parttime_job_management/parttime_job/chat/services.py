from decouple import config
import pyrebase
from django.core.exceptions import ObjectDoesNotExist
import logging
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)

# Firebase configuration
# firebase_config = {
#     "apiKey": "AIzaSyBYTjtEh-Yj-JLM2-NsFgvBZVU33K2dsN8",
#   "authDomain": "app-chat-e506d.firebaseapp.com",
#   "databaseURL": "https://app-chat-e506d-default-rtdb.firebaseio.com",
#   "projectId": "app-chat-e506d",
#   "storageBucket": "app-chat-e506d.firebasestorage.app",
#   "messagingSenderId": "542889717655",
#   "appId": "1:542889717655:web:1b2e4e69ce692b4c2a5ed2",
#   "measurementId": "G-G857ZNYNYV"
# }
firebase_config = {
    "apiKey": "AIzaSyBYTjtEh-Yj-JLM2-NsFgvBZVU33K2dsN8",
  "authDomain": "app-chat-e506d.firebaseapp.com",
  "databaseURL": "https://app-chat-e506d-default-rtdb.firebaseio.com",
  "projectId": "app-chat-e506d",
  "storageBucket": "app-chat-e506d.firebasestorage.app",
  "messagingSenderId": "542889717655",
  "appId": "1:542889717655:web:1b2e4e69ce692b4c2a5ed2",
  "measurementId": "G-G857ZNYNYV"
}

firebase = pyrebase.initialize_app(firebase_config)
auth = firebase.auth()
db = firebase.database()
storage = firebase.storage()

def sync_message_to_firebase(message):
    
    try:
        # Get sender's profile for Firebase credentials
        try:
            profile = message.sender.profile
            firebase_email = profile.firebase_email or message.sender.email
            firebase_password = profile.firebase_password
            


            if not firebase_email or not firebase_password:
                raise ValueError("Firebase credentials missing for user.")
            
            logger.debug(f"Retrieved credentials: email={firebase_email}, password={'*' * len(str(firebase_password))}")

        except ObjectDoesNotExist:
            raise ValueError("User profile not found. Ensure UserProfile exists.")
        try:
  
            logger.debug(f"Attempting Firebase login with email: {firebase_email}")
            user = auth.sign_in_with_email_and_password(firebase_email, firebase_password)
        except HTTPError as auth_error:
            # Safely extract error message
            error_message = str(auth_error)
            if hasattr(auth_error, 'response') and auth_error.response is not None:
                try:
                    error_message = auth_error.response.json().get('error', {}).get('message', error_message)
                except (ValueError, AttributeError):
                    pass
            logger.error(f"Authentication failed: {error_message}")
            raise ValueError(f"Firebase authentication failed: {error_message}")

        # Prepare message data
        message_data = {
            'conversation_id': str(message.conversation.id),
            'sender_id': str(message.sender.id),
            'receiver_id': str(message.receiver.id),
            'content': message.content,
            'timestamp': message.timestamp.isoformat(),
            'is_read': message.is_read,
        }
        conversation_id = message.conversation.firebase_conversation_id or str(message.conversation.id)
        messages_ref = db.child('conversations').child(conversation_id).child('messages')
        result = messages_ref.push(message_data, user['idToken'])
        
        return result['name']  # Return Firebase key

    except ValueError as ve:
        raise ve
    except Exception as e:
        logger.error(f"Failed to sync message to Firebase: {str(e)}")
        raise Exception(f"Failed to sync message to Firebase: {str(e)}")