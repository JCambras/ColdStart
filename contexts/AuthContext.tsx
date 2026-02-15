'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../lib/rinkTypes';
import { storage } from '../lib/storage';
import { AuthModal } from '../components/auth/AuthModal';

interface AuthContextValue {
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  showAuthModal: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  login: (profile: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const u = storage.getCurrentUser();
    if (u) setCurrentUser(u);
  }, []);

  const openAuth = useCallback(() => setShowAuthModal(true), []);
  const closeAuth = useCallback(() => setShowAuthModal(false), []);

  const login = useCallback((profile: UserProfile) => {
    setCurrentUser(profile);
    setShowAuthModal(false);
  }, []);

  const logout = useCallback(() => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoggedIn: !!currentUser,
      showAuthModal,
      openAuth,
      closeAuth,
      login,
      logout,
    }}>
      {children}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuth}
        onSuccess={login}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
