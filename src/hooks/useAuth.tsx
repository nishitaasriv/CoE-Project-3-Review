import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthSession, User } from '../types/auth';
import { authService } from '../lib/auth/authService';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLocked: boolean;
  unlockApp: (passwordOrPin: string) => Promise<boolean>;
  lockApp: () => void;
  login: (email: string, pass: string, rememberMe: boolean) => Promise<void>;
  register: (name: string, email: string, pass: string, migrateGuest?: boolean) => Promise<void>;
  loginGuest: () => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getCurrentSession());
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const user = session ? session.user : null;
  const isAuthenticated = !!user;
  const isGuest = !!user?.isGuest;

  // Sync state if session expires or changes
  const refreshUser = () => {
    const current = authService.getCurrentSession();
    setSession(current);
  };

  const login = async (email: string, pass: string, rememberMe: boolean) => {
    const res = await authService.login(email, pass, rememberMe);
    setSession(res.session);
    setIsLocked(false);
  };

  const register = async (name: string, email: string, pass: string, migrateGuest = false) => {
    const res = await authService.register(name, email, pass, migrateGuest);
    setSession(res.session);
    setIsLocked(false);
  };

  const loginGuest = () => {
    const res = authService.loginGuest();
    setSession(res.session);
    setIsLocked(false);
  };

  const logout = () => {
    authService.logout();
    setSession(null);
    setIsLocked(false);
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockApp = async (passwordOrPin: string): Promise<boolean> => {
    if (!user) return false;
    // Check if user is guest
    if (user.isGuest) {
      setIsLocked(false);
      return true;
    }
    // Verify password for regular account
    try {
      await authService.login(user.email, passwordOrPin, session?.rememberMe ?? true);
      setIsLocked(false);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isGuest,
        isLocked,
        unlockApp,
        lockApp,
        login,
        register,
        loginGuest,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
