import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCb_jCMZ2yx4po0ddGxJbrny4PGzw5RNTw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "krishi-queue-full.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "krishi-queue-full",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "krishi-queue-full.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "266215195781",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:266215195781:web:9dc4d3cf66272e704315ec",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5PDBZ7CDSS",
};

// Initialize Firebase safely (prevent multiple instances during SSR & Next.js hot-reloads)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics disabled: Prevents unused Firebase Installations API 400 key errors
const analytics = null;

export { app, auth, db, storage, analytics };
export default app;
