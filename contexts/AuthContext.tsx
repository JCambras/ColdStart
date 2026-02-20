'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useSession, signOut as authSignOut } from 'next-auth/react';
import { UserProfile } from '../lib/rinkTypes';
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
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const currentUser: UserProfile | null = useMemo(() => {
    if (status !== 'authenticated' || !session?.user) return null;
    const u = session.user;
    return {
      id: u.id,
      email: u.email ?? '',
      name: u.name ?? '',
      image: u.image ?? undefined,
      createdAt: '', // not exposed via session — not needed by consumers
      rinksRated: u.rinksRated ?? 0,
      tipsSubmitted: u.tipsSubmitted ?? 0,
    };
  }, [session, status]);

  const openAuth = useCallback(() => setShowAuthModal(true), []);
  const closeAuth = useCallback(() => setShowAuthModal(false), []);

  // Called after successful credential sign-in (modal stays on page)
  const login = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const logout = useCallback(() => {
    authSignOut({ redirect: false });
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
