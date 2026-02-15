type Variant = 'page' | 'card' | 'list';

const bar = (w: string, h = 14): React.CSSProperties => ({
  height: h, width: w, background: '#f1f5f9', borderRadius: 6,
});

function SkeletonPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ ...bar('60%', 28), marginBottom: 10 }} />
      <div style={{ ...bar('40%'), marginBottom: 24 }} />
      {/* Verdict card */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
        padding: 24, marginBottom: 16,
      }}>
        <div style={{ ...bar('50%', 18), marginBottom: 10 }} />
        <div style={{ ...bar('70%', 12) }} />
      </div>
      {/* Signal bars */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
        padding: '16px 24px',
      }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0',
            borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
          }}>
            <div style={{ ...bar('52px'), flexShrink: 0 }} />
            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3 }} />
            <div style={{ ...bar('28px', 12), flexShrink: 0 }} />
          </div>
        ))}
      </div>
      {/* Tip cards */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #f1f5f9',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ ...bar('85%', 12), marginBottom: 6 }} />
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
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
      display: 'flex', minHeight: 200, overflow: 'hidden',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ ...bar('70%', 22), marginBottom: 8 }} />
        <div style={{ ...bar('40%'), marginBottom: 20 }} />
        <div style={{ ...bar('55%'), marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} style={{ ...bar('48px', 24) }} />
          ))}
        </div>
      </div>
      <div style={{ width: 180, background: '#f8fafc', borderLeft: '1px solid #f1f5f9' }} />
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div>
            <div style={{ ...bar('160px', 16), marginBottom: 6 }} />
            <div style={{ ...bar('80px', 12) }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
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
