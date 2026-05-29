'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

// ─── Schema ───────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof LoginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      // Redirect based on onboarding status (user is fresh from store after login)
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.onboarding_completed) {
        router.push('/app/dashboard');
      } else {
        router.push('/app/onboarding');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || isLoading;

  return (
    <div>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            background: 'var(--gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ☀️ LUMIO
        </div>
        <p
          style={{
            margin: '0.5rem 0 0',
            color: 'var(--text2)',
            fontSize: '0.875rem',
            fontStyle: 'italic',
            fontFamily: 'var(--font-body)',
          }}
        >
          Illuminate Your Growth
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2rem',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 1.5rem',
          }}
        >
          Sign in
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              style={inputStyle}
              disabled={busy}
            />
            {errors.email && <p style={errStyle}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Password</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              style={inputStyle}
              disabled={busy}
            />
            {errors.password && <p style={errStyle}>{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={busy} style={btnStyle(busy)}>
            {busy ? <LoadingDots /> : 'Sign in'}
          </button>
        </form>

        <p
          style={{
            marginTop: '1.25rem',
            textAlign: 'center',
            color: 'var(--text2)',
            fontSize: '0.875rem',
          }}
        >
          No account?{' '}
          <Link
            href="/auth/register"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Loading Dots ─────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            display: 'inline-block',
            animation: `dotBounce 0.8s ${i * 0.15}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.375rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text2)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '0.9375rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

const errStyle: React.CSSProperties = {
  marginTop: '0.25rem',
  fontSize: '0.8rem',
  color: '#f87171',
};

const btnStyle = (busy: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '0.75rem',
  background: busy ? 'var(--bg3)' : 'var(--gradient)',
  border: 'none',
  borderRadius: '8px',
  color: busy ? 'var(--text2)' : '#fff',
  fontFamily: 'var(--font-display)',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: busy ? 'not-allowed' : 'pointer',
  transition: 'opacity 0.2s, transform 0.1s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '2.75rem',
});
