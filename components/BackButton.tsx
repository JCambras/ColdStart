'use client';

import { useRouter } from 'next/navigation';
import { colors, text, radius } from '../lib/theme';

interface BackButtonProps {
  /** Where to navigate. If omitted, uses router.back() */
  href?: string;
  /** Button text. Defaults to "← Back" */
  label?: string;
}

export function BackButton({ href, label = '← Back' }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      style={{
        fontSize: text.md,
        fontWeight: 500,
        color: colors.textSecondary,
        background: colors.surface,
        border: `1px solid ${colors.borderDefault}`,
        borderRadius: radius.md,
        padding: '10px 14px',
        minHeight: 44,
        minWidth: 44,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
