'use client';
// ============================================================
// LUXE E-Commerce - User Address Management Page
// Supports Onboarding, List, Create, Edit, Delete, Set Default with i18n
// ============================================================
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  Home,
  Building,
  Briefcase,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { useT } from '@/i18n/LanguageProvider';
import WilayahSelect, { type WilayahValue } from '@/components/ui/WilayahSelect';
import type { UserAddress } from '@/types';

function AddressesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const { user, token } = useAuthStore();
  const { showToast } = useToast();
  const { t, locale } = useT();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(isOnboarding);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const labelPresets = useMemo(
    () => [
      { key: 'home', label: t('checkout.home'), icon: Home },
      { key: 'office', label: t('checkout.office'), icon: Briefcase },
      { key: 'apartment', label: t('checkout.apartment'), icon: Building },
      { key: 'other', label: t('checkout.other'), icon: MapPin },
    ],
    [t]
  );

  // Form State
  const [form, setForm] = useState({
    labelKey: 'home',
    customLabel: '',
    fullName: user?.name || '',
    phone: '',
    street: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postalCode: '',
    isDefault: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [wilayahErrors, setWilayahErrors] = useState<Partial<Record<keyof WilayahValue, string>>>({});

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/addresses', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.addresses)) {
        setAddresses(data.data.addresses);
        if (data.data.addresses.length === 0) {
          setIsModalOpen(true);
        }
      }
    } catch {
      showToast(t('errors.addressLoadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user, token]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setForm({
      labelKey: 'home',
      customLabel: '',
      fullName: user?.name || '',
      phone: '',
      street: '',
      province: '',
      city: '',
      district: '',
      village: '',
      postalCode: '',
      isDefault: addresses.length === 0,
    });
    setFormErrors({});
    setWilayahErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    const matchedPreset = labelPresets.find(
      (p) => p.label.toLowerCase() === addr.label.toLowerCase()
    );
    setForm({
      labelKey: matchedPreset ? matchedPreset.key : 'other',
      customLabel: matchedPreset ? '' : addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      province: addr.province,
      city: addr.city,
      district: addr.district || '',
      village: addr.village || '',
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setFormErrors({});
    setWilayahErrors({});
    setIsModalOpen(true);
  };

  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = t('errors.requiredField');
    if (!form.phone.trim()) errs.phone = t('errors.requiredField');
    else if (!/^[0-9+\-\s]{8,15}$/.test(form.phone.trim())) {
      errs.phone = '8-15 digits';
    }
    if (!form.street.trim()) errs.street = t('errors.requiredField');

    const wErrs: Partial<Record<keyof WilayahValue, string>> = {};
    if (!form.province) wErrs.province = t('errors.requiredField');
    if (!form.city) wErrs.regency = t('errors.requiredField');
    if (!form.district) wErrs.district = t('errors.requiredField');
    if (!form.village) wErrs.village = t('errors.requiredField');
    if (!form.postalCode) errs.postalCode = t('errors.requiredField');

    setFormErrors(errs);
    setWilayahErrors(wErrs);
    return Object.keys(errs).length === 0 && Object.keys(wErrs).length === 0;
  };

  // Submit Add or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const presetObj = labelPresets.find((p) => p.key === form.labelKey);
    const finalLabel =
      form.labelKey === 'other' && form.customLabel.trim()
        ? form.customLabel.trim()
        : presetObj
          ? presetObj.label
          : t('checkout.home');

    const payload = {
      label: finalLabel,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      province: form.province,
      city: form.city,
      district: form.district,
      village: form.village,
      postalCode: form.postalCode,
      country: 'Indonesia',
      isDefault: form.isDefault || addresses.length === 0,
    };

    try {
      if (editingAddress) {
        // Update
        const res = await fetch(`/api/addresses/${editingAddress.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast(t('address.successUpdated'), 'success');
          setIsModalOpen(false);
          fetchAddresses();
        } else {
          showToast(data.error || t('errors.somethingWentWrong'), 'error');
        }
      } else {
        // Create
        const res = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast(t('address.successCreated'), 'success');
          setIsModalOpen(false);
          await fetchAddresses();

          // If in onboarding mode, redirect to shop
          if (isOnboarding) {
            router.push('/products');
          }
        } else {
          showToast(data.error || t('errors.somethingWentWrong'), 'error');
        }
      }
    } catch {
      showToast(t('errors.networkError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set Default
  const handleSetDefault = async (addrId: string) => {
    try {
      setSettingDefaultId(addrId);
      const res = await fetch(`/api/addresses/${addrId}/default`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('address.successDefault'), 'success');
        fetchAddresses();
      } else {
        showToast(data.error || t('errors.somethingWentWrong'), 'error');
      }
    } catch {
      showToast(t('errors.networkError'), 'error');
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Delete Address
  const handleDelete = async (addrId: string) => {
    if (!confirm(t('address.confirmDelete'))) return;
    try {
      setDeletingId(addrId);
      const res = await fetch(`/api/addresses/${addrId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('address.successDeleted'), 'success');
        fetchAddresses();
      } else {
        showToast(data.error || t('errors.somethingWentWrong'), 'error');
      }
    } catch {
      showToast(t('errors.networkError'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="container"
      style={{ padding: 'var(--space-10) var(--space-6)', minHeight: '80vh' }}
    >
      {/* Header Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: '0.8rem',
          color: 'var(--clr-text-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          {t('common.home')}
        </a>
        <ChevronRight size={14} />
        <span>{t('nav.userMenu')}</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--clr-gold)' }}>{t('address.title')}</span>
      </div>

      {/* Onboarding Banner */}
      {isOnboarding && (
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(20,20,20,0.85) 100%)',
            border: '1px solid var(--clr-gold-dark)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6) var(--space-8)',
            marginBottom: 'var(--space-8)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeIn 0.4s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <span
                  className="badge badge-gold"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                >
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />{' '}
                  {t('address.onboardingTitle')}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.6rem',
                  fontWeight: 400,
                  color: '#fff',
                  margin: 'var(--space-2) 0',
                }}
              >
                {t('address.onboardingTitle')}
              </h2>
              <p
                style={{
                  color: 'var(--clr-text-2)',
                  fontSize: '0.9rem',
                  maxWidth: '650px',
                  lineHeight: 1.6,
                }}
              >
                {t('address.onboardingDesc')}
              </p>
            </div>
            <div
              style={{
                background: 'var(--clr-gold-muted)',
                borderRadius: '50%',
                padding: 'var(--space-4)',
                border: '1px solid var(--clr-gold)',
              }}
            >
              <ShieldCheck size={32} style={{ color: 'var(--clr-gold)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Main Page Title & Add Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-8)',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              fontWeight: 400,
              color: 'var(--clr-text)',
            }}
          >
            {t('address.title')}
          </h1>
          <p
            style={{
              color: 'var(--clr-text-2)',
              fontSize: '0.875rem',
              marginTop: 'var(--space-1)',
            }}
          >
            {t('address.subtitle')}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Plus size={18} /> {t('address.addNew')}
        </button>
      </div>

      {/* Addresses Content */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-16) 0',
            gap: 'var(--space-3)',
          }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--clr-gold)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
            {t('common.loading')}
          </span>
        </div>
      ) : addresses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-16) var(--space-6)',
            background: 'var(--clr-bg-2)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--clr-border)',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--clr-bg-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              color: 'var(--clr-gold)',
            }}
          >
            <MapPin size={28} />
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.3rem',
              fontWeight: 400,
              marginBottom: 'var(--space-2)',
            }}
          >
            {t('address.noAddresses')}
          </h3>
          <p
            style={{
              color: 'var(--clr-text-2)',
              fontSize: '0.875rem',
              marginBottom: 'var(--space-6)',
              maxWidth: '420px',
              margin: '0 auto var(--space-6)',
            }}
          >
            {t('address.noAddressesDesc')}
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> {t('address.addNew')}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {addresses.map((addr) => {
            const isDefault = addr.isDefault;
            return (
              <div
                key={addr.id}
                style={{
                  background: isDefault
                    ? 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, var(--clr-bg-2) 100%)'
                    : 'var(--clr-bg-2)',
                  border: `1px solid ${isDefault ? 'var(--clr-gold-dark)' : 'var(--clr-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-5)',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isDefault ? '0 4px 20px rgba(201,168,76,0.08)' : 'none',
                }}
              >
                {/* Top header */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--clr-bg-3)',
                          color: 'var(--clr-text-2)',
                          border: '1px solid var(--clr-border)',
                        }}
                      >
                        {addr.label || t('address.title')}
                      </span>
                      {isDefault && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(201,168,76,0.2)',
                            color: 'var(--clr-gold)',
                            border: '1px solid var(--clr-gold)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} /> {t('address.defaultBadge')}
                        </span>
                      )}
                    </div>

                    {/* Edit / Delete actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <button
                        onClick={() => handleOpenEdit(addr)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', color: 'var(--clr-text-2)' }}
                        title={t('address.edit')}
                        aria-label={t('address.edit')}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', color: 'var(--clr-error)' }}
                        disabled={deletingId === addr.id}
                        title={t('address.delete')}
                        aria-label={t('address.delete')}
                      >
                        {deletingId === addr.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--clr-text)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    {addr.fullName}
                  </h4>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--clr-text-3)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    {addr.phone}
                  </p>

                  {/* Street & Wilayah Hierarchy */}
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--clr-text-2)',
                      lineHeight: 1.5,
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {addr.street}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--clr-text-3)',
                      lineHeight: 1.5,
                    }}
                  >
                    {[
                      addr.village ? `${locale === 'id' ? 'Kel.' : 'Subdistrict'} ${addr.village}` : null,
                      addr.district ? `${locale === 'id' ? 'Kec.' : 'District'} ${addr.district}` : null,
                      addr.city,
                      addr.province,
                      addr.postalCode ? `${t('address.postalCode')} ${addr.postalCode}` : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>

                {/* Bottom Action (Set Default) */}
                <div
                  style={{
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--clr-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {isDefault ? (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--clr-gold)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={14} /> {t('address.defaultBadge')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                      disabled={settingDefaultId === addr.id}
                    >
                      {settingDefaultId === addr.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        t('address.setDefault')
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Slide-over Form */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              background: 'var(--clr-bg-2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'var(--space-8)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              animation: 'scaleIn 0.25s ease both',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-6)',
                borderBottom: '1px solid var(--clr-border)',
                paddingBottom: 'var(--space-4)',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.4rem',
                    fontWeight: 400,
                  }}
                >
                  {editingAddress ? t('address.editAddress') : t('address.addNew')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)', marginTop: '4px' }}>
                  {t('address.subtitle')}
                </p>
              </div>
              <button
                onClick={() => {
                  if (isOnboarding && addresses.length === 0) {
                    showToast(t('address.onboardingDesc'), 'info');
                  } else {
                    setIsModalOpen(false);
                  }
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '6px', color: 'var(--clr-text-3)' }}
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
            >
              {/* Label Selection */}
              <div className="input-group">
                <label className="input-label">{t('address.label')}</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {labelPresets.map(({ key, label, icon: Icon }) => {
                    const isSelected = form.labelKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, labelKey: key }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.4rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--clr-gold)' : 'var(--clr-bg-3)',
                          color: isSelected ? '#000' : 'var(--clr-text-2)',
                          border: `1px solid ${isSelected ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    );
                  })}
                </div>
                {form.labelKey === 'other' && (
                  <input
                    className="input"
                    style={{ marginTop: 'var(--space-2)' }}
                    placeholder={t('address.customLabel')}
                    value={form.customLabel}
                    onChange={(e) => setForm((p) => ({ ...p, customLabel: e.target.value }))}
                  />
                )}
              </div>

              {/* Recipient info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                <div className="input-group">
                  <label className="input-label">
                    {t('address.fullName')}{' '}
                    <span style={{ color: 'var(--clr-error)' }}>*</span>
                  </label>
                  <input
                    className={`input ${formErrors.fullName ? 'error' : ''}`}
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, fullName: e.target.value }));
                      setFormErrors((p) => ({ ...p, fullName: '' }));
                    }}
                  />
                  {formErrors.fullName && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>
                      {formErrors.fullName}
                    </span>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">
                    {t('address.phone')}{' '}
                    <span style={{ color: 'var(--clr-error)' }}>*</span>
                  </label>
                  <input
                    className={`input ${formErrors.phone ? 'error' : ''}`}
                    placeholder="08123456789"
                    value={form.phone}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, phone: e.target.value }));
                      setFormErrors((p) => ({ ...p, phone: '' }));
                    }}
                  />
                  {formErrors.phone && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Street Address */}
              <div className="input-group">
                <label className="input-label">
                  {t('address.street')}{' '}
                  <span style={{ color: 'var(--clr-error)' }}>*</span>
                </label>
                <textarea
                  className={`input ${formErrors.street ? 'error' : ''}`}
                  placeholder={t('address.streetPlaceholder')}
                  rows={2}
                  style={{ resize: 'vertical' }}
                  value={form.street}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, street: e.target.value }));
                    setFormErrors((p) => ({ ...p, street: '' }));
                  }}
                />
                {formErrors.street && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>
                    {formErrors.street}
                  </span>
                )}
              </div>

              {/* Cascading Wilayah Selection */}
              <div>
                <label
                  className="input-label"
                  style={{ marginBottom: 'var(--space-2)', display: 'block' }}
                >
                  {t('checkout.stepAddress')} (Indonesia){' '}
                  <span style={{ color: 'var(--clr-error)' }}>*</span>
                </label>
                <WilayahSelect
                  initialValue={{
                    province: form.province,
                    regency: form.city,
                    district: form.district,
                    village: form.village,
                    postalCode: form.postalCode,
                  }}
                  onChange={(val: WilayahValue) => {
                    setForm((p) => ({
                      ...p,
                      province: val.province,
                      city: val.regency,
                      district: val.district,
                      village: val.village,
                      postalCode: val.postalCode,
                    }));
                    setWilayahErrors({});
                    setFormErrors((p) => ({ ...p, postalCode: '' }));
                  }}
                  errors={wilayahErrors}
                />
              </div>

              {/* Postal Code Display & Custom Edit */}
              <div className="input-group" style={{ maxWidth: '200px' }}>
                <label className="input-label">
                  {t('address.postalCode')}{' '}
                  <span style={{ color: 'var(--clr-error)' }}>*</span>
                </label>
                <input
                  className={`input ${formErrors.postalCode ? 'error' : ''}`}
                  placeholder="12345"
                  value={form.postalCode}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, postalCode: e.target.value }));
                    setFormErrors((p) => ({ ...p, postalCode: '' }));
                  }}
                />
                {formErrors.postalCode && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>
                    {formErrors.postalCode}
                  </span>
                )}
              </div>

              {/* Default Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  cursor: 'pointer',
                  marginTop: 'var(--space-2)',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isDefault || addresses.length === 0}
                  disabled={addresses.length === 0}
                  onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  style={{
                    accentColor: 'var(--clr-gold)',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--clr-text)' }}>
                  {t('address.isDefaultCheckbox')}
                </span>
              </label>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  justifyContent: 'flex-end',
                  marginTop: 'var(--space-6)',
                  borderTop: '1px solid var(--clr-border)',
                  paddingTop: 'var(--space-4)',
                }}
              >
                {(!isOnboarding || addresses.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost"
                    disabled={isSubmitting}
                  >
                    {t('common.cancel')}
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isSubmitting}
                  style={{ minWidth: '160px' }}
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : editingAddress ? (
                    t('common.save')
                  ) : (
                    <>
                      {t('address.save')} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--clr-gold)' }} />
        </div>
      }
    >
      <AddressesPageContent />
    </Suspense>
  );
}