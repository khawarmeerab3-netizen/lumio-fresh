'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayEntry {
  date: string;       // YYYY-MM-DD
  niche_id?: string;
  completed: boolean;
}

interface StreakPoint {
  week: string;       // YYYY-WW label
  maxStreak: number;
}

interface PointsEntry {
  date: string;       // YYYY-MM-DD
  points: number;
}

interface NicheBreakdown {
  niche_id: string;
  label: string;
  emoji: string;
  days: number;
  color: string;
}

interface ChallengeStats {
  total: number;
  completed: number;
  abandoned: number;
  completionRate: number;
}

interface AnalyticsData {
  completionDays: DayEntry[];
  streakHistory: StreakPoint[];
  pointsHistory: PointsEntry[];
  nicheBreakdown: NicheBreakdown[];
  challengeStats: ChallengeStats;
}

// ─── GitHub-style Heatmap ────────────────────────────────────────────────────

const WEEKS = 52;
const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildCalendarGrid(days: DayEntry[]): (DayEntry | null)[][] {
  // Build a map of date → entry
  const map = new Map<string, DayEntry>();
  days.forEach(d => map.set(d.date, d));

  // Start from 52 weeks ago (Monday-aligned)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - WEEKS * 7 + 1);
  // Align to Monday
  const dow = startDate.getDay();
  const offset = (dow + 6) % 7; // Monday = 0
  startDate.setDate(startDate.getDate() - offset);

  const grid: (DayEntry | null)[][] = [];

  for (let w = 0; w < WEEKS; w++) {
    const week: (DayEntry | null)[] = [];
    for (let d = 0; d < DAYS_IN_WEEK; d++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + w * 7 + d);
      const key = cur.toISOString().slice(0, 10);
      const isFuture = cur > today;
      if (isFuture) { week.push(null); continue; }
      week.push(map.get(key) ?? { date: key, completed: false });
    }
    grid.push(week);
  }

  return grid;
}

function getMonthMarkers(grid: (DayEntry | null)[][]): { weekIndex: number; month: string }[] {
  const seen = new Set<string>();
  const markers: { weekIndex: number; month: string }[] = [];
  grid.forEach((week, wi) => {
    const firstDay = week.find(d => d !== null);
    if (!firstDay) return;
    const month = MONTH_LABELS[new Date(firstDay.date).getMonth()];
    if (!seen.has(month)) {
      seen.add(month);
      markers.push({ weekIndex: wi, month });
    }
  });
  return markers;
}

