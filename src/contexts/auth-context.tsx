'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuth, AuthUser } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { cookies } from 'next/headers';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Set the token cookie when user is authenticated
        document.cookie = `token=${await user.getIdToken()};path=/;`;
      } else {
        // Remove the token cookie when user is not authenticated
        document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await firebaseAuth.signInWithEmail(email, password);
      setUser(user);
      const token = await user.getIdToken();
      document.cookie = `token=${token};path=/;`;
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { user } = await firebaseAuth.signUpWithEmail(email, password);
      setUser(user);
      const token = await user.getIdToken();
      document.cookie = `token=${token};path=/;`;
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { user } = await firebaseAuth.signInWithGoogle();
      setUser(user);
      const token = await user.getIdToken();
      document.cookie = `token=${token};path=/;`;
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuth.signOut();
      setUser(null);
      document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/auth');
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 