/**
 * apps/web/src/lib/niche-theme.ts
 *
 * getNicheTheme(nicheId) → full visual palette for challenge screens,
 * progress rings, badge backgrounds, milestone nodes, and card tints.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NicheTheme {
  /** Primary brand colour for this niche */
  primaryColor: string;
  /** Secondary / highlight colour */
  accentColor: string;
  /** Full CSS gradient string (background shorthand) */
  gradientCss: string;
  /** Very subtle tint for card/panel backgrounds  rgba(...) */
  bgTint: string;
  /** Border colour derived from primary */
  borderColor: string;
  /** Soft glow colour for box-shadow usage */
  glowColor: string;
  /** Emoji icon */
  icon: string;
  /** Human label */
  label: string;
  /** Tailwind-compatible hex for text rendering */
  textColor: string;
}

// ─── Niche palette map ────────────────────────────────────────────────────────

const NICHE_THEMES: Record<string, NicheTheme> = {
  finance: {
    primaryColor: '#fbbf24',
    accentColor:  '#ffd700',
    gradientCss:  'linear-gradient(135deg, #0d1b2a 0%, #1a2e44 50%, #0d1b2a 100%)',
    bgTint:       'rgba(251,191,36,0.07)',
    borderColor:  'rgba(251,191,36,0.22)',
    glowColor:    'rgba(251,191,36,0.35)',
    icon: '💰', label: 'Finance',
    textColor: '#fbbf24',
  },
  cooking: {
    primaryColor: '#fb923c',
    accentColor:  '#ff6b35',
    gradientCss:  'linear-gradient(135deg, #1a0e08 0%, #2d1810 50%, #1a0e08 100%)',
    bgTint:       'rgba(251,146,60,0.08)',
    borderColor:  'rgba(251,146,60,0.22)',
    glowColor:    'rgba(251,146,60,0.35)',
    icon: '🍳', label: 'Cooking',
    textColor: '#fb923c',
  },
  fitness: {
    primaryColor: '#34d399',
    accentColor:  '#00d4ff',
    gradientCss:  'linear-gradient(135deg, #020a08 0%, #041812 50%, #020a08 100%)',
    bgTint:       'rgba(52,211,153,0.07)',
    borderColor:  'rgba(52,211,153,0.22)',
    glowColor:    'rgba(52,211,153,0.35)',
    icon: '💪', label: 'Fitness',
    textColor: '#34d399',
  },
  learning: {
    primaryColor: '#60a5fa',
    accentColor:  '#93c5fd',
    gradientCss:  'linear-gradient(135deg, #050e1a 0%, #0a1c30 50%, #050e1a 100%)',
    bgTint:       'rgba(96,165,250,0.07)',
    borderColor:  'rgba(96,165,250,0.22)',
    glowColor:    'rgba(96,165,250,0.35)',
    icon: '📚', label: 'Learning',
    textColor: '#60a5fa',
  },
  business: {
    primaryColor: '#a78bfa',
    accentColor:  '#cc0000',
    gradientCss:  'linear-gradient(135deg, #0d0814 0%, #1a1028 50%, #0d0814 100%)',
    bgTint:       'rgba(167,139,250,0.07)',
    borderColor:  'rgba(167,139,250,0.22)',
    glowColor:    'rgba(167,139,250,0.35)',
    icon: '💼', label: 'Business',
    textColor: '#a78bfa',
  },
  'mental health': {
    primaryColor: '#f472b6',
    accentColor:  '#ffb5c8',
    gradientCss:  'linear-gradient(135deg, #0f060c 0%, #1e0c18 50%, #0f060c 100%)',
    bgTint:       'rgba(244,114,182,0.07)',
    borderColor:  'rgba(244,114,182,0.22)',
    glowColor:    'rgba(244,114,182,0.35)',
    icon: '🧠', label: 'Mental Health',
    textColor: '#f472b6',
  },
  parenting: {
    primaryColor: '#4ade80',
    accentColor:  '#ffe066',
    gradientCss:  'linear-gradient(135deg, #04100a 0%, #091e10 50%, #04100a 100%)',
    bgTint:       'rgba(74,222,128,0.07)',
    borderColor:  'rgba(74,222,128,0.22)',
    glowColor:    'rgba(74,222,128,0.35)',
    icon: '👶', label: 'Parenting',
    textColor: '#4ade80',
  },
  creative: {
    primaryColor: '#f87171',
    accentColor:  '#fb7bb8',
    gradientCss:  'linear-gradient(135deg, #100407 0%, #200810 50%, #100407 100%)',
    bgTint:       'rgba(248,113,113,0.07)',
    borderColor:  'rgba(248,113,113,0.22)',
    glowColor:    'rgba(248,113,113,0.35)',
    icon: '🎨', label: 'Creative',
    textColor: '#f87171',
  },
  'eco life': {
    primaryColor: '#86efac',
    accentColor:  '#228b22',
    gradientCss:  'linear-gradient(135deg, #031008 0%, #051e0e 50%, #031008 100%)',
    bgTint:       'rgba(134,239,172,0.07)',
    borderColor:  'rgba(134,239,172,0.22)',
    glowColor:    'rgba(134,239,172,0.35)',
    icon: '🌱', label: 'Eco Life',
    textColor: '#86efac',
  },
  productivity: {
    primaryColor: '#fde047',
    accentColor:  '#facc15',
    gradientCss:  'linear-gradient(135deg, #0e0e08 0%, #1c1c10 50%, #0e0e08 100%)',
    bgTint:       'rgba(253,224,71,0.07)',
    borderColor:  'rgba(253,224,71,0.22)',
    glowColor:    'rgba(253,224,71,0.35)',
    icon: '⚙️', label: 'Productivity',
    textColor: '#fde047',
  },
  spirituality: {
    primaryColor: '#c4b5fd',
    accentColor:  '#ffe5a0',
    gradientCss:  'linear-gradient(135deg, #09060f 0%, #140c20 50%, #09060f 100%)',
    bgTint:       'rgba(196,181,253,0.07)',
    borderColor:  'rgba(196,181,253,0.22)',
    glowColor:    'rgba(196,181,253,0.35)',
    icon: '🧘', label: 'Spirituality',
    textColor: '#c4b5fd',
  },
  relationships: {
    primaryColor: '#fdba74',
    accentColor:  '#ff6b8a',
    gradientCss:  'linear-gradient(135deg, #100808 0%, #201010 50%, #100808 100%)',
    bgTint:       'rgba(253,186,116,0.07)',
    borderColor:  'rgba(253,186,116,0.22)',
    glowColor:    'rgba(253,186,116,0.35)',
    icon: '🤝', label: 'Relationships',
    textColor: '#fdba74',
  },
};