function HeatmapCalendar({ days }: { days: DayEntry[] }) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const grid = buildCalendarGrid(days);
  const monthMarkers = getMonthMarkers(grid);
  const CELL = 11;
  const GAP = 2;
  const step = CELL + GAP;

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ minWidth: WEEKS * step + 40 }}>
        {/* Month labels */}
        <div className="relative h-5 ml-8 mb-1">
          {monthMarkers.map(m => (
            <span
              key={m.month + m.weekIndex}
              className="absolute text-[9px] text-white/30"
              style={{ left: m.weekIndex * step }}
            >
              {m.month}
            </span>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1">
            {DAY_LABELS.map((l, i) => (
              <div key={i} style={{ height: CELL, width: 22 }} className="flex items-center justify-end pr-1">
                <span className="text-[8px] text-white/20">{l}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => {
                if (day === null) {
                  return <div key={di} style={{ width: CELL, height: CELL }} />;
                }
                const color = day.completed ? '#22c55e' : 'rgba(255,255,255,0.05)';
                return (
                  <div
                    key={di}
                    style={{ width: CELL, height: CELL, background: color, borderRadius: 2 }}
                    className="cursor-default transition-all hover:ring-1 hover:ring-white/30"
                    onMouseEnter={e => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        text: `${day.date}${day.niche_id ? ` · ${day.niche_id}` : ''}${day.completed ? ' ✓' : ''}`,
                        x: rect.left,
                        y: rect.top - 28,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 rounded-lg text-[10px] text-white pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y, background: '#1c1810', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 ml-8">
        <span className="text-[9px] text-white/25">Less</span>
        {[0.05, 0.25, 0.5, 0.75, 1].map((op, i) => (
          <div
            key={i}
            style={{ width: CELL, height: CELL, background: i === 0 ? 'rgba(255,255,255,0.05)' : `rgba(34,197,94,${op})`, borderRadius: 2 }}
          />
        ))}
        <span className="text-[9px] text-white/25">More</span>
      </div>
    </div>
  );
}

// ─── Points Bar Chart ────────────────────────────────────────────────────────

function PointsChart({ data }: { data: PointsEntry[] }) {
  if (!data.length) return <div className="text-xs text-white/30 py-8 text-center">No data yet</div>;

  const last90 = data.slice(-90);
  const max = Math.max(...last90.map(d => d.points), 1);

  return (
    <div className="flex items-end gap-0.5 h-24 w-full">
      {last90.map((d, i) => {
        const pct = d.points / max;
        return (
          <motion.div
            key={d.date}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.003, duration: 0.3 }}
            style={{ height: `${Math.max(pct * 100, 4)}%`, background: `rgba(245,158,11,${0.3 + pct * 0.7})`, flex: 1, borderRadius: 2, transformOrigin: 'bottom' }}
            title={`${d.date}: ${d.points} pts`}
          />
        );
      })}
    </div>
  );
}

// ─── Streak Line Chart ────────────────────────────────────────────────────────

function StreakChart({ data }: { data: StreakPoint[] }) {
  if (!data.length) return <div className="text-xs text-white/30 py-8 text-center">No data yet</div>;

  const max = Math.max(...data.map(d => d.maxStreak), 1);
  const W = 100 / (data.length - 1 || 1);

  const points = data
    .map((d, i) => `${i * W},${100 - (d.maxStreak / max) * 100}`)
    .join(' ');

  return (
    <div className="w-full h-24 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={i * W}
            cy={100 - (d.maxStreak / max) * 100}
            r="2"
            fill="#0ea5e9"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Niche Breakdown ─────────────────────────────────────────────────────────

function NicheBreakdown({ data }: { data: NicheBreakdown[] }) {
  if (!data.length) return <div className="text-xs text-white/30 py-8 text-center">No data yet</div>;
  const max = Math.max(...data.map(d => d.days), 1);

  return (
    <div className="flex flex-col gap-3">
      {data.map(n => (
        <div key={n.niche_id} className="flex items-center gap-3">
          <span className="text-base w-5">{n.emoji}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/60">{n.label}</span>
              <span className="text-xs text-white/30">{n.days}d</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(n.days / max) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: n.color }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="mb-6 rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('lumio-token')}`, 'Content-Type': 'application/json' });

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('lumio-token');
      if (!token) { router.push('/login'); return; }

      const res = await fetch(`${apiUrl}/api/analytics/me`, { headers: getHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      setData(json.analytics ?? json);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080706' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-2 border-transparent"
          style={{ borderTopColor: '#f59e0b', borderRightColor: '#f59e0b44' }}
        />
      </div>
    );
  }

  const cs = data?.challengeStats;

  return (
    <div className="min-h-screen text-white" style={{ background: '#080706', fontFamily: 'Syne, sans-serif' }}>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-24">

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-black text-white mb-6"
        >
          Your Analytics
        </motion.h1>

        {/* ── Challenge Stats ── */}
        {cs && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-4 gap-2 mb-6"
          >
            {[
              { label: 'Total',      value: cs.total,         emoji: '🎯' },
              { label: 'Completed',  value: cs.completed,     emoji: '✅' },
              { label: 'Abandoned',  value: cs.abandoned,     emoji: '❌' },
              { label: 'Rate',       value: `${Math.round(cs.completionRate)}%`, emoji: '📊' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-2xl p-3 flex flex-col gap-1 items-center text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-lg font-black text-white leading-none">{s.value}</span>
                <span className="text-[9px] text-white/30">{s.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Completion Heatmap ── */}
        <Section title="Completion Heatmap" delay={0.1}>
          {data ? (
            <HeatmapCalendar days={data.completionDays} />
          ) : (
            <div className="text-xs text-white/30 text-center py-8">No data yet</div>
          )}
        </Section>

        {/* ── Streak History ── */}
        <Section title="Streak History" delay={0.15}>
          {data ? <StreakChart data={data.streakHistory} /> : null}
        </Section>

        {/* ── Points Last 90 Days ── */}
        <Section title="Points — Last 90 Days" delay={0.2}>
          {data ? <PointsChart data={data.pointsHistory} /> : null}
        </Section>

        {/* ── Niche Breakdown ── */}
        <Section title="Time Per Niche" delay={0.25}>
          {data ? <NicheBreakdown data={data.nicheBreakdown} /> : null}
        </Section>

      </div>
    </div>
  );
}
