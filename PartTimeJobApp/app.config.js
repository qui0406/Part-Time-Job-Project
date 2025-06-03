import 'dotenv/config';
import process from 'process';

export default {
  expo: {
    name: 'PartTimeJobApp',
    slug: 'PartTimeJobApp',
    scheme: "parttimejobapp",
    version: '1.0.0',
    orientation: 'portrait',
    icon: 'assets/icon.png',
    userInterfaceStyle: 'light',
    entryPoint: './App.js',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.qui0406.parttimejobapp',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.qui0406.parttimejobapp',
    },
    web: {
      favicon: 'assets/favicon.png',
    },
    owner: "qui0406",
    newArchEnabled: true,
    extra: {
      apiKey: process.env.EXPO_PUBLIC_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID,
      eas: {
        projectId: "c80771f7-5ddb-49ab-b853-4a0d2ff29185",
      },
    },
    plugins: [
      [
        "react-native-fbsdk-next",
        {
          "appID": "1944143086387650",
          "clientToken": "b404eb6de657d3c0045d76abf439e4ef",
          "displayName": "PartTimeJobApp",
          "scheme": "fb1944143086387650"
        }
      ]
    ]
  },
};