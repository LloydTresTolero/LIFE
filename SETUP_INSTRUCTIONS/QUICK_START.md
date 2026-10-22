# Quick Start Guide

## 5-Minute Setup

### Step 1: Install Node.js
- Download from [nodejs.org](https://nodejs.org/)
- Verify: `node --version`

### Step 2: Install Expo CLI
```bash
npm install -g expo-cli
```

### Step 3: Install Dependencies
```bash
cd LTT-ED-main
npm install
```

### Step 4: Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database (Test mode)
5. Copy config to `firebase.js`

### Step 5: Run the App
```bash
npm start
```

### Step 6: Test on Device
- Install Expo Go app on your phone
- Scan QR code from terminal

---

## Required VS Code Extensions

Install these in VS Code:
1. ESLint
2. Prettier
3. Expo Tools
4. React Native Tools

---

## Firebase Setup Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database created
- [ ] `firebase.js` updated with your config
- [ ] Security rules configured (optional for development)

---

## First Run Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Firebase configured
- [ ] Development server started (`npm start`)
- [ ] App opens on device/emulator
- [ ] Can create account
- [ ] Can login
- [ ] Can create emergency report
- [ ] Can view recent activities

---

## Common Commands

```bash
npm start          # Start development server
npm run android    # Run on Android
npm run ios        # Run on iOS (Mac only)
npm run web        # Run on web
npm run lint       # Run linter
```

---

## Need Help?

See `README.md` in this folder for detailed instructions.
