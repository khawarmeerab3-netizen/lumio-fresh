"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useChallengeStore } from "@/stores/challengeStore";
import { useMoodStore } from "@/stores/moodStore";
import { MOODS } from "@/shared/constants/moods";
import { MILESTONE_MAP } from "@/shared/constants/durations";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
  bg,
  border,
  text,
  text2,
  delay,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  bg: string;
  border: string;
  text: string;
  text2: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex-1 rounded-xl p-3 text-center"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <p
        className="text-2xl font-bold"
        style={{
          color: text,
          fontFamily: "var(--font-syne, Syne, sans-serif)",
        }}
      >
        {value}
      </p>
      <p
        className="text-[10px] font-mono uppercase tracking-wider mt-0.5"
        style={{ color: text2 }}
      >
        {label}
      </p>
    </motion.div>
  );
}

// ─── Milestone node ───────────────────────────────────────────────────────────
function MilestoneNode({
  label,
  day,
  state,
  isFinal,
  accent,
  bg3,
  bg,
  border,
  text,
  text2,
  delay,
}: {
  label: string;
  day: number;
  state: "completed" | "current" | "upcoming";
  isFinal: boolean;
  accent: string;
  bg3: string;
  bg: string;
  border: string;
  text: string;
  text2: string;
  delay: number;
}) {
  const nodeStyle: React.CSSProperties =
    state === "completed"
      ? { background: accent, border: `2px solid ${accent}` }
      : state === "current"
      ? {
          background: "transparent",
          border: `2px solid ${accent}`,
          boxShadow: `0 0 0 4px ${accent}30`,
        }
      : { background: "transparent", border: `2px solid ${border}` };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-4"
    >
      {/* Circle */}
      <div className="relative shrink-0">
        <motion.div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={nodeStyle}
          animate={
            state === "current"
              ? {
                  boxShadow: [
                    `0 0 0 4px ${accent}30`,
                    `0 0 0 8px ${accent}10`,
                    `0 0 0 4px ${accent}30`,
                  ],
                }
              : {}
          }
          transition={
            state === "current"
              ? { repeat: Infinity, duration: 2 }
              : {}
          }
        >
          {state === "completed" ? (
            // Checkmark
            <svg
              viewBox="0 0 20 20"
              fill={bg}
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : isFinal ? (
            <span className="text-base">👑</span>
          ) : state === "current" ? (
            <span
              className="text-xs font-bold"
              style={{
                color: accent,
                fontFamily: "var(--font-dm-mono, DM Mono, monospace)",
              }}
            >
              {day}
            </span>
          ) : (
            <span
              className="text-xs"
              style={{ color: border, fontFamily: "var(--font-dm-mono, DM Mono, monospace)" }}
            >
              {day}
            </span>
          )}
        </motion.div>
      </div>

      {/* Label */}
      <div>
        <p
          className="text-sm font-semibold"
          style={{
            color: state === "upcoming" ? text2 : text,
            fontFamily: "var(--font-syne, Syne, sans-serif)",
          }}
        >
          {label}
        </p>
        <p
          className="text-[10px] font-mono"
          style={{ color: text2 }}
        >
          Day {day}
        </p>
      </div>
    </motion.div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function JourneyPage() {
  const { selectedMood } = useMoodStore();
  const { activeChallenge } = useChallengeStore();
  const mood = MOODS.find((m) => m.id === selectedMood) ?? MOODS[0];

  if (!activeChallenge) return null;

  const challenge = activeChallenge;
  const doneDays = challenge.completed_days?.length ?? 0;
  const totalDays = challenge.duration_days;
  const remaining = Math.max(0, totalDays - doneDays);
  const pct = Math.round((doneDays / totalDays) * 100);
  const currentDay = challenge.current_day ?? 1;

  // Get milestone list for this duration
  const milestones =
    MILESTONE_MAP[totalDays as keyof typeof MILESTONE_MAP] ??
    MILESTONE_MAP[30];

  // Fill fraction for the connecting line
  const completedMilestones = milestones.filter(
    (m) => (challenge.completed_days ?? []).includes(m.d) || m.d < currentDay
  ).length;
  const lineFillPct =
    milestones.length > 1
      ? Math.min(
          100,
          ((completedMilestones - 1) / (milestones.length - 1)) * 100
        )
      : pct;

  // Determine node state
  function nodeState(
    dayNum: number
  ): "completed" | "current" | "upcoming" {
    const completedDays: number[] = challenge.completed_days ?? [];
    if (completedDays.includes(dayNum) || dayNum < currentDay)
      return "completed";
    if (dayNum === currentDay) return "current";
    return "upcoming";
  }

  // AI plan data
  const aiPlan = challenge.ai_plan as {
    dailyHabits?: string[];
    quickWins?: string[];
    successMetrics?: string[];
  } | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="px-4 py-6 space-y-6 pb-32"
    >
      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <StatCard
          label="Days Done"
          value={doneDays}
          accent
          bg={mood.bg3}
          border={mood.border}
          text={mood.accent}
          text2={mood.text2}
          delay={0}
        />
        <StatCard
          label="Remaining"
          value={remaining}
          bg={mood.bg3}
          border={mood.border}
          text={mood.text}
          text2={mood.text2}
          delay={0.05}
        />
        <StatCard
          label="Progress"
          value={`${pct}%`}
          bg={mood.bg3}
          border={mood.border}
          text={mood.text}
          text2={mood.text2}
          delay={0.1}
        />
      </div>

      {/* ── Milestone map ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: mood.bg3, border: `1px solid ${mood.border}` }}
      >
        <p
          className="text-[10px] font-mono uppercase tracking-widest mb-5"
          style={{ color: mood.text2 }}
        >
          MILESTONE MAP
        </p>

        <div className="relative">
          {/* Vertical connecting line (behind nodes) */}
          <div
            className="absolute left-[17px] top-5 bottom-5 w-0.5 rounded-full"
            style={{ background: mood.border }}
          />
          {/* Animated fill */}
          <motion.div
            className="absolute left-[17px] top-5 w-0.5 rounded-full origin-top"
            style={{ background: mood.accent }}
            initial={{ height: "0%" }}
            animate={{ height: `${lineFillPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />

          {/* Nodes */}
          <div className="relative space-y-6">
            {milestones.map((m, i) => (
              <MilestoneNode
                key={m.d}
                label={m.l}
                day={m.d}
                state={nodeState(m.d)}
                isFinal={i === milestones.length - 1}
                accent={mood.accent}
                bg3={mood.bg3}
                bg={mood.bg}
                border={mood.border}
                text={mood.text}
                text2={mood.text2}
                delay={0.1 + i * 0.07}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Daily Habits ────────────────────────────────────────────────────── */}
      {aiPlan?.dailyHabits && aiPlan.dailyHabits.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: mood.bg3, border: `1px solid ${mood.border}` }}
        >
          <p
            className="text-[10px] font-mono uppercase tracking-widest mb-4"
            style={{ color: mood.text2 }}
          >
            DAILY HABITS
          </p>
          <div className="space-y-2.5">
            {aiPlan.dailyHabits.map((habit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.2 }}
                className="flex items-start gap-2.5"
              >
                <span className="text-sm mt-0.5 shrink-0">✓</span>
                <p className="text-sm" style={{ color: mood.text }}>
                  {habit}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Plan overview ───────────────────────────────────────────────────── */}
      {(aiPlan?.quickWins || aiPlan?.successMetrics) && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: mood.bg3, border: `1px solid ${mood.border}` }}
        >
          <p
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: mood.text2 }}
          >
            PLAN OVERVIEW
          </p>

          {aiPlan.quickWins && aiPlan.quickWins.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold mb-2"
                style={{
                  color: mood.accent,
                  fontFamily: "var(--font-syne, Syne, sans-serif)",
                }}
              >
                Quick Wins
              </p>
              <div className="space-y-1.5">
                {aiPlan.quickWins.map((w, i) => (
                  <p key={i} className="text-sm" style={{ color: mood.text }}>
                    · {w}
                  </p>
                ))}
              </div>
            </div>
          )}

          {aiPlan.successMetrics && aiPlan.successMetrics.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold mb-2"
                style={{
                  color: mood.accent,
                  fontFamily: "var(--font-syne, Syne, sans-serif)",
                }}
              >
                Success Metrics
              </p>
              <div className="space-y-1.5">
                {aiPlan.successMetrics.map((m, i) => (
                  <p key={i} className="text-sm" style={{ color: mood.text }}>
                    · {m}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
