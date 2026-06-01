'use client';

// ─── apps/web/src/app/(app)/memory/[challengeId]/create-reel/page.tsx ────────
// Reel creation page.
// Loads all media from IndexedDB → compiles via FFmpeg.wasm →
// Produces branded 1080×1920 MP4 with intro, outro, watermark.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Music,
  Play,
  Square,
  Download,
  Share2,
  Loader2,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';
import { getAllChallengeMedia } from '@/lib/memory-storage';

// ── Music tracks ──────────────────────────────────────────────────────────────

interface MusicTrack {
  id: string;
  name: string;
  vibe: string;
  emoji: string;
  // In production these point to /public/music/*.mp3
  previewUrl: string;
}

const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'energetic',    name: 'Energetic',    vibe: 'High-energy beats',        emoji: '⚡',  previewUrl: '/music/energetic-preview.mp3' },
  { id: 'calm',         name: 'Calm',          vibe: 'Peaceful and reflective',  emoji: '🌊',  previewUrl: '/music/calm-preview.mp3' },
  { id: 'motivational', name: 'Motivational',  vibe: 'Rise and conquer',         emoji: '🔥',  previewUrl: '/music/motivational-preview.mp3' },
  { id: 'upbeat',       name: 'Upbeat',        vibe: 'Feel-good energy',         emoji: '🎉',  previewUrl: '/music/upbeat-preview.mp3' },
  { id: 'cinematic',    name: 'Cinematic',     vibe: 'Epic movie moments',       emoji: '🎬',  previewUrl: '/music/cinematic-preview.mp3' },
];

// ── FFmpeg progress stages ────────────────────────────────────────────────────

type CompileStage =
  | 'idle'
  | 'loading-ffmpeg'
  | 'reading-media'
  | 'building-slides'
  | 'adding-audio'
  | 'rendering'
  | 'finalising'
  | 'done'
  | 'error';

interface StageInfo {
  label: string;
  pct: number; // rough percentage for display
}

