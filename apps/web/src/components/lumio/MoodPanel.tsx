'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodStore, MOODS, isMoodUnlocked, type MoodDef } from '@/stores/mood-store';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  visible: boolean;
  emoji: string;
  text: string;
}

function MoodToast({ toast }: { toast: ToastState }) {
  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          key="mood-toast"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-24 left-1/2 z-[9999] -translate-x-1/2 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold shadow-2xl"
          style={{
            background: 'var(--lumio-bg3)',
            border: '1px solid var(--lumio-border2)',
            color: 'var(--lumio-text)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <span className="text-lg">{toast.emoji}</span>
          <span>{toast.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Lock Tooltip ─────────────────────────────────────────────────────────────

function LockTooltip({ visible, planRequired }: { visible: boolean; planRequired: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap z-50 pointer-events-none"
          style={{ background: '#1c1c1c', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          🔒 Upgrade to {planRequired.charAt(0).toUpperCase() + planRequired.slice(1)}
          {/* Arrow */}
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ background: '#1c1c1c', borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Mood Tile ────────────────────────────────────────────────────────────────

function MoodTile({
  mood,
  isActive,
  isUnlocked,
  onSelect,
}: {
  mood: MoodDef;
  isActive: boolean;
  isUnlocked: boolean;
  onSelect: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => !isUnlocked && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <LockTooltip visible={showTooltip && !isUnlocked} planRequired={mood.minPlan} />

      <motion.button
        whileHover={{ scale: isUnlocked ? 1.06 : 1.02 }}
        whileTap={{ scale: isUnlocked ? 0.94 : 0.98 }}
        onClick={onSelect}
        className="relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-full"
        style={{
          background: isActive
            ? mood.soft
            : 'rgba(255,255,255,0.03)',
          border: `1.5px solid ${isActive ? mood.accent + '60' : 'rgba(255,255,255,0.07)'}`,
          opacity: isUnlocked ? 1 : 0.5,
          cursor: isUnlocked ? 'pointer' : 'not-allowed',
        }}
        title={isUnlocked ? `${mood.name} — ${mood.label}` : `Unlock with ${mood.minPlan}`}
      >
        {/* Mood preview swatch */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${mood.bg4}, ${mood.bg2})`, border: `1px solid ${mood.border2}` }}
        >
          <span>{mood.emoji}</span>
          {/* Accent dot */}
          <div
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
            style={{ background: mood.accent }}
          />
        </div>

        <div className="text-center">
          <p
            className="text-xs font-bold leading-none"
            style={{ color: isActive ? mood.accent : 'rgba(255,255,255,0.7)' }}
          >
            {mood.name}
          </p>
          <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {mood.label}
          </p>
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="active-mood-ring"
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `2px solid ${mood.accent}`, boxShadow: `0 0 12px ${mood.accent}40` }}
          />
        )}

        {/* Lock overlay */}
        {!isUnlocked && (
          <div className="absolute top-1.5 right-1.5 text-[10px] bg-black/50 rounded-full p-0.5">
            🔒
          </div>
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── MoodPanel ────────────────────────────────────────────────────────────────

interface MoodPanelProps {
  /** Called when user selects a locked mood — parent may show upgrade flow */
  onLockedMoodTap?: (mood: MoodDef) => void;
}

export function MoodPanel({ onLockedMoodTap }: MoodPanelProps) {
  const { activeMood, userPlan, switchMood } = useMoodStore();
  const [toast, setToast] = useState<ToastState>({ visible: false, emoji: '', text: '' });

  const showToast = useCallback((emoji: string, name: string, label: string) => {
    setToast({ visible: true, emoji, text: `${name.toUpperCase()} MODE — ${label}` });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  const handleSelect = (mood: MoodDef) => {
    const unlocked = isMoodUnlocked(mood, userPlan);
    if (!unlocked) {
      onLockedMoodTap?.(mood);
      return;
    }
    const switched = switchMood(mood.id);
    if (switched) {
      showToast(mood.emoji, mood.name, mood.label);
    }
  };

  return (
    <>
      <div className="w-full">
        {/* Plan tiers legend */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {[
            { plan: 'free',    label: 'Free',    color: '#64748b' },
            { plan: 'starter', label: 'Starter', color: '#22c55e' },
            { plan: 'pro',     label: 'Pro',      color: '#0ea5e9' },
          ].map(p => (
            <div key={p.plan} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Mood grid */}
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map(mood => (
            <MoodTile
              key={mood.id}
              mood={mood}
              isActive={activeMood.id === mood.id}
              isUnlocked={isMoodUnlocked(mood, userPlan)}
              onSelect={() => handleSelect(mood)}
            />
          ))}
        </div>

        {/* Current mood display */}
        <div
          className="mt-4 p-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-2xl">{activeMood.emoji}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: activeMood.accent }}>
              {activeMood.name} Mode
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {activeMood.label} · {activeMood.animStyle} animations
            </p>
          </div>
          <div
            className="ml-auto w-6 h-6 rounded-full"
            style={{ background: activeMood.g, boxShadow: `0 0 10px ${activeMood.accent}60` }}
          />
        </div>
      </div>

      <MoodToast toast={toast} />
    </>
  );
}

// ─── MoodFAB — floating action button shown throughout the app ────────────────

export function MoodFAB() {
  const { activeMood, userPlan, switchMood } = useMoodStore();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, emoji: '', text: '' });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const showToast = (emoji: string, name: string, label: string) => {
    setToast({ visible: true, emoji, text: `${name.toUpperCase()} MODE` });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  return (
    <>
      {/* Mini picker popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-24 right-4 z-50 p-3 rounded-2xl shadow-2xl"
            style={{
              background: 'var(--lumio-bg3)',
              border: '1px solid var(--lumio-border2)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Mood
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {MOODS.map(m => {
                const unlocked = isMoodUnlocked(m, userPlan);
                const active = activeMood.id === m.id;
                return (
                  <motion.button
                    key={m.id}
                    whileHover={{ scale: unlocked ? 1.1 : 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (!unlocked) return;
                      switchMood(m.id);
                      showToast(m.emoji, m.name, m.label);
                      setOpen(false);
                    }}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{
                      background: active ? m.soft : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${active ? m.accent + '60' : 'rgba(255,255,255,0.07)'}`,
                      opacity: unlocked ? 1 : 0.4,
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                    }}
                    title={unlocked ? `${m.name} — ${m.label}` : `Unlock with ${m.minPlan}`}
                  >
                    {m.emoji}
                    {!unlocked && (
                      <span className="absolute top-0 right-0 text-[8px]">🔒</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="fixed bottom-6 right-4 z-50 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xl"
        style={{
          background: activeMood.g,
          boxShadow: `0 4px 20px ${activeMood.accent}50`,
        }}
        aria-label="Change mood"
      >
        {activeMood.emoji}
      </motion.button>

      <MoodToast toast={toast} />
    </>
  );
}

// ─── MoodHydrator — put once in root layout to restore saved mood ─────────────

export function MoodHydrator({ savedMood, userPlan }: { savedMood?: string; userPlan?: string }) {
  const { hydrateMood, setUserPlan } = useMoodStore();

  useEffect(() => {
    if (userPlan) setUserPlan(userPlan);
    if (savedMood) hydrateMood(savedMood);
  }, [savedMood, userPlan, hydrateMood, setUserPlan]);

  return null;
}