/** Fallback for unknown niche IDs */
const DEFAULT_THEME: NicheTheme = {
  primaryColor: '#f59e0b',
  accentColor:  '#fbbf24',
  gradientCss:  'linear-gradient(135deg, #080706 0%, #181510 100%)',
  bgTint:       'rgba(245,158,11,0.07)',
  borderColor:  'rgba(245,158,11,0.22)',
  glowColor:    'rgba(245,158,11,0.35)',
  icon: '⭐', label: 'Challenge',
  textColor: '#f59e0b',
};

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * Returns the complete NicheTheme for any niche identifier.
 * Matching is case-insensitive and tolerates spaces vs underscores.
 *
 * @example
 *   getNicheTheme('fitness')       // → { primaryColor: '#34d399', ... }
 *   getNicheTheme('mental_health') // → { primaryColor: '#f472b6', ... }
 *   getNicheTheme('COOKING')       // → { primaryColor: '#fb923c', ... }
 */
export function getNicheTheme(nicheId: string): NicheTheme {
  if (!nicheId) return DEFAULT_THEME;
  // Normalise: lowercase + replace underscores/hyphens with spaces
  const key = nicheId.toLowerCase().replace(/[_-]/g, ' ').trim();
  return NICHE_THEMES[key] ?? DEFAULT_THEME;
}

/**
 * Convenience: generate inline style object for a niche-tinted card.
 */
export function nicheCardStyle(nicheId: string): React.CSSProperties {
  const t = getNicheTheme(nicheId);
  return {
    background: t.bgTint,
    borderColor: t.borderColor,
    boxShadow: `0 0 0 1px ${t.borderColor}`,
  };
}

/**
 * Convenience: generate box-shadow glow for progress rings / milestone nodes.
 */
export function nicheGlowStyle(nicheId: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const t = getNicheTheme(nicheId);
  const spread = size === 'sm' ? '8px' : size === 'md' ? '14px' : '24px';
  return `0 0 ${spread} ${t.glowColor}`;
}

/**
 * All defined niche theme entries — useful for rendering niche selectors.
 */
export const ALL_NICHE_THEMES: Array<{ id: string } & NicheTheme> = Object.entries(
  NICHE_THEMES
).map(([id, theme]) => ({ id, ...theme }));
