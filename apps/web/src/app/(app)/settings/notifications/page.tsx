'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPrefs {
  dailyReminderTime:  string;   // "HH:MM" 24h
  streakReminders:    boolean;
  coachMessages:      boolean;
  communityLikes:     boolean;
  buddyUpdates:       boolean;
  newBadges:          boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: NotificationPrefs = {
  dailyReminderTime: '08:00',
  streakReminders:   true,
  coachMessages:     true,
  communityLikes:    false,
  buddyUpdates:      true,
  newBadges:         true,
};

const TOGGLE_CATEGORIES: {
  key:   keyof Omit<NotificationPrefs, 'dailyReminderTime'>;
  icon:  string;
  label: string;
  desc:  string;
}[] = [
  { key: 'streakReminders', icon: '🔥', label: 'Streak Reminders',  desc: "Don't break your streak — daily nudge before midnight" },
  { key: 'coachMessages',   icon: '🎯', label: 'Coach Messages',    desc: 'When your AI coach sends a new tip or check-in'       },
  { key: 'communityLikes',  icon: '❤️', label: 'Community Likes',   desc: 'When someone reacts to your check-in post'           },
  { key: 'buddyUpdates',    icon: '🤝', label: 'Buddy Updates',     desc: 'When a buddy completes a day or earns a badge'       },
  { key: 'newBadges',       icon: '🏆', label: 'New Badges',        desc: "You've unlocked a new achievement"                  },
];

// Quick-pick times
const QUICK_TIMES = [
  { label: '6 AM',  value: '06:00' },
  { label: '7 AM',  value: '07:00' },
  { label: '8 AM',  value: '08:00' },
  { label: '9 AM',  value: '09:00' },
  { label: '12 PM', value: '12:00' },
  { label: '6 PM',  value: '18:00' },
  { label: '8 PM',  value: '20:00' },
  { label: '9 PM',  value: '21:00' },
];

function fmt12(value: string): string {
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr ?? '8', 10);
  const m = mStr ?? '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12    = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
  icon, label, desc, enabled, onChange,
}: {
  icon: string; label: string; desc: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#1e1a14] last:border-0">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[#fdfaf3] font-semibold text-sm font-[Syne]">{label}</p>
        <p className="text-[#504830] text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className="flex-shrink-0 mt-0.5 relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
        style={{ backgroundColor: enabled ? '#f59e0b' : '#2a2418' }}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

// ─── Save Toast ───────────────────────────────────────────────────────────────

function SaveToast({ show, error }: { show: boolean; error: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl border"
          style={error
            ? { backgroundColor: '#1a0a0a', borderColor: '#7f1d1d', color: '#f87171' }
            : { backgroundColor: '#0a1a0e', borderColor: '#14532d', color: '#4ade80' }
          }
        >
          <span>{error ? '✕' : '✓'}</span>
          <span className="font-semibold text-sm">{error ? 'Failed to save' : 'Preferences saved!'}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationSettingsPage() {
  const [prefs,   setPrefs]   = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ show: boolean; error: boolean }>({ show: false, error: false });
  const [dirty,   setDirty]   = useState(false);

  // Load current prefs
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/notification-prefs`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json() as { data: NotificationPrefs };
          setPrefs(json.data);
        }
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const update = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ notificationPrefs: prefs }),
      });
      const ok = res.ok;
      setToast({ show: true, error: !ok });
      setDirty(false);
    } catch {
      setToast({ show: true, error: true });
    } finally {
      setSaving(false);
      setTimeout(() => setToast({ show: false, error: false }), 2800);
    }
  };

  const enabledCount = TOGGLE_CATEGORIES.filter((c) => prefs[c.key]).length;

  return (
    <>
      <div className="min-h-screen bg-[#080706] flex flex-col">
        {/* Header */}
        <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full">
          <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne] mb-1">Notifications</h1>
          <p className="text-[#a09060] text-sm">Stay informed without being overwhelmed.</p>
        </div>

        {loading ? (
          <div className="px-4 max-w-lg mx-auto w-full space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-[#100e0a] border border-[#1e1a14]" />)}
          </div>
        ) : (
          <div className="flex-1 px-4 max-w-lg mx-auto w-full pb-32 space-y-5">

            {/* Daily Reminder Time */}
            <section className="p-4 rounded-xl border border-[#2a2418] bg-[#100e0a]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="text-[#fdfaf3] font-semibold font-[Syne]">Daily Reminder</p>
                  <p className="text-[#504830] text-xs">When should we remind you to complete your daily task?</p>
                </div>
              </div>

              {/* Time input */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <input
                    type="time"
                    value={prefs.dailyReminderTime}
                    onChange={(e) => update('dailyReminderTime', e.target.value)}
                    className="w-full bg-[#0c0a08] border-2 border-[#2a2418] rounded-xl px-4 py-3 text-[#fdfaf3] focus:outline-none focus:border-[#f59e0b] transition-colors font-[Syne] font-bold text-lg text-center"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div
                  className="px-4 py-3 rounded-xl border-2 text-center flex-shrink-0 font-bold font-[Syne]"
                  style={{ borderColor: '#f59e0b40', backgroundColor: '#f59e0b10', color: '#f59e0b' }}
                >
                  {fmt12(prefs.dailyReminderTime)}
                </div>
              </div>

              {/* Quick picks */}
              <div className="flex flex-wrap gap-2">
                {QUICK_TIMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => update('dailyReminderTime', t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-150
                      ${prefs.dailyReminderTime === t.value
                        ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.15)] text-[#f59e0b]'
                        : 'border-[#2a2418] text-[#a09060] hover:border-[#362e1e] hover:text-[#fdfaf3]'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Toggle categories */}
            <section className="p-4 rounded-xl border border-[#2a2418] bg-[#100e0a]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold">Notification Types</p>
                <span className="text-xs text-[#504830]">{enabledCount}/{TOGGLE_CATEGORIES.length} enabled</span>
              </div>

              {TOGGLE_CATEGORIES.map((cat) => (
                <ToggleRow
                  key={cat.key}
                  icon={cat.icon}
                  label={cat.label}
                  desc={cat.desc}
                  enabled={prefs[cat.key]}
                  onChange={(v) => update(cat.key, v)}
                />
              ))}
            </section>

            {/* Quiet hours hint */}
            <div className="flex items-start gap-3 p-3 rounded-xl border border-[#2a2418] bg-[#0c0a08]">
              <span className="text-base flex-shrink-0 mt-0.5">🌙</span>
              <p className="text-[#504830] text-xs leading-relaxed">
                Lumio automatically silences all notifications between <span className="text-[#a09060]">11 PM – 7 AM</span> in your local timezone.
              </p>
            </div>

          </div>
        )}

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#080706]/95 backdrop-blur-sm border-t border-[#2a2418] p-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {dirty && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#a09060] flex-1">
                Unsaved changes
              </motion.p>
            )}
            <motion.button
              onClick={save}
              disabled={saving || !dirty}
              whileHover={dirty && !saving ? { scale: 1.02 } : {}}
              whileTap={dirty && !saving ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-bold font-[Syne] transition-all duration-200
                ${dirty && !saving
                  ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black shadow-lg shadow-[rgba(245,158,11,0.25)]'
                  : 'bg-[#1a1610] text-[#504830] cursor-not-allowed'
                }`}
            >
              {saving ? 'Saving...' : dirty ? 'Save Preferences' : 'Preferences Saved ✓'}
            </motion.button>
          </div>
        </div>
      </div>

      <SaveToast show={toast.show} error={toast.error} />
    </>
  );
}
