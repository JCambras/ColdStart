'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, text } from '../lib/theme';

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, openAuth } = useAuth();

  const tabs = [
    { label: 'Explore', icon: '🔍', path: '/', match: (p: string) => p === '/' },
    { label: 'Trips', icon: '📋', path: '/trips', match: (p: string) => p.startsWith('/trip') },
    { label: 'Team', icon: '🛡️', path: '/team', match: (p: string) => p.startsWith('/team') },
    {
      label: 'Profile',
      icon: '👤',
      path: '#profile',
      match: () => false,
    },
  ] as const;

  function handleTab(tab: (typeof tabs)[number]) {
    if (tab.path === '#profile') {
      if (!currentUser) {
        openAuth();
        return;
      }
      if (pathname === '/') {
        const el = document.getElementById('my-rinks-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      router.push('/');
      setTimeout(() => {
        const el = document.getElementById('my-rinks-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
      return;
    }
    router.push(tab.path);
  }

  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <button
            key={tab.label}
            onClick={() => handleTab(tab)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 0 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? colors.brand : colors.textMuted,
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: text['2xs'], fontWeight: active ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
