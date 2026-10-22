
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCmLY20wHwL5YDiEJWJocXMq6JHUkrNzo",
  authDomain: "life-9fb4f.firebaseapp.com",
  projectId: "life-9fb4f",
  storageBucket: "life-9fb4f.firebasestorage.app",
  messagingSenderId: "1026529359003",
  appId: "1:1026529359003:web:dc1a788e59abb4f630423e",
};

// Initialize Firebase only once
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// Persist login sessions on the device
let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(
      ReactNativeAsyncStorage
    ),
  });
} catch (error) {
  // Reuse Auth if it has already been initialized
  const { getAuth } = require("firebase/auth");
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
