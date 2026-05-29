interface LoadingPulseProps {
  label?: string;
  size?: number;   // dot size px, default 8
  color?: string;
}

export default function LoadingPulse({
  label,
  size = 8,
  color = 'var(--accent)',
}: LoadingPulseProps) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
      <div style={{ display: 'flex', gap: size * 0.75 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: color,
              display: 'inline-block',
              animation: `lpBounce 1s ${i * 0.18}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      {label && (
        <span style={{
          fontSize: '0.8rem',
          color: 'var(--text2)',
          fontStyle: 'italic',
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </span>
      )}
      <style>{`
        @keyframes lpBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-${size}px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
