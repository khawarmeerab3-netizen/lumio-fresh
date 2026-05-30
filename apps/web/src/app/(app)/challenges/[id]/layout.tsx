"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useChallengeStore } from "@/stores/challengeStore";
import { useAuthStore } from "@/stores/authStore";
import { useMoodStore } from "@/stores/moodStore";
import MoodFAB from "@/components/lumio/MoodFAB";
import { Ring } from "@/components/lumio/Ring";
import { MOODS } from "@/shared/constants/moods";

const TABS = [
  { key: "today",     label: "Today",     emoji: "🎯", path: "today"     },
  { key: "report",    label: "Report",    emoji: "📊", path: "report"    },
  { key: "coach",     label: "Coach",     emoji: "🤖", path: "coach"     },
  { key: "community", label: "Community", emoji: "🌍", path: "community" },
  { key: "journey",   label: "Journey",   emoji: "🗺️", path: "journey"   },
] as const;

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { selectedMood } = useMoodStore();
  const {
    activeChallenge,
    loadChallenge,
    isLoadingChallenge,
    challengeError,
  } = useChallengeStore();

  const mood = MOODS.find((m) => m.id === selectedMood) ?? MOODS[0];

  useEffect(() => {
    if (params.id) {
      loadChallenge(params.id);
    }
  }, [params.id, loadChallenge]);

  // Determine active tab from pathname
  const activeTab = TABS.find((t) => pathname.endsWith(t.path))?.key ?? "today";

  if (isLoadingChallenge) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: mood.bg }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-10 h-10 rounded-full"
          style={{ background: mood.accent }}
        />
      </div>
    );
  }

  if (challengeError || !activeChallenge) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: mood.bg, color: mood.text }}
      >
        <p className="font-mono text-sm" style={{ color: mood.text2 }}>
          Challenge not found or access denied.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: mood.soft,
            color: mood.accent,
            border: `1px solid ${mood.border}`,
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const challenge = activeChallenge;
  const doneDays = challenge.completed_days?.length ?? 0;
  const totalDays = challenge.duration_days;
  const pct = Math.round((doneDays / totalDays) * 100);

  // Find matching niche for icon
  const nicheIcon = challenge.niche_id ?? "🏆";
  const nicheColor = challenge.niche_color ?? mood.accent;
  const nicheCategory = challenge.niche_category ?? "Challenge";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: mood.bg, color: mood.text }}
    >
      {/* ── FIXED HEADER ─────────────────────────────── */}
      <header
        className="sticky top-0 z-40 px-4 pt-4 pb-0"
        style={{
          background: `${mood.bg}f0`,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${mood.border}`,
        }}
      >
        {/* Row 1: niche + title + ring */}
        <div className="flex items-center gap-3 pb-3">
          {/* Niche badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            style={{
              background: `${nicheColor}1a`,
              border: `1px solid ${nicheColor}40`,
              color: nicheColor,
            }}
          >
            <span>{nicheIcon}</span>
            <span className="font-mono uppercase tracking-wider text-[10px]">
              {nicheCategory}
            </span>
          </div>

          {/* Goal title */}
          <p
            className="flex-1 text-sm font-semibold truncate"
            style={{ color: mood.text, fontFamily: "var(--font-syne, Syne, sans-serif)" }}
          >
            {challenge.goal}
          </p>

          {/* Progress ring */}
          <div className="shrink-0">
            <Ring
              done={doneDays}
              total={totalDays}
              size={40}
              accent={mood.accent}
              bg={mood.bg3}
              textColor={mood.text}
            />
          </div>
        </div>

        {/* Row 2: progress bar */}
        <div className="pb-0">
          <div className="flex justify-between items-center mb-1.5">
            <span
              className="text-[11px] font-mono"
              style={{ color: mood.text2 }}
            >
              DAY {challenge.current_day}/{totalDays}
            </span>
            <span
              className="text-[11px] font-mono"
              style={{ color: mood.accent }}
            >
              {pct}%
            </span>
          </div>
          <div
            className="h-0.5 w-full rounded-full"
            style={{ background: mood.border }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: mood.accent }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Row 3: 5-tab nav */}
        <nav className="flex mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/challenges/${params.id}/${tab.path}`}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] font-medium shrink-0 transition-colors"
                style={{
                  color: isActive ? mood.accent : mood.text2,
                  fontFamily: "var(--font-syne, Syne, sans-serif)",
                }}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                    style={{ background: mood.accent }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ── PAGE CONTENT ─────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* ── MOOD FAB ─────────────────────────────────── */}
      <MoodFAB />
    </div>
  );
}
