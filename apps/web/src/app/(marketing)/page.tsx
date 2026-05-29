'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ─── DATA ────────────────────────────────────────────────────────────────────

const NICHES = [
  { icon: '💰', label: 'Finance', color: '#fbbf24', challenges: ['Save Money', 'Invest Smart', 'Debt Free', 'Budget Mastery'] },
  { icon: '🍳', label: 'Cooking', color: '#fb923c', challenges: ['Learn Cooking', 'Meal Prep', 'Baking', 'Healthy Eating'] },
  { icon: '💪', label: 'Fitness', color: '#34d399', challenges: ['Morning Workout', 'Weight Loss', 'Muscle Building', 'Yoga'] },
  { icon: '📚', label: 'Learning', color: '#60a5fa', challenges: ['Learn a Language', 'Speed Reading', 'Memory Training'] },
  { icon: '💼', label: 'Business', color: '#a78bfa', challenges: ['Start a Business', 'Personal Branding', 'Networking'] },
  { icon: '🧠', label: 'Mental Health', color: '#f472b6', challenges: ['Stress Management', 'Mindfulness', 'Journaling'] },
  { icon: '👶', label: 'Parenting', color: '#4ade80', challenges: ['Mindful Parenting', 'Read with Kids', 'Family Bonding'] },
  { icon: '🎨', label: 'Creative', color: '#f87171', challenges: ['Learn Drawing', 'Photography', 'Music Instrument'] },
  { icon: '🌱', label: 'Eco Life', color: '#86efac', challenges: ['Zero Waste Life', 'Gardening', 'Minimalism'] },
  { icon: '⚙️', label: 'Productivity', color: '#fde047', challenges: ['Deep Work', 'Morning Routine', 'Focus Training'] },
  { icon: '🧘', label: 'Spirituality', color: '#c4b5fd', challenges: ['Meditation Practice', 'Gratitude Journal', 'Inner Peace'] },
  { icon: '🤝', label: 'Relationships', color: '#fdba74', challenges: ['Better Communication', 'Build Friendships', 'Empathy Practice'] },
];

const ALL_CHALLENGES = NICHES.flatMap((n) =>
  n.challenges.map((c) => ({ label: c, icon: n.icon, color: n.color }))
);

const FEATURES = [
  { icon: '🤖', title: 'AI Daily Tasks', desc: 'Each day gets a unique, personalized task generated specifically for your goal and day number. Never generic.' },
  { icon: '🎨', title: '8 Mood Themes', desc: 'Your entire app identity changes with your mood. Gold. Fire. Ocean. Forest. Violet. Rose. Ice. Midnight.' },
  { icon: '🌍', title: 'Niche Visual Worlds', desc: 'Finance feels like a trading floor. Cooking feels warm and inviting. Every niche has its own visual universe.' },
  { icon: '📊', title: 'AI Progress Reports', desc: 'Personalized score out of 10. Deep progress analysis. What to focus on tomorrow. Written by your coach.' },
  { icon: '💬', title: 'AI Coach Chat', desc: 'A coach who knows your exact goal, your day number, your history. 2-3 sentences. Always relevant. Never generic.' },
  { icon: '🏆', title: 'Milestone Celebrations', desc: 'Hit a milestone and your coach delivers a personal message. Not a confetti animation. An actual celebration.' },
  { icon: '🌐', title: 'Community Feed', desc: 'Challenge-specific feeds filtered by your niche. See only the people doing what you\'re doing.' },
  { icon: '🔥', title: 'Streak System', desc: 'Build your streak. Protect it with Streak Freeze. Elite users face real consequences for breaking it.' },
  { icon: '🎬', title: 'Video Reel Memory', desc: 'Photo + video diary compiled into a shareable story reel. On-device via FFmpeg. Zero server cost.' },
];

const COACHES = [
  { name: 'Sarah Chen', title: 'CFO & Wealth Strategist', niche: 'Finance', personality: 'Sharp, data-driven, no-nonsense', catchphrase: 'Your money works harder when your mind works smarter.', emoji: '👩‍💼' },
  { name: 'Marcus Williams', title: 'Serial Entrepreneur & Investor', niche: 'Finance', personality: 'Bold, motivating, risk-taker', catchphrase: 'Every dollar is a soldier. Deploy them wisely.', emoji: '👨‍💼' },
  { name: 'Aria Stone', title: 'Elite Athletic Performance Coach', niche: 'Fitness', personality: 'Intense, precise, results-obsessed', catchphrase: 'Your body keeps the score. Make it count.', emoji: '👩‍🏋️' },
  { name: 'Jordan West', title: 'Former Pro Athlete & Trainer', niche: 'Fitness', personality: 'Warm, encouraging, competitive', catchphrase: 'Champions don\'t wait for perfect conditions.', emoji: '👨‍🏋️' },
];

