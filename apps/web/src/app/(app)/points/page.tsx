'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PointsTransaction {
  id: string;
  type: 'earn' | 'spend' | 'penalty';
  amount: number;
  description: string;
  created_at: string;
}

interface RedemptionOption {
  id: string;
  label: string;
  description: string;
  emoji: string;
  cost: number;
  type: 'plan_starter' | 'plan_pro' | 'plan_elite' | 'theme';
  accentColor: string;
}

const REDEMPTION_OPTIONS: RedemptionOption[] = [
  {
    id: 'starter',
    label: 'Free Starter',
    description: '1 month of Starter plan — 3 challenges, community posting',
    emoji: '🌱',
    cost: 500,
    type: 'plan_starter',
    accentColor: '#22c55e',
  },
  {
    id: 'pro',
    label: 'Free Pro',
    description: '1 month of Pro plan — AI coach, 10 challenges, 8 moods',
    emoji: '🚀',
    cost: 1500,
    type: 'plan_pro',
    accentColor: '#0ea5e9',
  },
  {
    id: 'elite',
    label: 'Free Elite',
    description: '1 month of Elite — unlimited everything, 2x points, SuperSonic',
    emoji: '⚡',
    cost: 5000,
    type: 'plan_elite',
    accentColor: '#f59e0b',
  },
  {
    id: 'theme',
    label: 'Unlock Theme',
    description: 'Unlock any locked mood theme permanently',
    emoji: '🎨',
    cost: 200,
    type: 'theme',
    accentColor: '#a855f7',
  },
];

const TX_ICONS: Record<string, string> = {
  earn: '⬆️',
  spend: '⬇️',
  penalty: '🔻',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return <>{display.toLocaleString()}</>;
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  option,
  balance,
  onConfirm,
  onClose,
}: {
  option: RedemptionOption;
  balance: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: '#131110', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {done ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="text-5xl mb-4"
            >
              🎉
            </motion.div>
            <p className="text-base font-bold text-white mb-1">Redeemed!</p>
            <p className="text-xs text-white/40 mb-5">
              {option.type.startsWith('plan') ? 'Your plan has been upgraded.' : 'Theme unlocked in settings.'}
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: option.accentColor, color: '#000' }}
            >
              Awesome!
            </button>
          </>
        ) : (
          <>
            <span className="text-4xl mb-3 block">{option.emoji}</span>
            <h3 className="text-base font-bold text-white mb-1">{option.label}</h3>
            <p className="text-xs text-white/40 mb-4">{option.description}</p>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="text-sm text-white/50">Cost:</span>
              <span className="text-xl font-black" style={{ color: option.accentColor }}>
                ⭐ {option.cost.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-white/30 mb-5">
              Your balance: ⭐ {balance.toLocaleString()} → ⭐ {(balance - option.cost).toLocaleString()}
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-white/50 border border-white/10">
                Cancel
              </button>
              <button
                onClick={handle}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: option.accentColor, color: '#000' }}
              >
                {loading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PointsPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<RedemptionOption | null>(null);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('lumio_token')}`, 'Content-Type': 'application/json' });

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('lumio_token');
      if (!token) { router.push('/login'); return; }

      const [pointsRes, txRes] = await Promise.all([
        fetch(`${apiUrl}/api/points/balance`, { headers: getHeaders() }),
        fetch(`${apiUrl}/api/points/history`, { headers: getHeaders() }),
      ]);

      const [pointsData, txData] = await Promise.all([pointsRes.json(), txRes.json()]);

      setBalance(pointsData.balance ?? pointsData.points ?? 0);
      setReferralCode(pointsData.referralCode ?? pointsData.referral_code ?? 'LUMIO-????');
      setTransactions(txData.transactions ?? []);
    } catch (err) {
      console.error('Points fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRedeem = async (option: RedemptionOption) => {
    const res = await fetch(`${apiUrl}/api/points/redeem`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type: option.type }),
    });
    if (!res.ok) throw new Error('Redemption failed');
    const data = await res.json();
    setBalance(data.newBalance ?? balance - option.cost);
    await fetchData(); // Refresh transactions
  };

  const copyReferral = async () => {
    const link = `https://lumio.app/join?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080706' }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-amber-500 text-3xl"
        >
          ⭐
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080706', fontFamily: 'Syne, sans-serif' }}>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-24">

        {/* ── Points Balance ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-10 mb-8 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="text-5xl mb-3"
          >
            ⭐
          </motion.div>
          <p className="text-6xl font-black text-white tabular-nums">
            <AnimatedCounter target={balance} />
          </p>
          <p className="text-sm text-white/40 mt-2">Lumio Points</p>
        </motion.div>

        {/* ── Redemption Options ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Redeem Points</h2>
          <div className="grid grid-cols-2 gap-3">
            {REDEMPTION_OPTIONS.map((opt, i) => {
              const canAfford = balance >= opt.cost;
              return (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05 }}
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{
                    background: canAfford ? `${opt.accentColor}10` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${canAfford ? opt.accentColor + '30' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <p className="text-sm font-bold text-white leading-tight">{opt.label}</p>
                  <p className="text-[10px] text-white/35 leading-tight flex-1">{opt.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className="text-xs font-bold"
                      style={{ color: canAfford ? opt.accentColor : 'rgba(255,255,255,0.2)' }}
                    >
                      ⭐ {opt.cost.toLocaleString()}
                    </span>
                    <button
                      onClick={() => canAfford && setSelectedOption(opt)}
                      disabled={!canAfford}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-30 transition-all"
                      style={canAfford ? { background: opt.accentColor, color: '#000' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                    >
                      {canAfford ? 'Redeem' : 'Need more'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Referral Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Refer Friends</h2>
          <p className="text-xs text-white/40 mb-3">Earn ⭐ 150 points for every friend who joins via your link</p>
          <div
            className="flex items-center gap-2 p-3 rounded-xl mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <code className="flex-1 text-sm font-mono text-amber-400 truncate">{referralCode}</code>
            <button
              onClick={copyReferral}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: copied ? '#22c55e' : '#f59e0b', color: '#000' }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={copyReferral}
            className="w-full py-2.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            🔗 Share Referral Link
          </button>
        </motion.div>

        {/* ── Transaction History ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">History</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">No transactions yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-lg flex-shrink-0">{TX_ICONS[tx.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{tx.description}</p>
                    <p className="text-xs text-white/25">{timeAgo(tx.created_at)}</p>
                  </div>
                  <span
                    className="text-sm font-bold flex-shrink-0"
                    style={{ color: tx.amount > 0 ? '#22c55e' : '#ef4444' }}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

      {/* ── Confirm Modal ── */}
      <AnimatePresence>
        {selectedOption && (
          <ConfirmModal
            option={selectedOption}
            balance={balance}
            onConfirm={() => handleRedeem(selectedOption)}
            onClose={() => setSelectedOption(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
