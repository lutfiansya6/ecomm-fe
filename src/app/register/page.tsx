'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { useT } from '@/i18n/LanguageProvider';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const { showToast } = useToast();
  const { t } = useT();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('errors.requiredField');
    if (!form.email) e.email = t('errors.requiredField');
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t('errors.invalidEmail');
    if (!form.password) e.password = t('errors.requiredField');
    else if (form.password.length < 6) e.password = t('errors.passwordTooShort');
    if (form.confirm !== form.password) e.confirm = t('errors.passwordMismatch');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      showToast(result.message, 'success');
      router.push('/addresses?onboarding=true');
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
      <div style={{ width: '100%', maxWidth: '440px', animation: 'scaleIn 0.3s both' }}>
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
            {t('account.register.subtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
        >
          {[
            {
              key: 'name',
              label: t('account.register.name'),
              type: 'text',
              placeholder: 'John Doe',
            },
            {
              key: 'email',
              label: t('account.register.email'),
              type: 'email',
              placeholder: 'name@example.com',
            },
          ].map((field) => (
            <div key={field.key} className="input-group">
              <label className="input-label">{field.label}</label>
              <input
                className={`input ${errors[field.key] ? 'error' : ''}`}
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => set(field.key, e.target.value)}
              />
              {errors[field.key] && (
                <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>
                  {errors[field.key]}
                </span>
              )}
            </div>
          ))}

          {[
            {
              key: 'password',
              label: t('account.register.password'),
              placeholder: t('account.register.passwordMinLength'),
            },
            {
              key: 'confirm',
              label: t('account.register.confirmPassword'),
              placeholder: t('account.register.repeatPassword'),
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="input-group">
              <label className="input-label">{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  className={`input ${errors[key] ? 'error' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  style={{ paddingRight: '2.75rem' }}
                />
                {key === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--clr-text-3)',
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
              {errors[key] && (
                <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>
                  {errors[key]}
                </span>
              )}
            </div>
          ))}

          <button
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
                {t('account.register.submit')} <ArrowRight size={16} />
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
          {t('account.register.hasAccount')}{' '}
          <Link href="/login" style={{ color: 'var(--clr-gold)', fontWeight: 600 }}>
            {t('account.register.loginNow')}
          </Link>
        </p>
      </div>
    </div>
  );
}
