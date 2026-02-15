'use client';

import { colors } from '../../lib/theme';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, icon, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
          {icon} {title}
        </span>
        <span style={{
          fontSize: 14, color: colors.textMuted, transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'none', display: 'inline-block',
        }}>
          ▾
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