const MOODS = [
  { id: 'gold', emoji: '✨', name: 'Gold', label: 'Ambitious', accent: '#f59e0b', bg: '#100e0a' },
  { id: 'fire', emoji: '🔥', name: 'Fire', label: 'Intense', accent: '#f97316', bg: '#120a06' },
  { id: 'ocean', emoji: '🌊', name: 'Ocean', label: 'Focused', accent: '#0ea5e9', bg: '#050e18' },
  { id: 'forest', emoji: '🌿', name: 'Forest', label: 'Grounded', accent: '#22c55e', bg: '#060f08' },
  { id: 'violet', emoji: '🔮', name: 'Violet', label: 'Creative', accent: '#a855f7', bg: '#0d0812' },
  { id: 'rose', emoji: '🌸', name: 'Rose', label: 'Nurturing', accent: '#f43f8e', bg: '#130810' },
  { id: 'ice', emoji: '❄️', name: 'Ice', label: 'Precise', accent: '#67e8f9', bg: '#080c0f' },
  { id: 'midnight', emoji: '🌙', name: 'Midnight', label: 'Mysterious', accent: '#818cf8', bg: '#060608' },
];

const TESTIMONIALS = [
  { name: 'Fatima Al-Rashid', handle: '@fatima_finances', avatar: '👩‍💼', niche: 'Finance · Day 21', streak: 21, text: 'I\'ve tried Fabulous and Habitica. Nothing comes close. The AI coach actually knows my goal — not just "keep going." It tells me *exactly* what to do each day. Day 21, debt-free journey. 🔥' },
  { name: 'Carlos Mendez', handle: '@carlos_runs', avatar: '🏃', niche: 'Fitness · Day 47', streak: 47, text: 'The mood themes sound gimmicky but they genuinely change how I feel about opening the app. Gold mode hits differently at 5am. Also the progress report gave me an 8.5/10 today and I literally screenshot it.' },
  { name: 'Priya Nair', handle: '@priya_creates', avatar: '🎨', niche: 'Creative · Day 12', streak: 12, text: 'I started a 30-day drawing challenge 12 days ago. The daily tasks are so specific — yesterday was "draw your left hand 5 times, focusing only on the negative space." That\'s not a habit app. That\'s a coach.' },
];

const STEPS = [
  { num: '01', title: 'Pick a niche', desc: '12 life areas. 100+ specific challenges. Finance, fitness, creativity, parenting, spirituality and more.', icon: '🎯' },
  { num: '02', title: 'Choose your duration', desc: 'From 1 day to 1 year. 9 duration options. Free users get up to 7 days. Pro and Elite unlock everything.', icon: '⏱️' },
  { num: '03', title: 'Get your AI plan', desc: 'Your coach generates a personalized plan with milestones, habits, metrics, and quick wins. Instantly.', icon: '🤖' },
  { num: '04', title: 'Transform daily', desc: 'One task per day. One check-in. Build the streak. Hit the milestones. Watch yourself change.', icon: '⚡' },
];

// ─── METADATA (re-exported for Next.js) ─────────────────────────────────────
// Note: metadata must be in a server component. This file is a client component,
// so metadata is exported from layout.tsx or a parallel server component.

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 40%, #fb923c 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
}

