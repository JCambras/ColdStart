'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { label: 'Explore', icon: '🔍', path: '/', match: (p: string) => p === '/' },
    { label: 'Trips', icon: '📋', path: '/trips', match: (p: string) => p.startsWith('/trip') },
    {
      label: 'Profile',
      icon: '👤',
      path: '#profile',
      match: () => false,
    },
  ] as const;

  function handleTab(tab: (typeof tabs)[number]) {
    if (tab.path === '#profile') {
      // If on home page, scroll to My Rinks; otherwise trigger auth or navigate home
      if (pathname === '/') {
        const el = document.getElementById('my-rinks-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      // Check if logged in
      try {
        const u = localStorage.getItem('coldstart_current_user');
        if (u) {
          // Scroll to my rinks on home
          router.push('/');
          setTimeout(() => {
            const el = document.getElementById('my-rinks-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        } else {
          // Navigate home — auth modal will be triggered from there
          router.push('/');
        }
      } catch {
        router.push('/');
      }
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
              color: active ? '#0ea5e9' : '#9ca3af',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
