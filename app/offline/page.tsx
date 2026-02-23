export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏒</div>
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--colors-textPrimary)',
        margin: '0 0 8px',
      }}>
        You&apos;re offline
      </h1>
      <p style={{
        fontSize: 15,
        color: 'var(--colors-textMuted)',
        maxWidth: 320,
        lineHeight: 1.5,
        margin: '0 0 24px',
      }}>
        ColdStart needs an internet connection to load rink data. Check your connection and try again.
      </p>
      <a
        href="/"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--colors-brand)',
          textDecoration: 'none',
          padding: '10px 24px',
          border: '1px solid var(--colors-brandLight)',
          borderRadius: 10,
        }}
      >
        Retry
      </a>
    </div>
  );
}
