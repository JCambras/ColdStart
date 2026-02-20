'use client';

import { Logo } from './Logo';
import { BackButton } from './BackButton';
import { colors, nav as navTokens } from '../lib/theme';

interface PageShellProps {
  children: React.ReactNode;
  /** Show back button. String = href, true = router.back() */
  back?: boolean | string;
  /** Custom label for back button */
  backLabel?: string;
  /** Logo size override (default 36) */
  logoSize?: number;
  /** Stack logo text vertically (coldstart / hockey) */
  logoStacked?: boolean;
  /** Content rendered in the right side of nav */
  navRight?: React.ReactNode;
  /** Content rendered between logo and right slot */
  navCenter?: React.ReactNode;
  /** Content rendered below the nav (e.g., sticky tab bar) */
  navBelow?: React.ReactNode;
}

export function PageShell({
  children,
  back,
  backLabel,
  logoSize = 36,
  logoStacked = false,
  navRight,
  navCenter,
  navBelow,
}: PageShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bgPage }}>
      <a href="#main-content" style={{
        position: 'absolute', left: '-9999px', top: 'auto',
        width: '1px', height: '1px', overflow: 'hidden',
      }} onFocus={(e) => { Object.assign(e.currentTarget.style, { position: 'fixed', left: '16px', top: '16px', width: 'auto', height: 'auto', overflow: 'visible', zIndex: 9999, padding: '8px 16px', background: colors.brand, color: colors.white, borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }); }} onBlur={(e) => { Object.assign(e.currentTarget.style, { position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }); }}>
        Skip to content
      </a>
      <nav aria-label="Main navigation" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: navRight ? 'space-between' : undefined,
        gap: 12,
        padding: '14px 24px',
        background: navTokens.bg,
        backdropFilter: navTokens.blur,
        WebkitBackdropFilter: navTokens.blur,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {back && (
            <BackButton
              href={typeof back === 'string' ? back : undefined}
              label={backLabel}
            />
          )}
          <Logo size={logoSize} stacked={logoStacked} />
        </div>
        {navCenter}
        {navRight && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{navRight}</div>}
      </nav>
      {navBelow}
      <main id="main-content">{children}</main>
    </div>
  );
}