const STAGE_INFO: Record<CompileStage, StageInfo> = {
  'idle':           { label: 'Ready to compile',           pct: 0 },
  'loading-ffmpeg': { label: 'Loading video engine…',      pct: 8 },
  'reading-media':  { label: 'Loading your memories…',     pct: 18 },
  'building-slides':{ label: 'Building slideshow…',        pct: 40 },
  'adding-audio':   { label: 'Adding music…',              pct: 60 },
  'rendering':      { label: 'Rendering video…',           pct: 80 },
  'finalising':     { label: 'Adding Lumio watermark…',    pct: 95 },
  'done':           { label: 'Your reel is ready!',        pct: 100 },
  'error':          { label: 'Compilation failed',         pct: 0 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert File → Uint8Array for FFmpeg.wasm writeFile */
async function fileToUint8Array(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

/** Format seconds as mm:ss */
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main Page ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export default function CreateReelPage() {
  const params = useParams<{ challengeId: string }>();
  const router = useRouter();
  const challengeId = params.challengeId;

  // Media preview counts
  const [mediaSummary, setMediaSummary] = useState<{
    totalDays: number;
    totalPhotos: number;
    totalVideos: number;
    estimatedDuration: number; // seconds
  } | null>(null);

  // Music selection
  const [selectedTrack, setSelectedTrack] = useState<string>('motivational');
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  // Compilation state
  const [stage, setStage] = useState<CompileStage>('idle');
  const [progress, setProgress] = useState(0); // 0–100 from FFmpeg logs
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Output
  const [reelUrl, setReelUrl] = useState<string | null>(null);
  const [reelBlob, setReelBlob] = useState<Blob | null>(null);

  // FFmpeg instance ref (lazy-loaded)
  // We use `unknown` and cast inside the compile function to avoid importing
  // @ffmpeg/ffmpeg types at the top level — the package is loaded dynamically.
  const ffmpegRef = useRef<unknown>(null);

  // ── Load media preview on mount ────────────────────────────────────────────
  useEffect(() => {
    async function loadSummary() {
      const all = await getAllChallengeMedia(challengeId);
      const totalPhotos = all.reduce((s, d) => s + d.photos.length, 0);
      const totalVideos = all.reduce((s, d) => s + d.videos.length, 0);
      // Estimate: 3s intro + 2s per photo + 5s per video + 3s outro
      const estimatedDuration = 3 + totalPhotos * 2 + totalVideos * 5 + 3;
      setMediaSummary({
        totalDays: all.length,
        totalPhotos,
        totalVideos,
        estimatedDuration,
      });
    }
    void loadSummary();
  }, [challengeId]);

  // ── Music preview ──────────────────────────────────────────────────────────
  function togglePreview(track: MusicTrack) {
    if (playingPreview === track.id) {
      previewAudio?.pause();
      setPlayingPreview(null);
      return;
    }

    previewAudio?.pause();
    const audio = new Audio(track.previewUrl);
    audio.volume = 0.6;
    audio.play().catch(() => {/* preview file may not exist in dev */});
    audio.onended = () => setPlayingPreview(null);
    setPreviewAudio(audio);
    setPlayingPreview(track.id);
  }

  // ── FFmpeg.wasm compilation ────────────────────────────────────────────────
  const compileReel = useCallback(async () => {
    setStage('loading-ffmpeg');
    setProgress(STAGE_INFO['loading-ffmpeg'].pct);
    setErrorMsg(null);

    try {
      // ── 1. Lazy-load FFmpeg.wasm ────────────────────────────────────────
      // Dynamic import keeps the 30 MB WASM binary out of the initial bundle.
      const { FFmpeg } = await import('@ffmpeg/ffmpeg') as unknown as {
        FFmpeg: new () => {
          on: (event: string, cb: (data: { progress: number }) => void) => void;
          load: (opts: { coreURL: string; wasmURL: string }) => Promise<void>;
          writeFile: (name: string, data: Uint8Array) => Promise<void>;
          exec: (args: string[]) => Promise<void>;
          readFile: (name: string) => Promise<Uint8Array>;
        };
      };
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util') as {
        fetchFile: (src: string | File | Blob) => Promise<Uint8Array>;
        toBlobURL: (url: string, type: string) => Promise<string>;
      };

      if (!ffmpegRef.current) {
        const ff = new FFmpeg();

        // Wire up real-time progress
        ff.on('progress', ({ progress: pct }: { progress: number }) => {
          // FFmpeg reports 0–1; map to our 60–95 range during render stage
          const mapped = 60 + Math.round(pct * 35);
          setProgress(Math.min(95, mapped));
        });

        // Load core + wasm from CDN (next.config.js headers allow SharedArrayBuffer)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ff.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegRef.current = ff;
      }

      // Convenience alias with the type we know it has
      const ff = ffmpegRef.current as any;

      // ── 2. Load all media from IndexedDB ───────────────────────────────
      setStage('reading-media');
      setProgress(STAGE_INFO['reading-media'].pct);

      const allMedia = await getAllChallengeMedia(challengeId);

      if (allMedia.length === 0) {
        throw new Error('No media found. Capture some photos or videos first!');
      }

      // ── 3. Write each photo/video into FFmpeg virtual FS ───────────────
      setStage('building-slides');
      setProgress(STAGE_INFO['building-slides'].pct);

      // We build a concat list: intro.png (3s) + slides + outro.png (3s)
      // For a real production build: use actual branded intro/outro images
      // loaded from /public/brand/intro.png and /public/brand/outro.png

      const concatLines: string[] = [];
      let fileIndex = 0;

      // Intro frame (3 seconds)
      // In production, replace with fetchFile('/brand/intro.png')
      const introResponse = await fetch('/brand/intro.png').catch(() => null);
      if (introResponse?.ok) {
        const introData = new Uint8Array(await introResponse.arrayBuffer());
        await (ff as unknown as { writeFile: (n: string, d: Uint8Array) => Promise<void> }).writeFile('intro.png', introData);
        concatLines.push(`file 'intro.png'`);
        concatLines.push(`duration 3`);
      }

      // Each day's media
      for (const dayMedia of allMedia) {
        // Photos — 2s each
        for (const photo of dayMedia.photos) {
          const name = `photo_${fileIndex++}.jpg`;
          await (ff as unknown as { writeFile: (n: string, d: Uint8Array) => Promise<void> }).writeFile(name, await fileToUint8Array(photo));
          concatLines.push(`file '${name}'`);
          concatLines.push(`duration 2`);
        }

        // Videos — actual duration (we use 5s as estimate; FFmpeg determines real length)
        for (const video of dayMedia.videos) {
          const name = `video_${fileIndex++}.webm`;
          await (ff as unknown as { writeFile: (n: string, d: Uint8Array) => Promise<void> }).writeFile(name, await fileToUint8Array(video));
          concatLines.push(`file '${name}'`);
          // No duration line for videos — FFmpeg reads actual duration
        }
      }

      // Outro frame (3 seconds)
      const outroResponse = await fetch('/brand/outro.png').catch(() => null);
      if (outroResponse?.ok) {
        const outroData = new Uint8Array(await outroResponse.arrayBuffer());
        await (ff as unknown as { writeFile: (n: string, d: Uint8Array) => Promise<void> }).writeFile('outro.png', outroData);
        concatLines.push(`file 'outro.png'`);
        concatLines.push(`duration 3`);
      }

      // Write concat list
      const concatText = concatLines.join('\n');
      const encoder = new TextEncoder();
      await (ff as unknown as { writeFile: (n: string, d: Uint8Array) => Promise<void> }).writeFile(
        'concat.txt',
        encoder.encode(concatText)
      );

      // ── 4. Add audio ───────────────────────────────────────────────────
      setStage('adding-audio');
      setProgress(STAGE_INFO['adding-audio'].pct);

      const musicPath = `/music/${selectedTrack}.mp3`;
      const musicResponse = await fetch(musicPath).catch(() => null);
      const hasAudio = !!musicResponse?.ok;

      if (hasAudio) {
        const musicData = new Uint8Array(await musicResponse!.arrayBuffer());
        await (ff as unknown as { writeFile: (n: string, d: Uint8Array) => Promise<void> }).writeFile('music.mp3', musicData);
      }

      // ── 5. Render — FFmpeg concat + scale + watermark ──────────────────
      setStage('rendering');
      setProgress(STAGE_INFO['rendering'].pct);

      // Watermark text drawn via drawtext filter — no image file needed
      // "Lumio" bottom-right, semi-transparent white, 36px
      const watermarkFilter =
        "drawtext=text='Lumio':fontcolor=white@0.6:fontsize=36:x=w-tw-20:y=h-th-20:shadowcolor=black@0.5:shadowx=2:shadowy=2";

      // Scale to 1080×1920 (TikTok/Instagram Reels vertical format)
      const scaleFilter = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black';

      const videoFilter = `[0:v]${scaleFilter},${watermarkFilter}[vout]`;

      const ffArgs = hasAudio
        ? [
            '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
            '-i', 'music.mp3',
            '-filter_complex', videoFilter,
            '-map', '[vout]',
            '-map', '1:a',
            '-c:v', 'libx264',
            '-preset', 'ultrafast', // faster compile in browser; use 'medium' for quality
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-shortest',             // trim audio to video length
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p',
            'output.mp4',
          ]
        : [
            '-f', 'concat', '-safe', '0', '-i', 'concat.txt',
            '-filter_complex', videoFilter,
            '-map', '[vout]',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p',
            'output.mp4',
          ];

      await (ff as unknown as { exec: (args: string[]) => Promise<void> }).exec(ffArgs);

      // ── 6. Read output + create download URL ──────────────────────────
      setStage('finalising');
      setProgress(STAGE_INFO['finalising'].pct);

      const outputData = await (ff as unknown as { readFile: (n: string) => Promise<Uint8Array> }).readFile('output.mp4');
      const blob = new Blob([outputData as any], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      setReelBlob(blob);
      setReelUrl(url);
      setStage('done');
      setProgress(100);
    } catch (err: unknown) {
      console.error('[create-reel] Compilation failed:', err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Compilation failed. Please try again.'
      );
      setStage('error');
      setProgress(0);
    }
  }, [challengeId, selectedTrack]);

  // ── Share handlers ─────────────────────────────────────────────────────────
  function handleDownload() {
    if (!reelUrl) return;
    const a = document.createElement('a');
    a.href = reelUrl;
    a.download = `lumio-challenge-reel.mp4`;
    a.click();
  }

  async function handleShare(platform: 'instagram' | 'tiktok') {
    if (!reelBlob) return;

    if (navigator.share && navigator.canShare?.({ files: [new File([reelBlob], 'reel.mp4', { type: 'video/mp4' })] })) {
      try {
        await navigator.share({
          files: [new File([reelBlob], 'lumio-reel.mp4', { type: 'video/mp4' })],
          title: 'My Lumio Challenge Journey',
          text: platform === 'tiktok'
            ? '🔥 Just crushed my challenge! Watch my journey 👇 #Lumio #Challenge'
            : '✨ Illuminating my growth with @lumio.app 🌟',
        });
      } catch {
        // User cancelled or not supported — fall back to download
        handleDownload();
      }
    } else {
      // Mobile Web Share API not available — download instead
      handleDownload();
      alert(`Downloaded your reel! Open ${platform === 'instagram' ? 'Instagram Reels' : 'TikTok'} and upload the video from your Photos.`);
    }
  }

  const isCompiling = !['idle', 'done', 'error'].includes(stage);
  const stageInfo = STAGE_INFO[stage];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-8">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Memory
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
            <Film className="h-7 w-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Create My Story Reel
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Compile your journey into a shareable video
          </p>
        </div>

        {/* Media preview summary */}
        {mediaSummary && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-2xl font-bold text-white">{mediaSummary.totalDays}</p>
              <p className="text-xs text-slate-400">Days</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                <p className="text-2xl font-bold text-white">{mediaSummary.totalPhotos}</p>
              </div>
              <p className="text-xs text-slate-400">Photos</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <VideoIcon className="h-3.5 w-3.5 text-purple-400" />
                <p className="text-2xl font-bold text-white">{mediaSummary.totalVideos}</p>
              </div>
              <p className="text-xs text-slate-400">Clips</p>
            </div>
          </div>
        )}

        {mediaSummary && (
          <div className="rounded-xl bg-white/5 px-4 py-3 text-center text-sm text-slate-400">
            Estimated reel length:{' '}
            <span className="font-semibold text-white">
              ~{formatDuration(mediaSummary.estimatedDuration)}
            </span>
            {' '}· 3s Lumio intro + content + 3s outro
          </div>
        )}

        {/* Music selector */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <Music className="h-4 w-4" />
            Background Music
          </h2>
          <div className="space-y-2">
            {MUSIC_TRACKS.map(track => (
              <div
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={[
                  'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all',
                  selectedTrack === track.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ].join(' ')}
              >
                <span className="text-xl">{track.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{track.name}</p>
                  <p className="text-xs text-slate-400">{track.vibe}</p>
                </div>

                {/* Play preview button */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePreview(track); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-white/20"
                >
                  {playingPreview === track.id
                    ? <Square className="h-3 w-3 fill-current" />
                    : <Play className="h-3 w-3 fill-current" />
                  }
                </button>

                {selectedTrack === track.id && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-purple-400" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Branding note */}
        <div className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-xs text-slate-400">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
          <span>
            Your reel will include a{' '}
            <span className="text-white">3s Lumio branded intro</span>, your daily moments, a{' '}
            <span className="text-white">3s outro</span> reading "Challenge Complete on Lumio", and a{' '}
            <span className="text-white">Lumio watermark</span> on every frame.
          </span>
        </div>

        {/* Compile button + progress */}
        <AnimatePresence mode="wait">
          {stage === 'done' ? (
            // ── Download + share buttons ───────────────────────────────────
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 rounded-xl bg-green-600/20 py-3 text-sm font-semibold text-green-400">
                <CheckCircle className="h-4 w-4" />
                Your reel is ready!
              </div>

              {reelUrl && (
                <video
                  src={reelUrl}
                  controls
                  playsInline
                  className="w-full overflow-hidden rounded-2xl bg-black"
                  style={{ maxHeight: 400 }}
                />
              )}

              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Download Reel (MP4)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => void handleShare('instagram')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Share2 className="h-4 w-4" />
                  Instagram
                </button>
                <button
                  onClick={() => void handleShare('tiktok')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#010101] py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:ring-white/40"
                >
                  <Share2 className="h-4 w-4" />
                  TikTok
                </button>
              </div>

              <button
                onClick={() => { setStage('idle'); setReelUrl(null); setReelBlob(null); }}
                className="w-full rounded-xl py-2 text-sm text-slate-500 transition hover:text-slate-300"
              >
                Recompile with different settings
              </button>
            </motion.div>
          ) : isCompiling ? (
            // ── Progress bar ───────────────────────────────────────────────
            <motion.div
              key="compiling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                <span className="text-sm font-semibold text-white">{stageInfo.label}</span>
              </div>

              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Processing on your device…</span>
                  <span>{progress}%</span>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">
                This runs entirely on your device — no uploads, no server.
              </p>
            </motion.div>
          ) : (
            // ── Compile button ─────────────────────────────────────────────
            <motion.div key="idle" className="space-y-3">
              {stage === 'error' && errorMsg && (
                <div className="flex items-start gap-2 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => void compileReel()}
                disabled={!mediaSummary || mediaSummary.totalDays === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 text-base font-bold text-white shadow-lg shadow-purple-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Film className="h-5 w-5" />
                {stage === 'error' ? 'Retry Compilation' : 'Compile Reel'}
              </motion.button>

              {(!mediaSummary || mediaSummary.totalDays === 0) && (
                <p className="text-center text-xs text-slate-500">
                  No media found. Capture some photos or videos first.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
