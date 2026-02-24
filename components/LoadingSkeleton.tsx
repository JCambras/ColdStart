import { colors, radius, spacing, pad } from '../lib/theme';

type Variant = 'page' | 'card' | 'list';

const bar = (w: string, h = 14): React.CSSProperties => ({
  height: h, width: w, background: colors.borderLight, borderRadius: radius.sm,
});

function SkeletonPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: pad(spacing[32], spacing[24]) }}>
      {/* Header */}
      <div style={{ ...bar('60%', 28), marginBottom: spacing[10] }} />
      <div style={{ ...bar('40%'), marginBottom: spacing[24] }} />
      {/* Verdict card */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16,
        padding: spacing[24], marginBottom: spacing[16],
      }}>
        <div style={{ ...bar('50%', 18), marginBottom: spacing[10] }} />
        <div style={{ ...bar('70%', 12) }} />
      </div>
      {/* Signal bars */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16,
        padding: pad(spacing[16], spacing[24]),
      }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: spacing[12],
            padding: pad(spacing[12], spacing[0]),
            borderTop: i > 0 ? `1px solid ${colors.borderLight}` : 'none',
          }}>
            <div style={{ ...bar('52px'), flexShrink: 0 }} />
            <div style={{ flex: 1, height: 6, background: colors.borderLight, borderRadius: 3 }} />
            <div style={{ ...bar('28px', 12), flexShrink: 0 }} />
          </div>
        ))}
      </div>
      {/* Tip cards */}
      <div style={{ marginTop: spacing[24], display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            background: colors.surface, border: `1px solid ${colors.borderLight}`,
            borderRadius: radius.lg, padding: pad(spacing[12], spacing[14]),
          }}>
            <div style={{ ...bar('85%', 12), marginBottom: spacing[6] }} />
            <div style={{ ...bar('50%', 10) }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16,
      display: 'flex', minHeight: 200, overflow: 'hidden',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ flex: 1, padding: spacing[24] }}>
        <div style={{ ...bar('70%', 22), marginBottom: spacing[8] }} />
        <div style={{ ...bar('40%'), marginBottom: spacing[20] }} />
        <div style={{ ...bar('55%'), marginBottom: spacing[14] }} />
        <div style={{ display: 'flex', gap: spacing[6] }}>
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} style={{ ...bar('48px', 24) }} />
          ))}
        </div>
      </div>
      <div style={{ width: 180, background: colors.bgSubtle, borderLeft: `1px solid ${colors.borderLight}` }} />
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[10], marginTop: spacing[20] }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: pad(spacing[14], spacing[18]), background: colors.surface, border: `1px solid ${colors.borderDefault}`,
          borderRadius: radius.xl, animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div>
            <div style={{ ...bar('160px', 16), marginBottom: spacing[6] }} />
            <div style={{ ...bar('80px', 12) }} />
          </div>
          <div style={{ display: 'flex', gap: spacing[6] }}>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} style={{ ...bar('40px', 20) }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingSkeleton({ variant = 'page' }: { variant?: Variant }) {
  return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      {variant === 'page' && <SkeletonPage />}
      {variant === 'card' && <SkeletonCard />}
      {variant === 'list' && <SkeletonList />}
    </div>
  );
}
