"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface RingProps {
  done: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  accent: string;
  bg: string;
  textColor: string;
}

export function Ring({
  done,
  total,
  size = 48,
  strokeWidth = 3,
  accent,
  bg,
  textColor,
}: RingProps) {
  const pct = total > 0 ? Math.min(done / total, 1) : 0;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={`${accent}25`}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: size * 0.22 }}
      >
        <span
          style={{
            color: textColor,
            fontFamily: "var(--font-dm-mono, DM Mono, monospace)",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {done}
        </span>
      </div>
    </div>
  );
}
