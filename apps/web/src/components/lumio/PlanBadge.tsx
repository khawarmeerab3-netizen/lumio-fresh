type Plan = 'free' | 'starter' | 'pro' | 'elite' | 'enterprise' | 'custom';

const PLAN_CONFIG: Record<Plan, { label: string; color: string; bg: string }> = {
  free:       { label: 'FREE',       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  starter:    { label: 'STARTER',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  pro:        { label: 'PRO',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  elite:      { label: 'ELITE',      color: '#a855f7', bg: 'rgba(168,85,247,0.12)'  },
  enterprise: { label: 'ENTERPRISE', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  custom:     { label: 'CUSTOM',     color: '#67e8f9', bg: 'rgba(103,232,249,0.12)' },
};

interface PlanBadgeProps {
  plan: Plan | string;
  size?: 'sm' | 'md';
}

export default function PlanBadge({ plan, size = 'sm' }: PlanBadgeProps) {
  const cfg = PLAN_CONFIG[plan as Plan] ?? PLAN_CONFIG.free;
  const fontSize = size === 'sm' ? '0.65rem' : '0.75rem';
  const padding  = size === 'sm' ? '0.15rem 0.45rem' : '0.2rem 0.55rem';

  return (
    <span
      aria-label={`Plan: ${cfg.label}`}
      style={{
        display: 'inline-block',
        padding,
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        borderRadius: '4px',
        fontSize,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        letterSpacing: '0.06em',
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}