function Orb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={{ opacity: 0.15, ...style }}
    />
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div
      style={{
        background: '#080706',
        color: '#fdfaf3',
        fontFamily: 'Syne, sans-serif',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* ── Global styles injected ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-24px) scale(1.04); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.3); }
          70% { box-shadow: 0 0 0 16px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.45s ease both; }

        .card-hover {
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(245,158,11,0.35) !important;
          box-shadow: 0 8px 40px rgba(245,158,11,0.08);
        }

        .nav-link {
          color: #a09060;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #fdfaf3; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #100e0a; }
        ::-webkit-scrollbar-thumb { background: #2a2418; border-radius: 3px; }
      `}</style>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  1. NAV                                                      ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.3s ease, border-bottom 0.3s ease, backdrop-filter 0.3s ease',
          background: scrolled ? 'rgba(8,7,6,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(42,36,24,0.8)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>☀️</span>
          <GradientText className="text-xl font-bold" style={{ fontWeight: 800, fontSize: 20 } as React.CSSProperties}>
            LUMIO
          </GradientText>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          <a href="#features" className="nav-link">Features</a>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <a href="#community" className="nav-link">Community</a>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/login"
            style={{
              color: '#a09060',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
            className="hidden md:block"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            style={{
              background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
              color: '#080706',
              padding: '9px 20px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  2. HERO                                                     ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 80px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Ambient orbs */}
        <Orb
          style={{
            width: 600,
            height: 600,
            background: '#f59e0b',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <Orb
          style={{
            width: 400,
            height: 400,
            background: '#f97316',
            top: '30%',
            right: '-10%',
            animation: 'float 10s 2s ease-in-out infinite',
          }}
        />
        <Orb
          style={{
            width: 300,
            height: 300,
            background: '#fbbf24',
            bottom: '10%',
            left: '5%',
            animation: 'float 12s 4s ease-in-out infinite',
          }}
        />

        {/* Grain texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
          {/* Eyebrow */}
          <p
            className="fade-up"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#f59e0b',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            The World&apos;s Most Advanced Challenge Platform
          </p>

          {/* Headline */}
          <h1
            className="fade-up-2"
            style={{
              fontSize: 'clamp(56px, 9vw, 96px)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              marginBottom: 28,
            }}
          >
            <GradientText>Illuminate</GradientText>
            <br />
            <span style={{ color: '#fdfaf3' }}>Your Growth</span>
          </h1>

          {/* Subtext */}
          <p
            className="fade-up-3"
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: '#a09060',
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto 40px',
              fontFamily: 'Lora, serif',
              fontStyle: 'italic',
            }}
          >
            100+ niches. AI coach that knows you. 8 mood themes.
            Everything from finance to fitness.
          </p>

          {/* CTA Buttons */}
          <div
            className="fade-up-4"
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}
          >
            <Link
              href="/register"
              style={{
                background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                color: '#080706',
                padding: '16px 36px',
                borderRadius: 16,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                animation: 'pulse-ring 2.5s infinite',
                display: 'inline-block',
              }}
            >
              Begin for Free →
            </Link>
            <button
              style={{
                background: 'transparent',
                color: '#a09060',
                padding: '16px 36px',
                borderRadius: 16,
                fontWeight: 600,
                fontSize: 16,
                border: '1px solid #2a2418',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#f59e0b';
                (e.currentTarget as HTMLButtonElement).style.color = '#fdfaf3';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2418';
                (e.currentTarget as HTMLButtonElement).style.color = '#a09060';
              }}
            >
              <span>▶</span> Watch Demo
            </button>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              justifyContent: 'center',
              flexWrap: 'wrap',
              borderTop: '1px solid #2a2418',
              borderBottom: '1px solid #2a2418',
              padding: '24px 0',
              marginBottom: 60,
            }}
          >
            {[
              { num: '100+', label: 'Niches' },
              { num: '9', label: 'Durations' },
              { num: 'AI', label: 'Coach' },
              { num: '8', label: 'Moods' },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: '0 32px',
                  borderRight: i < 3 ? '1px solid #2a2418' : 'none',
                  textAlign: 'center',
                  minWidth: 90,
                }}
              >
                <p style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{s.num}</p>
                <p style={{ fontSize: 12, color: '#504830', fontWeight: 600, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              width: 'max-content',
              animation: 'marquee 40s linear infinite',
            }}
          >
            {[...ALL_CHALLENGES, ...ALL_CHALLENGES].map((c, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: `1px solid ${c.color}30`,
                  background: `${c.color}12`,
                  color: c.color,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  3. COMPETITOR COMPARISON BANNER                             ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1200 0%, #2a1c00 100%)',
          borderTop: '1px solid #362e1e',
          borderBottom: '1px solid #362e1e',
          padding: '20px 24px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: '#a09060' }}>
          <span style={{ textDecoration: 'line-through', color: '#504830' }}>Fabulous: $100/year</span>
        </span>
        <span style={{ color: '#362e1e', fontSize: 20 }}>→</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
          Lumio Pro: $9/month
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            background: '#f59e0b',
            color: '#080706',
            padding: '4px 12px',
            borderRadius: 999,
          }}
        >
          You save 70%+
        </span>
      </div>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  4. FEATURES GRID                                            ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>
            Everything you need
          </p>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Built for people who take<br />
            <GradientText>their growth seriously</GradientText>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card-hover"
              style={{
                background: '#100e0a',
                border: '1px solid #2a2418',
                borderRadius: 20,
                padding: '28px 28px',
              }}
            >
              <span style={{ fontSize: 32, display: 'block', marginBottom: 16 }}>{f.icon}</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fdfaf3', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#a09060', lineHeight: 1.7, fontFamily: 'Lora, serif' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  5. HOW IT WORKS                                             ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section style={{ padding: '80px 24px', background: '#0a0906', borderTop: '1px solid #181510', borderBottom: '1px solid #181510' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>How it works</p>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.15 }}>
              Four steps to transformation
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, position: 'relative' }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ textAlign: 'center', position: 'relative' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    margin: '0 auto 20px',
                    boxShadow: '0 4px 24px rgba(245,158,11,0.25)',
                  }}
                >
                  {step.icon}
                </div>
                <p style={{ fontSize: 11, color: '#504830', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 8 }}>{step.num}</p>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fdfaf3' }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#a09060', lineHeight: 1.65, fontFamily: 'Lora, serif' }}>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 32,
                      right: -16,
                      fontSize: 20,
                      color: '#2a2418',
                      display: 'none',
                    }}
                    className="hidden lg:block"
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  6. NICHE SHOWCASE                                           ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>12 Life Areas</p>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.15 }}>
            One app for every part<br />
            <GradientText>of your life</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {NICHES.map((n) => (
            <div
              key={n.label}
              className="card-hover"
              style={{
                background: '#100e0a',
                border: '1px solid #2a2418',
                borderRadius: 18,
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: n.color,
                  opacity: 0.06,
                  filter: 'blur(20px)',
                }}
              />
              <div style={{ fontSize: 32, marginBottom: 12 }}>{n.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fdfaf3', marginBottom: 10 }}>{n.label}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {n.challenges.slice(0, 3).map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 11,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: `${n.color}15`,
                      color: n.color,
                      fontWeight: 600,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  7. COACHES                                                  ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section style={{ padding: '80px 24px', background: '#0a0906', borderTop: '1px solid #181510', borderBottom: '1px solid #181510' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>60 coaches across 12 niches</p>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.15 }}>
              Meet your <GradientText>AI coaches</GradientText>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {COACHES.map((coach) => (
              <div
                key={coach.name}
                className="card-hover"
                style={{
                  background: '#100e0a',
                  border: '1px solid #2a2418',
                  borderRadius: 20,
                  padding: '28px 24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1a1500,#2a2000)',
                    border: '2px solid #362e1e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    margin: '0 auto 16px',
                  }}
                >
                  {coach.emoji}
                </div>
                <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{coach.niche}</p>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fdfaf3', marginBottom: 4 }}>{coach.name}</h3>
                <p style={{ fontSize: 12, color: '#504830', marginBottom: 16 }}>{coach.title}</p>
                <p
                  style={{
                    fontSize: 13,
                    color: '#a09060',
                    fontStyle: 'italic',
                    fontFamily: 'Lora, serif',
                    lineHeight: 1.6,
                    borderTop: '1px solid #2a2418',
                    paddingTop: 16,
                  }}
                >
                  &ldquo;{coach.catchphrase}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  8. MOOD THEMES                                              ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section style={{ padding: '100px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>8 Mood Themes</p>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.15 }}>
            Your app. Your mood.<br />
            <GradientText>Your identity.</GradientText>
          </h2>
        </div>

        {/* Live preview */}
        <div
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            border: `1px solid ${activeMood.accent}30`,
            marginBottom: 32,
            background: activeMood.bg,
            padding: '32px',
            transition: 'all 0.4s ease',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: activeMood.accent,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              boxShadow: `0 0 40px ${activeMood.accent}50`,
              transition: 'all 0.4s ease',
            }}
          >
            {activeMood.emoji}
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: activeMood.accent, transition: 'color 0.4s ease' }}>
            {activeMood.name} — {activeMood.label}
          </p>
          <p style={{ fontSize: 14, color: '#a09060', marginTop: 8, fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
            This is how your app looks in {activeMood.name} mode
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setActiveMood(mood)}
              style={{
                background: mood.id === activeMood.id ? `${mood.accent}20` : '#100e0a',
                border: `1px solid ${mood.id === activeMood.id ? mood.accent : '#2a2418'}`,
                borderRadius: 16,
                padding: '16px 12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>{mood.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: mood.id === activeMood.id ? mood.accent : '#a09060' }}>{mood.name}</span>
              <span style={{ fontSize: 10, color: '#504830', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  9. PRICING (brief)                                          ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section style={{ padding: '80px 24px', background: '#0a0906', borderTop: '1px solid #181510', borderBottom: '1px solid #181510' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>Simple pricing</p>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.15 }}>
              Start free. <GradientText>Scale when ready.</GradientText>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { plan: 'Free', price: '$0', desc: 'Forever free', color: '#a09060', features: ['1 active challenge', '1–7 day durations', 'Community view', '3 mood themes'] },
              { plan: 'Pro', price: '$9', desc: '/month', color: '#f59e0b', features: ['10 active challenges', 'All durations', 'AI daily reports', 'AI coach chat', '8 mood themes', 'Streak Freeze'], highlight: true },
              { plan: 'Elite', price: '$19', desc: '/month', color: '#fbbf24', features: ['Unlimited challenges', '365-day duration', 'Unlimited AI', 'All 5 coaches', '2x points', 'SuperSonic coach'] },
            ].map((p) => (
              <div
                key={p.plan}
                className="card-hover"
                style={{
                  background: p.highlight ? 'linear-gradient(145deg,#1a1200,#261800)' : '#100e0a',
                  border: `1px solid ${p.highlight ? '#362e1e' : '#2a2418'}`,
                  borderRadius: 24,
                  padding: '32px 28px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {p.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                      color: '#080706',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 999,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <p style={{ fontSize: 13, fontWeight: 700, color: p.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{p.plan}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#fdfaf3', lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: '#504830' }}>{p.desc}</span>
                </div>
                <div style={{ borderTop: '1px solid #2a2418', marginTop: 24, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a09060' }}>
                      <span style={{ color: p.color, fontSize: 14 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link
              href="/pricing"
              style={{
                fontSize: 14,
                color: '#f59e0b',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '1px solid #362e1e',
                paddingBottom: 2,
              }}
            >
              View full pricing & feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  10. TESTIMONIALS                                            ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section id="community" style={{ padding: '100px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>Community stories</p>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.15 }}>
            Real people. <GradientText>Real transformation.</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="card-hover"
              style={{
                background: '#100e0a',
                border: '1px solid #2a2418',
                borderRadius: 20,
                padding: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#181510',
                    border: '1px solid #2a2418',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fdfaf3' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: '#504830' }}>{t.handle}</p>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(245,158,11,0.12)',
                    color: '#f59e0b',
                    padding: '3px 10px',
                    borderRadius: 999,
                  }}
                >
                  🔥 {t.streak}
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#504830', marginBottom: 14 }}>{t.niche}</p>
              <p style={{ fontSize: 14, color: '#a09060', lineHeight: 1.7, fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  11. FINAL CTA                                               ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <section
        style={{
          padding: '120px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: '#0a0906',
          borderTop: '1px solid #181510',
        }}
      >
        <Orb style={{ width: 500, height: 500, background: '#f59e0b', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 24 }}>
            Your journey starts now
          </p>
          <h2 style={{ fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 32, letterSpacing: '-0.02em' }}>
            Start illuminating<br />
            <GradientText>your growth today</GradientText>
          </h2>
          <p style={{ fontSize: 16, color: '#a09060', marginBottom: 48, fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
            Free forever. No credit card required.
          </p>
          <Link
            href="/register"
            style={{
              background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
              color: '#080706',
              padding: '20px 56px',
              borderRadius: 20,
              fontWeight: 800,
              fontSize: 18,
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 4px 40px rgba(245,158,11,0.35)',
            }}
          >
            Begin Free →
          </Link>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════════════════════════╗
          ║  12. FOOTER                                                  ║
          ╚══════════════════════════════════════════════════════════════╝ */}
      <footer
        style={{
          borderTop: '1px solid #181510',
          padding: '56px 24px 40px',
          background: '#080706',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 48, marginBottom: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>☀️</span>
                <GradientText style={{ fontWeight: 800, fontSize: 18 } as React.CSSProperties}>LUMIO</GradientText>
              </div>
              <p style={{ fontSize: 13, color: '#504830', lineHeight: 1.7, maxWidth: 200, fontFamily: 'Lora, serif', fontStyle: 'italic' }}>
                Illuminate Your Growth
              </p>
            </div>
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Community', 'Coaches', 'Roadmap'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Security'] },
            ].map((col) => (
              <div key={col.heading}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#504830', marginBottom: 16 }}>{col.heading}</p>
                {col.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    style={{ display: 'block', fontSize: 13, color: '#a09060', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = '#fdfaf3')}
                    onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = '#a09060')}
                  >
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #181510', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ fontSize: 12, color: '#504830' }}>© 2025 Lumio. All rights reserved.</p>
            <p style={{ fontSize: 12, color: '#362e1e' }}>Built with ☀️ for growth-obsessed humans everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
