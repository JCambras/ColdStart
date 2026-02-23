'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, text } from '../lib/theme';

function CompassIcon({ color }: { color: string }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill={color} fillOpacity={0.15} stroke={color} />
    </svg>
  );
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UserCircleIcon({ color }: { color: string }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={10} r={3} />
      <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
    </svg>
  );
}

type IconComponent = typeof CompassIcon;

const tabs: { label: string; Icon: IconComponent; path: string; match: (p: string) => boolean; disabled?: boolean }[] = [
  { label: 'Explore', Icon: CompassIcon, path: '/', match: (p) => p === '/' },
  { label: 'Trips', Icon: MapPinIcon, path: '/trips', match: (p) => p.startsWith('/trip') },
  { label: 'Team', Icon: ShieldIcon, path: '/team', match: (p) => p.startsWith('/team') },
  { label: 'Profile', Icon: UserCircleIcon, path: '/profile', match: (p) => p.startsWith('/profile') },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, openAuth } = useAuth();

  function handleTab(tab: (typeof tabs)[number]) {
    if (tab.disabled) return;
    if (tab.path === '/profile') {
      if (!currentUser) {
        openAuth();
        return;
      }
      router.push(`/profile/${currentUser.id}`);
      return;
    }
    router.push(tab.path);
  }

  return (
    <nav className="bottom-tab-bar" aria-label="Main navigation">
      {tabs.map((tab) => {
        const active = !tab.disabled && tab.match(pathname);
        const color = tab.disabled ? colors.textDisabled : active ? colors.navy900 : colors.textMuted;
        return (
          <button
            key={tab.label}
            onClick={() => handleTab(tab)}
            aria-disabled={tab.disabled || undefined}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 0 4px',
              background: 'none',
              border: 'none',
              cursor: tab.disabled ? 'default' : 'pointer',
              color,
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: colors.amber,
                }}
              />
            )}
            <tab.Icon color={color} />
            {tab.path === '/profile' && currentUser &&
              (currentUser.rinksRated + currentUser.tipsSubmitted) > 0 && (
              <span style={{
                position: 'absolute', top: 4,
                right: '50%', transform: 'translateX(14px)',
                minWidth: 16, height: 16, borderRadius: 8,
                background: colors.brand, color: colors.textInverse,
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', lineHeight: 1,
              }}>
                {currentUser.rinksRated + currentUser.tipsSubmitted}
              </span>
            )}
            <span style={{ fontSize: text.xs, fontWeight: active ? 700 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
