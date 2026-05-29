'use client';

// ─── apps/web/src/app/(app)/memory/[challengeId]/page.tsx ────────────────────
// Memory Pack page.
// - If pack not active → purchase CTA with pricing table
// - If pack active → photo/video capture, past-days grid, storage indicator

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  Trash2,
  Film,
  HardDrive,
  CheckCircle,
  Loader2,
  ChevronRight,
  Lock,
  Play,
  Square,
  AlertCircle,
} from 'lucide-react';
import {
  saveDayMedia,
  getDayMedia,
  getAllChallengeMedia,
  deleteDayMedia,
  getStorageUsage,
  getPackSettings,
  savePackSettings,
} from '@/lib/memory-storage';
import type { PackSettingsRecord } from '@/lib/memory-storage';

// ── Memory pack pricing tiers (from AGENT.md) ────────────────────────────────
const MEMORY_PACK_TIERS = [
  { days: 3,   price: 0,    label: 'FREE', highlight: false, badge: 'Try it free' },
  { days: 7,   price: 2,    label: '$2',   highlight: false, badge: 'Most popular' },
  { days: 15,  price: 3,    label: '$3',   highlight: true,  badge: 'Best value' },
  { days: 30,  price: 5,    label: '$5',   highlight: false, badge: null },
  { days: 60,  price: 8,    label: '$8',   highlight: false, badge: null },
  { days: 90,  price: 12,   label: '$12',  highlight: false, badge: null },
  { days: 180, price: 18,   label: '$18',  highlight: false, badge: null },
  { days: 365, price: 25,   label: '$25',  highlight: false, badge: 'Full year' },
] as const;

