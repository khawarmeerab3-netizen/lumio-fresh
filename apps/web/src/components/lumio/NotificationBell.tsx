'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id:        string;
  type:      'streak' | 'coach' | 'like' | 'buddy' | 'badge' | 'system';
  title:     string;
  message:   string;
  createdAt: string;
  read:      boolean;
  href?:     string;  // where clicking navigates
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<Notification['type'], string> = {
  streak: '🔥',
  coach:  '🎯',
  like:   '❤️',
  buddy:  '🤝',
  badge:  '🏆',
  system: '✨',
};

const TYPE_COLORS: Record<Notification['type'], string> = {
  streak: '#fb923c',
  coach:  '#a78bfa',
  like:   '#f472b6',
  buddy:  '#60a5fa',
  badge:  '#f59e0b',
  system: '#34d399',
};

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'streak', title: '🔥 Keep your streak alive!',    message: "You haven't logged today yet. 4 days in a row on the line.", createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),   read: false, href: '/challenges' },
  { id: 'n2', type: 'badge',  title: '🏆 New Badge Unlocked!',         message: 'You earned the "Early Bird" badge for 7 morning check-ins.', createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),   read: false, href: '/profile/badges' },
  { id: 'n3', type: 'buddy',  title: 'Sarah completed Day 14!',        message: 'Your buddy Sarah is on a roll — send her some love.',        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),   read: false, href: '/buddies' },
  { id: 'n4', type: 'coach',  title: 'New tip from Coach Alex',        message: '"The morning you skip is the habit you start breaking."',    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),   read: true,  href: '/challenges' },
  { id: 'n5', type: 'like',   title: 'Marcus liked your post',         message: 'Your Day 10 check-in got 3 new reactions.',                  createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),  read: true,  href: '/community' },
  { id: 'n6', type: 'streak', title: 'Weekly streak milestone!',       message: "You've logged 7 days straight. Incredible!",                 createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),  read: true,  href: '/challenges' },
  { id: 'n7', type: 'system', title: 'Welcome to Lumio! 🎉',           message: 'Your journey to becoming 1% better every day starts now.',   createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),  read: true },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)   return 'just now';
  if (diff < 60)  return `${diff}m`;
  const h = Math.round(diff / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({
  notif,
  onClick,
}: {
  notif:   Notification;
  onClick: () => void;
}) {
  const color = TYPE_COLORS[notif.type];
  const icon  = TYPE_ICONS[notif.type];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: 'rgba(245,158,11,0.04)' }}
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors relative"
    >
      {/* Unread dot */}
      {!notif.read && (
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: '#f59e0b' }}
        />
      )}

      {/* Icon circle */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
        style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}40` }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug truncate ${notif.read ? 'text-[#a09060]' : 'text-[#fdfaf3]'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-[#504830] mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
      </div>

      {/* Time */}
      <span className="flex-shrink-0 text-[10px] text-[#3a3020] mt-0.5">{timeAgo(notif.createdAt)}</span>
    </motion.button>
  );
}

// ─── Bell Icon ────────────────────────────────────────────────────────────────

function BellIcon({ ringing }: { ringing: boolean }) {
  return (
    <motion.svg
      animate={ringing ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </motion.svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router       = useRouter();
  const [open,        setOpen]        = useState(false);
  const [notifs,      setNotifs]      = useState<Notification[]>([]);
  const [fetching,    setFetching]    = useState(false);
  const [ringing,     setRinging]     = useState(false);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const prevUnread   = useRef(0);

  const unreadCount = notifs.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json() as { data: Notification[] };
        setNotifs(json.data.slice(0, 10));
      } else {
        setNotifs(DEMO_NOTIFICATIONS);
      }
    } catch {
      setNotifs(DEMO_NOTIFICATIONS);
    } finally {
      setFetching(false);
    }
  }, []);

  // Poll for new notifications every 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Ring bell when new unread arrives
  useEffect(() => {
    if (unreadCount > prevUnread.current && prevUnread.current !== 0) {
      setRinging(true);
      setTimeout(() => setRinging(false), 600);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) fetchNotifications();
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true }),
      });
    } catch { /* optimistic update already applied */ }
  };

  const handleNotifClick = async (notif: Notification) => {
    // Mark this one read
    setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [notif.id] }),
      });
    } catch { /* optimistic update already applied */ }

    setOpen(false);
    if (notif.href) router.push(notif.href);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
          ${open
            ? 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]'
            : 'bg-[#100e0a] text-[#a09060] hover:text-[#fdfaf3] hover:bg-[#1a1610]'
          } border border-[#2a2418]`}
      >
        <BellIcon ringing={ringing} />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#f59e0b] text-black text-[10px] font-bold flex items-center justify-center px-1 shadow-sm shadow-[rgba(245,158,11,0.5)]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-12 w-80 rounded-2xl border border-[#2a2418] overflow-hidden shadow-2xl shadow-black/60"
            style={{ backgroundColor: '#100e0a', zIndex: 100 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1a14]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#fdfaf3] font-[Syne] text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(245,158,11,0.2)] text-[#f59e0b] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#a09060] hover:text-[#f59e0b] transition-colors font-semibold"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-[#1e1a14]">
              {fetching && notifs.length === 0 ? (
                <div className="py-8 flex items-center justify-center gap-2 text-[#504830]">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : notifs.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-[#a09060] text-sm font-semibold">You&apos;re all caught up!</p>
                  <p className="text-[#504830] text-xs mt-1">No new notifications</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <NotificationItem key={n.id} notif={n} onClick={() => handleNotifClick(n)} />
                ))
              )}
            </div>

            {/* Footer */}
            {notifs.length > 0 && (
              <div className="border-t border-[#1e1a14] px-4 py-2.5">
                <button
                  onClick={() => { setOpen(false); router.push('/notifications'); }}
                  className="w-full text-xs text-[#a09060] hover:text-[#f59e0b] transition-colors text-center font-semibold py-1"
                >
                  View all notifications →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
