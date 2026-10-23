# LIFE - Setup Instructions

This folder contains all the setup instructions and requirements for the LIFE Emergency Response Application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Tools to Install](#tools-to-install)
4. [Extensions & IDE Setup](#extensions--ide-setup)
5. [Installation Steps](#installation-steps)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [Known Issues & Missing Features](#known-issues--missing-features)

---

## Prerequisites

Before setting up the project, ensure you have:
- Node.js (v18 or higher) installed
- npm or yarn package manager
- Git installed
- A code editor (VS Code recommended)
- Android Studio (for Android development) or Xcode (for iOS development on Mac)
- Expo CLI installed globally

---

## Database Setup

### Firebase Configuration

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project" or select an existing project
   - Follow the setup wizard

2. **Enable Authentication**
   - In Firebase Console, go to "Authentication"
   - Click "Get Started"
   - Enable "Email/Password" authentication method

3. **Create Firestore Database**
   - Go to "Firestore Database" in Firebase Console
   - Click "Create Database"
   - Start in "Test mode" (for development)
   - Choose a location for your database

4. **Update Firebase Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - If you don't have a web app, click "Add app" and select Web (</>)
   - Copy your Firebase configuration
   - Update `firebase.js` file with your configuration:
     ```javascript
     const firebaseConfig = {
       apiKey: 'YOUR_API_KEY',
       authDomain: 'YOUR_AUTH_DOMAIN',
       projectId: 'YOUR_PROJECT_ID',
       storageBucket: 'YOUR_STORAGE_BUCKET',
       messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
       appId: 'YOUR_APP_ID',
     };
     ```

5. **Set Up Firestore Security Rules** (for production)
   - Go to Firestore Database > Rules
   - Update rules to secure your data:
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

6. **Create Required Collections**
   - The app will automatically create the `incidents` collection when you create your first report
   - No manual collection creation needed

---

## Tools to Install

### Required Tools

1. **Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Recommended version: v18.x or higher
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```
   - Verify installation: `expo --version`

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### Optional but Recommended

1. **Android Studio** (for Android development)
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Install Android SDK and emulator

2. **Xcode** (for iOS development - Mac only)
   - Download from Mac App Store
   - Requires macOS

3. **Expo Go App** (for testing on physical devices)
   - Install on your phone:
     - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
     - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Extensions & IDE Setup

### VS Code Extensions (Recommended)

1. **ES7+ React/Redux/React-Native snippets**
   - Extension ID: `dsznajder.es7-react-js-snippets`

2. **ESLint**
   - Extension ID: `dbaeumer.vscode-eslint`

3. **Prettier - Code formatter**
   - Extension ID: `esbenp.prettier-vscode`

4. **React Native Tools**
   - Extension ID: `msjsdiag.vscode-react-native`

5. **Expo Tools**
   - Extension ID: `expo.vscode-expo-tools`

6. **GitLens**
   - Extension ID: `eamodio.gitlens`

### VS Code Settings

Add to your `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/.expo": true,
    "**/node_modules": true
  }
}
```

---

## Installation Steps

1. **Navigate to Project Directory**
   ```bash
   cd LTT-ED-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Configure Firebase**
   - Update `firebase.js` with your Firebase configuration (see Database Setup section)

4. **Start the Development Server**
   ```bash
   npm start
   ```
   or
   ```bash
   expo start
   ```

5. **Run on Device/Emulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (Mac only)
   - Scan QR code with Expo Go app for physical device

---

## Configuration

### Environment Variables

Currently, Firebase configuration is hardcoded in `firebase.js`. For production, consider using environment variables:

1. Install `expo-constants` (already included)
2. Create `.env` file (add to `.gitignore`)
3. Use `expo-constants` to access environment variables

### App Configuration

- App name: Edit `app.json` > `name` field
- App icon: Replace files in `assets/images/`
- Color scheme: Update colors in component files (search for `#DC143C`)

---

## Running the Application

### Development Mode

```bash
npm start
```

### Android

```bash
npm run android
```

### iOS (Mac only)

```bash
npm run ios
```

### Web

```bash
npm run web
```

---

## Known Issues & Missing Features

### Currently Not Implemented

1. **Map Integration**
   - Map view in rescue tracking screen is a placeholder
   - Real-time location tracking not implemented
   - To implement: Install `react-native-maps` or `expo-maps`

2. **Push Notifications**
   - Notification system not implemented
   - To implement: Use `expo-notifications`

3. **Image Upload**
   - Emergency reports cannot include images
   - To implement: Use Firebase Storage with `expo-image-picker`

4. **Offline Support**
   - App requires internet connection
   - To implement: Use Firestore offline persistence

5. **User Profile Management**
   - Limited profile customization
   - Settings page is placeholder

6. **Advanced Filtering**
   - Basic filtering by type only
   - No date range, location-based filtering

7. **Real-time Updates**
   - Incidents refresh every 30 seconds
   - No real-time listeners implemented
   - To implement: Use Firestore `onSnapshot`

### Backend Limitations

- No backend API for complex operations
- All logic handled client-side
- No server-side validation
- No automated emergency response system

### UI/UX Improvements Needed

- Loading states for all async operations
- Better error handling and user feedback
- Accessibility improvements
- Dark mode support (partially implemented)
- Responsive design for tablets

---

## Troubleshooting

### Common Issues

1. **Metro bundler errors**
   - Clear cache: `expo start -c`
   - Delete `node_modules` and reinstall

2. **Firebase connection errors**
   - Verify Firebase configuration
   - Check internet connection
   - Verify Firestore rules allow access

3. **Location permission errors**
   - Ensure location permissions are granted
   - Check device settings

4. **Build errors**
   - Clear Expo cache: `expo start -c`
   - Reset Metro bundler: `npm start -- --reset-cache`

---

## Next Steps

1. Set up Firebase project and configure `firebase.js`
2. Install all required tools and extensions
3. Run `npm install` to install dependencies
4. Start development server with `npm start`
5. Test the application on a device or emulator
6. Review and implement missing features as needed

---

## Support

For issues or questions:
- Check Firebase documentation: [firebase.google.com/docs](https://firebase.google.com/docs)
- Check Expo documentation: [docs.expo.dev](https://docs.expo.dev)
- Review React Native documentation: [reactnative.dev](https://reactnative.dev)

---

**Last Updated:** January 2026
**Version:** 1.0.0