// Max video recording duration in milliseconds
const MAX_VIDEO_MS = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayMedia {
  day: number;
  photos: File[];
  videos: File[];
  date: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileToObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

function formatMb(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Purchase CTA ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function PurchaseCTA({ challengeId }: { challengeId: string }) {
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(days: number, price: number) {
    setPurchasing(days);
    setError(null);

    try {
      if (price === 0) {
        // Free tier — activate locally immediately
        await savePackSettings({
          challengeId,
          packActive: true,
          durationDays: days,
          purchasedAt: new Date().toISOString(),
        });
        // Reload page to show capture UI
        window.location.reload();
        return;
      }

      // Paid tier — call backend to get LemonSqueezy checkout URL
      const res = await fetch('/api/payments/memory-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, durationDays: days }),
        credentials: 'include',
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to create checkout session');
      }

      const { data } = await res.json() as { data: { checkoutUrl: string } };
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPurchasing(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20">
            <Film className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Memory Pack
          </h1>
          <p className="mt-2 text-slate-400">
            Capture photos &amp; videos every day, then compile your journey into a shareable reel.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          {[
            '📸 Photo capture per day',
            '🎥 10-second video clips',
            '🎬 Compile into a Story Reel',
            '💾 Stored privately on your device',
            '🎵 Add background music',
            '✨ Lumio branded intro + outro',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300">
              <span>{f.slice(0, 2)}</span>
              <span>{f.slice(3)}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Pricing grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MEMORY_PACK_TIERS.map(tier => (
            <motion.button
              key={tier.days}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePurchase(tier.days, tier.price)}
              disabled={purchasing !== null}
              className={[
                'relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all',
                tier.highlight
                  ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                purchasing === tier.days ? 'opacity-70' : '',
              ].join(' ')}
            >
              {tier.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {tier.badge}
                </span>
              )}

              <span className="mt-1 text-2xl font-bold text-white">
                {tier.days}
              </span>
              <span className="text-xs text-slate-400">days</span>

              <span className={`mt-2 text-lg font-semibold ${tier.highlight ? 'text-purple-300' : 'text-white'}`}>
                {tier.label}
              </span>

              {purchasing === tier.days && (
                <Loader2 className="mt-2 h-4 w-4 animate-spin text-purple-400" />
              )}
            </motion.button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          All media stored locally on your device. No cloud upload. No subscription required.
        </p>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Active Pack UI ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ActivePackUI({
  challengeId,
  pack,
}: {
  challengeId: string;
  pack: PackSettingsRecord;
}) {
  const router = useRouter();

  // Today's captures
  const [todayPhotos, setTodayPhotos] = useState<File[]>([]);
  const [todayVideo, setTodayVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Past days
  const [allMedia, setAllMedia] = useState<DayMedia[]>([]);

  // Storage
  const [storage, setStorage] = useState<{ usedMb: number; limitMb: number } | null>(null);

  // Video recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Current day number (derived from pack purchase date)
  const currentDay = Math.max(
    1,
    Math.ceil(
      (Date.now() - new Date(pack.purchasedAt ?? Date.now()).getTime()) /
        86_400_000
    )
  );

  // Load existing media on mount
  useEffect(() => {
    async function load() {
      const [today, all, stor] = await Promise.all([
        getDayMedia(challengeId, currentDay),
        getAllChallengeMedia(challengeId),
        getStorageUsage(),
      ]);

      if (today) {
        setTodayPhotos(today.photos);
        if (today.videos[0]) {
          setTodayVideo(today.videos[0]);
          setVideoPreviewUrl(fileToObjectURL(today.videos[0]));
        }
      }
      setAllMedia(all.filter(d => d.day !== currentDay));
      setStorage(stor);
    }
    void load();
  }, [challengeId, currentDay]);

  // ── Photo capture ──────────────────────────────────────────────────────────
  function handlePhotoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    setTodayPhotos(prev => [...prev, ...files].slice(0, 3));
    setSaveStatus('idle');
  }

  // ── Video recording ────────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `day-${currentDay}-video.webm`, { type: 'video/webm' });
        setTodayVideo(file);
        setVideoPreviewUrl(URL.createObjectURL(blob));
        setSaveStatus('idle');
        streamRef.current?.getTracks().forEach(t => t.stop());
      };

      recorder.start(100); // collect chunks every 100ms
      setIsRecording(true);
      setRecordingMs(0);

      // Auto-stop at MAX_VIDEO_MS
      timerRef.current = setInterval(() => {
        setRecordingMs(prev => {
          const next = prev + 100;
          if (next >= MAX_VIDEO_MS) {
            stopRecording();
            return MAX_VIDEO_MS;
          }
          return next;
        });
      }, 100);
    } catch {
      alert('Camera access is required for video recording. Please allow camera permissions.');
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  // ── Save today's media ─────────────────────────────────────────────────────
  async function handleSave() {
    if (todayPhotos.length === 0 && !todayVideo) return;
    setSaveStatus('saving');

    try {
      await saveDayMedia(
        challengeId,
        currentDay,
        todayPhotos,
        todayVideo ? [todayVideo] : []
      );
      const stor = await getStorageUsage();
      setStorage(stor);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }

  // ── Delete a past day ──────────────────────────────────────────────────────
  async function handleDeleteDay(day: number) {
    await deleteDayMedia(challengeId, day);
    setAllMedia(prev => prev.filter(d => d.day !== day));
    const stor = await getStorageUsage();
    setStorage(stor);
  }

  const recordingPct = (recordingMs / MAX_VIDEO_MS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Memory Pack
            </h1>
            <p className="text-sm text-slate-400">
              {pack.durationDays}-day pack · Day {currentDay}
            </p>
          </div>
          <button
            onClick={() => router.push(`/memory/${challengeId}/create-reel`)}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            <Film className="h-4 w-4" />
            Create Reel
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Storage indicator */}
        {storage && (
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5" />
                Storage
              </span>
              <span>
                Using {formatMb(storage.usedMb)} of ~{formatMb(storage.limitMb)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{
                  width: `${Math.min(100, (storage.usedMb / storage.limitMb) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Today's capture ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Day {currentDay} — Today
          </h2>

          {/* Photos */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Photos</span>
              <span className="text-xs text-slate-500">{todayPhotos.length}/3</span>
            </div>

            <div className="flex gap-2">
              {/* Thumbnails */}
              {todayPhotos.map((photo, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileToObjectURL(photo)}
                    alt={`Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => setTodayPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}

              {/* Add photo button */}
              {todayPhotos.length < 3 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-slate-500 transition hover:border-purple-500 hover:bg-purple-500/10 hover:text-purple-400">
                  <Camera className="h-6 w-6" />
                  <span className="mt-1 text-[10px]">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoInput}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Video */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Video Clip</span>
              <span className="text-xs text-slate-500">max 10s</span>
            </div>

            {videoPreviewUrl ? (
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video
                  src={videoPreviewUrl}
                  controls
                  playsInline
                  className="h-36 w-full object-cover"
                />
                <button
                  onClick={() => { setTodayVideo(null); setVideoPreviewUrl(null); }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            ) : isRecording ? (
              <div className="space-y-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-red-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    Recording...
                  </span>
                  <span className="font-mono text-white">
                    {((MAX_VIDEO_MS - recordingMs) / 1000).toFixed(1)}s left
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{ width: `${recordingPct}%` }}
                  />
                </div>
                <button
                  onClick={stopRecording}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white"
                >
                  <Square className="h-3.5 w-3.5 fill-white" />
                  Stop Recording
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-4 text-sm text-slate-400 transition hover:border-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
              >
                <Video className="h-5 w-5" />
                Record Video (max 10s)
              </button>
            )}
          </div>

          {/* Save button */}
          <AnimatePresence mode="wait">
            {saveStatus === 'saved' ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600/20 py-3 text-sm font-semibold text-green-400"
              >
                <CheckCircle className="h-4 w-4" />
                Saved to device!
              </motion.div>
            ) : (
              <motion.button
                key="save"
                whileTap={{ scale: 0.98 }}
                onClick={() => void handleSave()}
                disabled={
                  (todayPhotos.length === 0 && !todayVideo) ||
                  saveStatus === 'saving'
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save Today&apos;s Memories
              </motion.button>
            )}
          </AnimatePresence>

          {saveStatus === 'error' && (
            <p className="mt-2 text-center text-xs text-red-400">
              Save failed — please try again.
            </p>
          )}
        </section>

        {/* ── Past days grid ──────────────────────────────────────────────── */}
        {allMedia.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Past Days
            </h2>
            <div className="space-y-3">
              {allMedia.map(d => (
                <div
                  key={d.day}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-sm font-bold text-purple-300">
                    {d.day}
                  </div>

                  {/* Thumbnails */}
                  <div className="flex flex-1 gap-1.5 overflow-hidden">
                    {d.photos.slice(0, 3).map((p, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={fileToObjectURL(p)}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ))}
                    {d.videos[0] && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/40">
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                      </div>
                    )}
                    {d.photos.length === 0 && d.videos.length === 0 && (
                      <span className="text-xs text-slate-500">No media</span>
                    )}
                  </div>

                  <button
                    onClick={() => void handleDeleteDay(d.day)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:bg-red-500/20 hover:text-red-400"
                    title="Delete day"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main Page ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export default function MemoryPage() {
  const params = useParams<{ challengeId: string }>();
  const challengeId = params.challengeId;

  const [pack, setPack] = useState<PackSettingsRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPackStatus() {
      // 1. Check IndexedDB local settings first (instant)
      const localSettings = await getPackSettings(challengeId);

      if (localSettings.packActive) {
        setPack(localSettings);
        setLoading(false);
        return;
      }

      // 2. Verify against server (handles webhook-activated packs)
      try {
        const res = await fetch(`/api/payments/status?challengeId=${challengeId}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const { data } = await res.json() as {
            data: { packActive: boolean; durationDays: number; purchasedAt: string | null };
          };

          if (data.packActive) {
            const settings: PackSettingsRecord = {
              challengeId,
              packActive: true,
              durationDays: data.durationDays,
              purchasedAt: data.purchasedAt ?? new Date().toISOString(),
            };
            await savePackSettings(settings);
            setPack(settings);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Network failure — fall through to show purchase CTA
      }

      // Not active
      setPack({ challengeId, packActive: false, durationDays: 0, purchasedAt: null });
      setLoading(false);
    }

    void checkPackStatus();
  }, [challengeId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!pack?.packActive) {
    return <PurchaseCTA challengeId={challengeId} />;
  }

  return <ActivePackUI challengeId={challengeId} pack={pack} />;
}
