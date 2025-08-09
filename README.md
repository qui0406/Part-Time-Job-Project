# 🚀 Part-Time Job Management System

# Backend: Django
# Front-end: React-native

- ## 🌟 Key Features
- **🔐 OAuth2 Authentication** - Secure login with social accounts
- **💬 Real-time Chat** - Firebase-powered messaging
- **🗺️ Location-based Jobs** - OpenStreetMap integration
- **📸 Cloud Media** - Cloudinary for image/uploads
- **📱 Cross-platform** - React Native for iOS/Android

### Prerequisites
- Python 3.12
- Node.js 16+
- MySQL 8.0+
- Expo CLI (for mobile)

Getting started
# Clone repository
git clone https://github.com/qui0406/Part-Time-Job-Project
cd Part-Time-Job-Project


### Backend Setup
cd parttime_job_management/parttime_job_management

# Install dependencies
pip install -r requirements.txt

# Configure environment (create .env file)
cp .env.example .env

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver

### Frontend Setup
cd ../PartTimeJobApp

# Install dependencies
npm install

# Start Expo development server
npx expo start


