'use client';

import { colors, spacing, pad } from '../../lib/theme';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, icon, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: pad(spacing[14], spacing[16]), background: 'none', border: 'none', cursor: 'pointer',
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
        <div style={{ padding: pad(spacing[0], spacing[16], spacing[16]) }}>
          {children}
        </div>
      )}
    </div>
  );
}
