'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

// The browser's deferred install prompt event (not in standard TS lib yet)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const SNOOZE_KEY    = 'lumio:install-prompt-snoozed-until';
const VISITS_KEY    = 'lumio:dashboard-visits';
const INSTALLED_KEY = 'lumio:pwa-installed';
const SNOOZE_DAYS   = 7;
const MIN_VISITS    = 2; // show after this many dashboard visits

// ─── Helpers ─────────────────────────────────────────────────────────────────

function incrementVisits(): number {
  try {
    const current = parseInt(localStorage.getItem(VISITS_KEY) ?? '0', 10);
    const next = current + 1;
    localStorage.setItem(VISITS_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

function isSnoozed(): boolean {
  try {
    const until = localStorage.getItem(SNOOZE_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

function snoozeFor(days: number): void {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
  } catch {
    // ignore
  }
}

function markInstalled(): void {
  try {
    localStorage.setItem(INSTALLED_KEY, 'true');
  } catch {
    // ignore
  }
}

function isAlreadyInstalled(): boolean {
  // Check standalone display mode (already installed as PWA)
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  try {
    return localStorage.getItem(INSTALLED_KEY) === 'true';
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * InstallPrompt — shows a non-intrusive install banner on the dashboard
 * after the user's 2nd visit, respecting a 7-day snooze and not re-showing
 * if already installed.
 *
 * Place this component inside the dashboard layout or page.
 * It renders nothing until all conditions are met.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already installed as a PWA
    if (isAlreadyInstalled()) return;

    // Don't show during snooze window
    if (isSnoozed()) return;

    // Increment visit counter and only show from 2nd visit onward
    const visits = incrementVisits();
    if (visits < MIN_VISITS) return;

    // Detect iOS — Safari doesn't fire beforeinstallprompt; use manual guide instead
    const ua = navigator.userAgent;
    const ios =
      /iphone|ipad|ipod/i.test(ua) &&
      !('MSStream' in window) &&
      !/crios|fxios/i.test(ua); // not Chrome or Firefox on iOS
    setIsIOS(ios);

    if (ios) {
      // On iOS we can only show a "how to install" guide — show it directly
      setVisible(true);
      return;
    }

    // Listen for the deferred prompt (Chrome / Edge / Android)
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for successful installation
    const installedHandler = () => {
      markInstalled();
      setVisible(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        markInstalled();
      }
      deferredPrompt.current = null;
    }
    setVisible(false);
  };

  const handleLater = () => {
    snoozeFor(SNOOZE_DAYS);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install Lumio app"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: 440,
        backgroundColor: '#1c1917',
        border: '1px solid #44403c',
        borderRadius: 16,
        padding: '1rem 1.125rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 9999,
        // Subtle slide-in animation via CSS variable trick
        animation: 'lumio-slide-up 0.3s ease-out',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        🌟
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#f9fafb',
            margin: '0 0 0.25rem',
          }}
        >
          Install Lumio for the best experience
        </p>

        {isIOS ? (
          <p style={{ fontSize: 12, color: '#a8a29e', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
            Tap <strong style={{ color: '#f9fafb' }}>Share</strong> then{' '}
            <strong style={{ color: '#f9fafb' }}>Add to Home Screen</strong> to install.
          </p>
        ) : (
          <p style={{ fontSize: 12, color: '#a8a29e', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
            Works offline, faster, and lives on your home screen.
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isIOS && (
            <button
              onClick={handleInstall}
              style={{
                backgroundColor: '#f59e0b',
                color: '#080706',
                border: 'none',
                borderRadius: 8,
                padding: '0.4rem 0.875rem',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Install
            </button>
          )}
          <button
            onClick={handleLater}
            style={{
              backgroundColor: 'transparent',
              color: '#78716c',
              border: '1px solid #44403c',
              borderRadius: 8,
              padding: '0.4rem 0.875rem',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {isIOS ? 'Got it' : 'Later'}
          </button>
        </div>
      </div>

      {/* Dismiss × */}
      <button
        onClick={handleLater}
        aria-label="Dismiss install prompt"
        style={{
          background: 'none',
          border: 'none',
          color: '#78716c',
          fontSize: 18,
          cursor: 'pointer',
          padding: '0 0.25rem',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Keyframe — injected once via a style tag */}
      <style>{`
        @keyframes lumio-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
