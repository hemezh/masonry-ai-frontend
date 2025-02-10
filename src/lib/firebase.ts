"use client"

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

export type AuthUser = User;

export const googleProvider = new GoogleAuthProvider();

// Helper to ensure we're on the client side
const ensureInitialized = () => {
  if (!app || !auth) {
    throw new Error('Firebase not initialized: This method should only be called from the client side');
  }
};

export const firebaseAuth = {
  // Sign in with email and password
  signInWithEmail: async (email: string, password: string) => {
    ensureInitialized();
    try {
      const userCredential = await signInWithEmailAndPassword(auth!, email, password);
      return {
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign up with email and password
  signUpWithEmail: async (email: string, password: string) => {
    ensureInitialized();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      return {
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    ensureInitialized();
    try {
      const userCredential = await signInWithPopup(auth!, googleProvider);
      return {
        user: userCredential.user,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign out
  signOut: async () => {
    ensureInitialized();
    try {
      await signOut(auth!);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Get current user
  getCurrentUser: () => {
    ensureInitialized();
    return auth!.currentUser;
  },

  // Subscribe to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    ensureInitialized();
    return onAuthStateChanged(auth!, callback);
  },
}; 