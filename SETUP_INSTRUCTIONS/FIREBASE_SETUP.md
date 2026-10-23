# Firebase Setup Guide

## Step-by-Step Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select existing project
3. Enter project name: "LIFE" (or your preferred name)
4. Disable Google Analytics (optional for development)
5. Click "Create Project"

### 2. Enable Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get Started"
3. Go to "Sign-in method" tab
4. Click on "Email/Password"
5. Enable "Email/Password" provider
6. Click "Save"

### 3. Create Firestore Database

1. Click "Firestore Database" in left sidebar
2. Click "Create Database"
3. Select "Start in test mode" (for development)
   - **Warning:** Test mode allows anyone to read/write. Change rules for production!
4. Choose a location (select closest to your users)
5. Click "Enable"

### 4. Get Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. If no web app exists:
   - Click "</>" (Web) icon
   - Register app with nickname "LIFE Web"
   - Click "Register app"
5. Copy the `firebaseConfig` object

### 5. Update firebase.js

Open `firebase.js` and replace with your configuration:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY_HERE',
  authDomain: 'YOUR_AUTH_DOMAIN_HERE',
  projectId: 'YOUR_PROJECT_ID_HERE',
  storageBucket: 'YOUR_STORAGE_BUCKET_HERE',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID_HERE',
  appId: 'YOUR_APP_ID_HERE',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 6. Set Up Security Rules (Production)

**For Development:** Test mode is fine, but understand the risks.

**For Production:** Update Firestore Rules:

1. Go to Firestore Database > Rules
2. Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /incidents/{incidentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.reportedBy;
    }
  }
}
```

3. Click "Publish"

### 7. Test Firebase Connection

1. Start your app: `npm start`
2. Try to create an account
3. Check Firebase Console > Authentication > Users (should see new user)
4. Try to create a report
5. Check Firebase Console > Firestore Database (should see `incidents` collection)

### 8. Optional: Enable Additional Features

#### Firebase Storage (for future image uploads)
1. Go to "Storage" in Firebase Console
2. Click "Get Started"
3. Start in test mode
4. Update security rules as needed

#### Firebase Cloud Messaging (for push notifications)
1. Go to "Cloud Messaging" in Firebase Console
2. Follow setup instructions
3. Install `expo-notifications` package

---

## Troubleshooting

### "Firebase: Error (auth/network-request-failed)"
- Check internet connection
- Verify Firebase config is correct
- Check if Firebase project is active

### "Permission denied" in Firestore
- Check Firestore security rules
- Ensure user is authenticated
- Verify rules allow the operation

### "Firebase App named '[DEFAULT]' already exists"
- This is usually fine, Firebase handles it
- If persistent, restart Metro bundler

---

## Security Best Practices

1. **Never commit Firebase config with real keys to public repos**
   - Use environment variables
   - Add `firebase.js` to `.gitignore` if it contains secrets
   - Use Firebase App Check for production

2. **Update Security Rules for Production**
   - Test mode allows anyone to access
   - Implement proper authentication checks
   - Add rate limiting if needed

3. **Enable Firebase App Check**
   - Helps prevent abuse
   - Go to Firebase Console > App Check
   - Follow setup instructions

---

## Next Steps

After Firebase is set up:
1. Test authentication (sign up, login)
2. Test Firestore (create, read, update, delete reports)
3. Review security rules
4. Set up production environment
