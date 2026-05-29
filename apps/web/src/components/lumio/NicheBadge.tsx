interface NicheBadgeProps {
  icon: string;     // emoji or text icon
  label: string;
  color?: string;   // accent color, falls back to var(--accent)
  size?: 'sm' | 'md';
}

export default function NicheBadge({ icon, label, color, size = 'md' }: NicheBadgeProps) {
  const fontSize  = size === 'sm' ? '0.75rem' : '0.8125rem';
  const padding   = size === 'sm' ? '0.2rem 0.5rem' : '0.25rem 0.625rem';
  const iconSize  = size === 'sm' ? '0.875rem' : '1rem';
  const bg        = color ? `${color}18` : 'var(--soft)';
  const border    = color ? `${color}35` : 'var(--border2)';
  const textColor = color ?? 'var(--accent)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '99px',
        fontSize,
        fontWeight: 600,
        color: textColor,
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-display)',
      }}
    >
      <span style={{ fontSize: iconSize }}>{icon}</span>
      {label}
    </span>
  );
}
