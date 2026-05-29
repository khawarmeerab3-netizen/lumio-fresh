"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChallengeStore } from "@/stores/challengeStore";
import { useMoodStore } from "@/stores/moodStore";
import { MOODS } from "@/shared/constants/moods";
import { MilestonePopup } from "@/components/lumio/MilestonePopup";
import type { DailyTask, MilestoneReached } from "@/shared/types";

// ─── skeleton ────────────────────────────────────────────────────────────────
function Skeleton({
  h = "h-4",
  w = "w-full",
  style,
}: {
  h?: string;
  w?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`${h} ${w} rounded-lg`}
      style={style}
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.4 }}
    />
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function TodayPage() {
  const params = useParams<{ id: string }>();
  const { selectedMood } = useMoodStore();
  const { activeChallenge, updateChallengeInStore } = useChallengeStore();
  const mood = MOODS.find((m) => m.id === selectedMood) ?? MOODS[0];

  const [task, setTask] = useState<DailyTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [milestone, setMilestone] = useState<MilestoneReached | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── fetch today's task ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!params.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/challenges/${params.id}/task`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load task");
        setTask(json.data);
        setCompleted(json.data?.status === "completed");
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [params.id]);

  // ── complete day ────────────────────────────────────────────────────────────
  async function handleComplete() {
    if (completing || completed || !params.id) return;
    try {
      setCompleting(true);
      const res = await fetch(`/api/challenges/${params.id}/complete-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: reflection }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not complete day");
      setCompleted(true);
      if (json.data?.challenge) updateChallengeInStore(json.data.challenge);
      if (json.data?.milestoneReached) setMilestone(json.data.milestoneReached);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCompleting(false);
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────────
  const taskData = task?.task_data;

  // ── loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-3"
            style={{
              background: mood.bg3,
              border: `1px solid ${mood.border}`,
            }}
          >
            <Skeleton h="h-3" w="w-24" style={{ background: mood.border2 }} />
            <Skeleton h="h-5" style={{ background: mood.border2 }} />
            <Skeleton h="h-4" w="w-3/4" style={{ background: mood.border2 }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-sm" style={{ color: mood.text2 }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-4 py-6 space-y-4 pb-32"
      >
        {/* ── Day header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1
            className="text-lg font-bold"
            style={{
              color: mood.text,
              fontFamily: "var(--font-syne, Syne, sans-serif)",
            }}
          >
            {taskData?.dayTitle ?? `Day ${task?.day_number}`}
          </h1>
          {taskData?.timeRequired && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-mono"
              style={{
                background: mood.soft,
                color: mood.accent,
                border: `1px solid ${mood.border}`,
              }}
            >
              ⏱ {taskData.timeRequired}
            </span>
          )}
        </div>

        {/* ── Mission card ────────────────────────────────────────────────── */}
        <div
          className="rounded-xl p-4 relative overflow-hidden"
          style={{
            background: mood.bg3,
            border: `1px solid ${mood.border}`,
            borderLeft: `3px solid ${mood.accent}`,
          }}
        >
          <p
            className="text-[10px] font-mono uppercase tracking-widest mb-3"
            style={{ color: mood.text2 }}
          >
            TODAY'S MISSION
          </p>
          <p
            className="text-base leading-relaxed"
            style={{
              color: mood.text,
              fontFamily: "var(--font-lora, Lora, Georgia, serif)",
              lineHeight: 1.6,
            }}
          >
            {taskData?.task ?? "Your personalized task will appear here."}
          </p>
        </div>

        {/* ── Steps card ──────────────────────────────────────────────────── */}
        {taskData?.steps && taskData.steps.length > 0 && (
          <div
            className="rounded-xl p-4"
            style={{
              background: mood.bg3,
              border: `1px solid ${mood.border}`,
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-3"
              style={{ color: mood.text2 }}
            >
              STEP BY STEP
            </p>
            <div className="space-y-3">
              {taskData.steps.map((step: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className="flex gap-3 items-start"
                >
                  {/* Accent square number badge */}
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      background: mood.accent,
                      color: mood.bg,
                      fontFamily: "var(--font-dm-mono, DM Mono, monospace)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: mood.text }}
                  >
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reflection card ─────────────────────────────────────────────── */}
        <div
          className="rounded-xl p-4"
          style={{
            background: mood.bg3,
            border: `1px solid ${mood.border}`,
          }}
        >
          <p
            className="text-[10px] font-mono uppercase tracking-widest mb-3"
            style={{ color: mood.text2 }}
          >
            REFLECTION
          </p>
          {taskData?.coachQuestion && (
            <p
              className="text-sm mb-3 italic"
              style={{
                color: mood.text2,
                fontFamily: "var(--font-lora, Lora, Georgia, serif)",
              }}
            >
              {taskData.coachQuestion}
            </p>
          )}
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write your thoughts here..."
            rows={3}
            disabled={completed}
            className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
            style={{
              background: mood.bg2,
              border: `1px solid ${mood.border}`,
              color: mood.text,
              fontFamily: "var(--font-lora, Lora, Georgia, serif)",
              "--focus-border": mood.accent,
            } as React.CSSProperties}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = mood.accent;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${mood.soft}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = mood.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* ── Motivational strip ──────────────────────────────────────────── */}
        {taskData?.motivationalNote && (
          <div
            className="rounded-xl px-4 py-3.5"
            style={{ background: mood.soft }}
          >
            <p
              className="text-sm italic text-center"
              style={{
                color: mood.accent,
                fontFamily: "var(--font-lora, Lora, Georgia, serif)",
              }}
            >
              ✨ {taskData.motivationalNote}
            </p>
          </div>
        )}

        {/* ── Complete Day button ──────────────────────────────────────────── */}
        <motion.button
          onClick={handleComplete}
          disabled={completing || completed}
          whileTap={!completed ? { scale: 0.97 } : undefined}
          animate={
            completing
              ? {
                  scale: [1, 0.95, 1.05, 1],
                  transition: { type: "spring", stiffness: 400, damping: 10 },
                }
              : {}
          }
          className="w-full py-4 rounded-2xl text-sm font-bold tracking-wider transition-all"
          style={{
            fontFamily: "var(--font-syne, Syne, sans-serif)",
            ...(completed
              ? {
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  cursor: "default",
                }
              : {
                  background: "transparent",
                  color: mood.accent,
                  border: `1.5px solid ${mood.accent}`,
                  cursor: completing ? "wait" : "pointer",
                }),
          }}
        >
          {completed ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              COMPLETED — GREAT WORK!
            </span>
          ) : completing ? (
            "COMPLETING..."
          ) : (
            "COMPLETE DAY"
          )}
        </motion.button>
      </motion.div>

      {/* ── Milestone popup ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {milestone && (
          <MilestonePopup
            milestone={milestone}
            mood={mood}
            onClose={() => setMilestone(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
