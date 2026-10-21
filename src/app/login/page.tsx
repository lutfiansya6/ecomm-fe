'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { useT } from '@/i18n/LanguageProvider';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { showToast } = useToast();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = t('errors.requiredField');
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = t('errors.invalidEmail');
    if (!password) e.password = t('errors.requiredField');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(email, password);
    if (result.success) {
      showToast(result.message, 'success');
      const params = new URLSearchParams(window.location.search);
      router.push(params.get('redirect') || '/');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at center top, rgba(201,168,76,0.06) 0%, var(--clr-bg) 60%)',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', animation: 'scaleIn 0.3s both' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.5rem',
              letterSpacing: '0.15em',
              color: 'var(--clr-text)',
            }}
          >
            LUXE
          </Link>
          <p
            style={{
              color: 'var(--clr-text-2)',
              marginTop: 'var(--space-2)',
              fontSize: '0.9rem',
            }}
          >
            {t('account.login.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
        >
          <div className="input-group">
            <label className="input-label">{t('account.login.email')}</label>
            <input
              id="login-email"
              className={`input ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: '' }));
              }}
            />
            {errors.email && (
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{errors.email}</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">{t('account.login.password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                className={`input ${errors.password ? 'error' : ''}`}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: '' }));
                }}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--clr-text-3)',
                  transition: 'color var(--transition-fast)',
                }}
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>
                {errors.password}
              </span>
            )}
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <span
                className="animate-spin"
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #000',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
            ) : (
              <>
                {t('account.login.submit')} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-6)',
            fontSize: '0.875rem',
            color: 'var(--clr-text-2)',
          }}
        >
          {t('account.login.noAccount')}{' '}
          <Link href="/register" style={{ color: 'var(--clr-gold)', fontWeight: 600 }}>
            {t('account.login.registerNow')}
          </Link>
        </p>
      </div>
    </div>
  );
}
