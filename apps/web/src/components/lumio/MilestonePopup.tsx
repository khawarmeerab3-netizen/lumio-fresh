"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { MoodDef } from "@/stores/mood-store";

interface MilestoneReached {
  label: string;
  day: number;
  aiMessage?: string;
}

interface Props {
  milestone: MilestoneReached;
  mood: MoodDef;
  onClose: () => void;
}

export function MilestonePopup({ milestone, mood, onClose }: Props) {
  // Auto-close after 8 seconds
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      {/* Card */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 text-center relative overflow-hidden"
        style={{
          background: mood.bg2,
          border: `1.5px solid ${mood.accent}40`,
          boxShadow: `0 0 40px ${mood.accent}30`,
        }}
      >
        {/* Glow orb behind */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${mood.accent}30 0%, transparent 70%)`,
          }}
        />

        {/* Crown / milestone icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 14 }}
          className="text-5xl mb-4"
        >
          🏆
        </motion.div>

        {/* Milestone label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[10px] font-mono uppercase tracking-widest mb-1"
          style={{ color: mood.text2 }}
        >
          MILESTONE REACHED
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-xl font-bold mb-1"
          style={{
            color: mood.accent,
            fontFamily: "var(--font-syne, Syne, sans-serif)",
          }}
        >
          {milestone.label}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-mono mb-4"
          style={{ color: mood.text2 }}
        >
          Day {milestone.day}
        </motion.p>

        {/* AI coach message */}
        {milestone.aiMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl px-4 py-3 mb-5"
            style={{
              background: mood.soft,
              border: `1px solid ${mood.accent}30`,
            }}
          >
            <p
              className="text-sm italic leading-relaxed"
              style={{
                color: mood.text,
                fontFamily: "var(--font-lora, Lora, Georgia, serif)",
              }}
            >
              "{milestone.aiMessage}"
            </p>
            <p
              className="text-[10px] font-mono mt-2"
              style={{ color: mood.text2 }}
            >
              — Lumio Coach
            </p>
          </motion.div>
        )}

        {/* Close button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          onClick={onClose}
          whileTap={{ scale: 0.96 }}
          className="w-full py-3 rounded-xl text-sm font-bold tracking-wider"
          style={{
            background: mood.accent,
            color: mood.bg,
            fontFamily: "var(--font-syne, Syne, sans-serif)",
          }}
        >
          KEEP GOING! 🚀
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
