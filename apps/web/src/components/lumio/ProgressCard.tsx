'use client';

import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNicheTheme } from '@/lib/niche-theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressCardData {
  challengeTitle: string;
  nicheId: string;
  currentDay: number;
  totalDays: number;
  streakCount: number;
  /** AI-generated milestone message */
  milestoneMessage: string;
  userName: string;
}

interface ProgressCardProps {
  data: ProgressCardData;
  /** Rendered inline as a preview card */
  previewMode?: boolean;
  /** shareUrl for "Copy Link" button */
  shareUrl?: string;
  onClose?: () => void;
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────

/**
 * Draws the full 1080×1920 card onto a canvas element and returns its dataURL.
 * Pure canvas — no DOM measurements, safe to call in a worker eventually.
 */
async function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  data: ProgressCardData
): Promise<void> {
  const W = 1080;
  const H = 1920;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d')!;
  const theme = getNicheTheme(data.nicheId);
  const progress = data.currentDay / data.totalDays;

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#080706');
  bg.addColorStop(0.5, theme.bgTint.replace('0.07', '0.18') as string);
  bg.addColorStop(1, '#080706');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Radial ambient glow (top centre) ──
  const radial = ctx.createRadialGradient(W / 2, 500, 0, W / 2, 500, 700);
  radial.addColorStop(0, theme.glowColor.replace('0.35', '0.22'));
  radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  // ── Grid dots pattern (subtle) ──
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let x = 40; x < W; x += 80) {
    for (let y = 40; y < H; y += 80) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Top border line ──
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 120);
  ctx.lineTo(W - 80, 120);
  ctx.stroke();

  // ── Lumio logo wordmark ──
  ctx.fillStyle = theme.primaryColor;
  ctx.font = 'bold 56px "Syne", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMIO', W / 2, 100);

  // ── Niche icon (large) ──
  ctx.font = '180px serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.icon, W / 2, 440);

  // ── Niche label ──
  ctx.fillStyle = theme.primaryColor;
  ctx.font = 'bold 44px "Syne", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.label.toUpperCase(), W / 2, 530);

  // ── Challenge title ──
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 72px "Syne", system-ui, sans-serif';
  ctx.textAlign = 'center';
  // Wrap long titles
  wrapText(ctx, data.challengeTitle, W / 2, 660, W - 160, 90);

  // ── Progress ring ──
  const cx = W / 2;
  const cy = 1000;
  const r  = 200;
  const sw = 18;

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = sw;
  ctx.stroke();

  // Progress arc
  const startAngle = -Math.PI / 2;
  const endAngle   = startAngle + progress * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = theme.primaryColor;
  ctx.lineWidth = sw;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Day count inside ring
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 100px "Syne", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${data.currentDay}`, cx, cy + 30);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '40px "Syne", system-ui, sans-serif';
  ctx.fillText(`of ${data.totalDays} days`, cx, cy + 90);

  // ── Streak badge ──
  const bx = W / 2;
  const by = 1260;
  roundRect(ctx, bx - 140, by - 54, 280, 80, 40);
  ctx.fillStyle = 'rgba(249,115,22,0.18)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(249,115,22,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 40px "Syne", system-ui, sans-serif';
  ctx.fillStyle = '#fb923c';
  ctx.textAlign = 'center';
  ctx.fillText(`🔥  ${data.streakCount} day streak`, bx, by + 8);

  // ── Milestone message ──
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '38px "Syne", system-ui, sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, `"${data.milestoneMessage}"`, W / 2, 1400, W - 200, 56);

  // ── Divider ──
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(160, 1560);
  ctx.lineTo(W - 160, 1560);
  ctx.stroke();

  // ── User name ──
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '34px "Syne", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.userName, W / 2, 1640);

  // ── Watermark ──
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '28px "Syne", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated on Lumio · lumio.app', W / 2, 1820);

  // ── Bottom border ──
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 1860);
  ctx.lineTo(W - 80, 1860);
  ctx.stroke();
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Preview Card (React/CSS version for in-app display) ─────────────────────

function PreviewCard({ data }: { data: ProgressCardData }) {
  const theme = getNicheTheme(data.nicheId);
  const progress = Math.round((data.currentDay / data.totalDays) * 100);

  const R = 52;
  const STROKE = 6;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (progress / 100) * CIRC;

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden p-8 flex flex-col items-center gap-5"
      style={{
        background: `linear-gradient(160deg, #0d0c0a 0%, ${theme.bgTint.replace('0.07','0.25')} 50%, #0d0c0a 100%)`,
        border: `1.5px solid ${theme.borderColor}`,
        boxShadow: `0 0 40px ${theme.glowColor}`,
        aspectRatio: '9/16',
        fontFamily: 'Syne, system-ui, sans-serif',
      }}
    >
      {/* Grid dots */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      {/* Logo */}
      <p className="text-lg font-black tracking-[0.3em] relative z-10" style={{ color: theme.primaryColor }}>
        LUMIO
      </p>

      {/* Niche icon */}
      <div className="text-6xl relative z-10">{theme.icon}</div>

      {/* Niche label */}
      <p className="text-xs font-bold uppercase tracking-widest relative z-10" style={{ color: theme.primaryColor }}>
        {theme.label}
      </p>

      {/* Challenge title */}
      <p className="text-center text-xl font-black text-white relative z-10 leading-tight">
        {data.challengeTitle}
      </p>

      {/* Progress ring */}
      <div className="relative flex items-center justify-center relative z-10" style={{ width: 120, height: 120 }}>
        <svg width={120} height={120} className="rotate-[-90deg]">
          <circle cx={60} cy={60} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
          <circle
            cx={60} cy={60} r={R} fill="none"
            stroke={theme.primaryColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-black text-white">{data.currentDay}</span>
          <span className="text-[9px] text-white/40">of {data.totalDays}</span>
        </div>
      </div>

      {/* Streak */}
      <div
        className="px-4 py-1.5 rounded-full text-sm font-bold relative z-10"
        style={{ background: 'rgba(249,115,22,0.18)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }}
      >
        🔥 {data.streakCount} day streak
      </div>

      {/* Milestone message */}
      <p className="text-center text-xs text-white/55 italic leading-relaxed relative z-10 px-2">
        "{data.milestoneMessage}"
      </p>

      {/* Divider */}
      <div className="w-full h-px relative z-10" style={{ background: 'rgba(255,255,255,0.07)' }} />

      {/* User + watermark */}
      <div className="flex flex-col items-center gap-0.5 relative z-10">
        <p className="text-xs text-white/50">{data.userName}</p>
        <p className="text-[9px] text-white/20">Generated on Lumio · lumio.app</p>
      </div>
    </div>
  );
}

// ─── Main ProgressCard component ─────────────────────────────────────────────

export function ProgressCard({ data, previewMode = false, shareUrl, onClose }: ProgressCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [copied, setCopied] = useState(false);
  const theme = getNicheTheme(data.nicheId);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;
    setRendering(true);
    try {
      await renderCardToCanvas(canvasRef.current, data);
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumio-${data.nicheId}-day${data.currentDay}.png`;
      a.click();
    } finally {
      setRendering(false);
    }
  }, [data]);

  const handleTwitter = useCallback(async () => {
    const text = encodeURIComponent(
      `Day ${data.currentDay}/${data.totalDays} of my ${data.challengeTitle} challenge on Lumio 🚀 ${data.streakCount} day streak!\n\n${shareUrl ?? 'https://lumio.app'}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  }, [data, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    const url = shareUrl ?? `https://lumio.app/challenges/${data.nicheId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, data.nicheId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Preview */}
      <PreviewCard data={data} />

      {/* Hidden canvas for full-res render */}
      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {/* Action buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDownload}
          disabled={rendering}
          className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: theme.gradientCss.includes('linear') ? theme.primaryColor : theme.primaryColor, color: '#000' }}
        >
          {rendering ? (
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block">
              ⟳
            </motion.span>
          ) : '⬇'}
          {rendering ? 'Rendering…' : 'Download as Image'}
        </motion.button>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTwitter}
            className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'rgba(29,161,242,0.12)', color: '#1da1f2', border: '1px solid rgba(29,161,242,0.25)' }}
          >
            𝕏 Share
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyLink}
            className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={
              copied
                ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
            }
          >
            {copied ? '✓ Copied' : '🔗 Copy Link'}
          </motion.button>
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-xs text-center py-2"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Close
        </button>
      )}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

export function ProgressCardModal({
  data,
  shareUrl,
  onClose,
}: {
  data: ProgressCardData;
  shareUrl?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="w-full max-w-sm rounded-3xl p-5 overflow-y-auto max-h-[90vh]"
          style={{ background: '#0e0d0b', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Share Your Progress</h3>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">✕</button>
          </div>
          <ProgressCard data={data} shareUrl={shareUrl} onClose={onClose} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
