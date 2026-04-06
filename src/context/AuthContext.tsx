import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ==================== TYPES ====================
export type UserRole = 'kitchen' | 'courier' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  authLoading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ==================== CONTEXT ====================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== ROLE DETECTION ====================
const detectRole = (email: string): UserRole => {
  if (email === 'trajabboyev@gmail.com') return 'courier';
  if (email === 'afsonakr@gmail.com') return 'courier';
  return 'user';
};

// ==================== PROVIDER ====================
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Check session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const email = session.user.email || '';
          const userRole = detectRole(email);
          const authUser: AuthUser = {
            id: session.user.id,
            email: email,
            role: userRole,
          };
          setUser(authUser);
          setRole(userRole);
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email || '';
        const userRole = detectRole(email);
        const authUser: AuthUser = {
          id: session.user.id,
          email: email,
          role: userRole,
        };
        setUser(authUser);
        setRole(userRole);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      setError('Email va parolni kiriting');
      return;
    }

    setAuthLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        setError('Email yoki parol noto\'g\'ri');
        return;
      }

      if (data.user) {
        const userEmail = data.user.email || '';
        const userRole = detectRole(userEmail);
        const authUser: AuthUser = {
          id: data.user.id,
          email: userEmail,
          role: userRole,
        };
        setUser(authUser);
        setRole(userRole);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Kirishda xatolik yuz berdi');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Chiqishda xatolik yuz berdi');
    } finally {
      setAuthLoading(false);
    }
  };

  const clearError = () => setError('');

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        authLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==================== HOOK ====================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
