interface StreakBadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

export default function StreakBadge({ count, size = 'md' }: StreakBadgeProps) {
  const isActive = count > 0;
  const fontSize = size === 'sm' ? '0.75rem' : '0.875rem';
  const padding  = size === 'sm' ? '0.2rem 0.5rem' : '0.25rem 0.625rem';

  return (
    <div
      aria-label={`${count} day streak`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding,
        background: isActive ? 'rgba(249,115,22,0.12)' : 'var(--bg3)',
        border: `1px solid ${isActive ? 'rgba(249,115,22,0.3)' : 'var(--border)'}`,
        borderRadius: '99px',
        fontSize,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        color: isActive ? '#fb923c' : 'var(--text3)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          animation: isActive ? 'flameWiggle 1.4s ease-in-out infinite' : undefined,
        }}
      >
        🔥
      </span>
      <span>{count}</span>
      <style>{`
        @keyframes flameWiggle {
          0%, 100% { transform: rotate(-6deg) scale(1); }
          50%       { transform: rotate(6deg) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
