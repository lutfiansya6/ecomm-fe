'use client';
// ============================================================
// LUXE E-Commerce - User Address Management Page
// Supports Onboarding, List, Create, Edit, Delete, Set Default
// ============================================================
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/navigation';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
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
import WilayahSelect, { type WilayahValue } from '@/components/ui/WilayahSelect';
import type { UserAddress } from '@/types';

const LABEL_PRESETS = [
  { label: 'Rumah', icon: Home },
  { label: 'Kantor', icon: Briefcase },
  { label: 'Apartemen', icon: Building },
  { label: 'Lainnya', icon: MapPin },
];

function AddressesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const { user, token } = useAuthStore();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(isOnboarding);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    label: 'Rumah',
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
        // If user has 0 addresses, auto-open form
        if (data.data.addresses.length === 0) {
          setIsModalOpen(true);
        }
      }
    } catch {
      showToast('Gagal memuat daftar alamat', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user, token]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAddress(null);
    setForm({
      label: 'Rumah',
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

  // Open Edit Modal
  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    const isPreset = LABEL_PRESETS.some((p) => p.label === addr.label);
    setForm({
      label: isPreset ? addr.label : 'Lainnya',
      customLabel: isPreset ? '' : addr.label,
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
    if (!form.fullName.trim()) errs.fullName = 'Nama lengkap penerima wajib diisi';
    if (!form.phone.trim()) errs.phone = 'Nomor handphone wajib diisi';
    else if (!/^[0-9+\-\s]{8,15}$/.test(form.phone.trim())) {
      errs.phone = 'Format nomor HP tidak valid (8-15 digit)';
    }
    if (!form.street.trim()) errs.street = 'Alamat jalan/gedung wajib diisi';

    const wErrs: Partial<Record<keyof WilayahValue, string>> = {};
    if (!form.province) wErrs.province = 'Provinsi wajib dipilih';
    if (!form.city) wErrs.regency = 'Kabupaten/Kota wajib dipilih';
    if (!form.district) wErrs.district = 'Kecamatan wajib dipilih';
    if (!form.village) wErrs.village = 'Kelurahan wajib dipilih';
    if (!form.postalCode) errs.postalCode = 'Kode pos wajib diisi';

    setFormErrors(errs);
    setWilayahErrors(wErrs);
    return Object.keys(errs).length === 0 && Object.keys(wErrs).length === 0;
  };

  // Submit Add or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const finalLabel = form.label === 'Lainnya' && form.customLabel.trim() ? form.customLabel.trim() : form.label;

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
          showToast('Alamat berhasil diperbarui!', 'success');
          setIsModalOpen(false);
          fetchAddresses();
        } else {
          showToast(data.error || 'Gagal memperbarui alamat', 'error');
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
          showToast('Alamat berhasil disimpan!', 'success');
          setIsModalOpen(false);
          await fetchAddresses();

          // If in onboarding mode, redirect to shop
          if (isOnboarding) {
            showToast('Akun & alamat Anda siap! Selamat berbelanja di LUXE.', 'success');
            router.push('/products');
          }
        } else {
          showToast(data.error || 'Gagal menambahkan alamat', 'error');
        }
      }
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error');
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
        showToast('Alamat utama berhasil diperbarui', 'success');
        fetchAddresses();
      } else {
        showToast(data.error || 'Gagal mengubah alamat utama', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Delete Address
  const handleDelete = async (addrId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alamat ini?')) return;
    try {
      setDeletingId(addrId);
      const res = await fetch(`/api/addresses/${addrId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) {
        showToast('Alamat berhasil dihapus', 'success');
        fetchAddresses();
      } else {
        showToast(data.error || 'Gagal menghapus alamat', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)', minHeight: '80vh' }}>
      {/* Header Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.8rem', color: 'var(--clr-text-3)', marginBottom: 'var(--space-4)' }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Beranda</a>
        <ChevronRight size={14} />
        <span>Akun</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--clr-gold)' }}>Alamat Pengiriman</span>
      </div>

      {/* Onboarding Banner */}
      {isOnboarding && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(20,20,20,0.85) 100%)',
          border: '1px solid var(--clr-gold-dark)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6) var(--space-8)',
          marginBottom: 'var(--space-8)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} /> Langkah 2 dari 2: Alamat Pengiriman Utama
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 400, color: '#fff', margin: 'var(--space-2) 0' }}>
                Selamat Datang di LUXE!
              </h2>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9rem', maxWidth: '650px', lineHeight: 1.6 }}>
                Untuk memastikan kemewahan layanan dan kelancaran pengiriman pesanan Anda, silakan lengkapi alamat pengiriman pertama Anda di bawah ini.
              </p>
            </div>
            <div style={{ background: 'var(--clr-gold-muted)', borderRadius: '50%', padding: 'var(--space-4)', border: '1px solid var(--clr-gold)' }}>
              <ShieldCheck size={32} style={{ color: 'var(--clr-gold)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Main Page Title & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, color: 'var(--clr-text)' }}>
            Daftar Alamat Saya
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem', marginTop: 'var(--space-1)' }}>
            Kelola alamat pengiriman tersimpan untuk kemudahan proses checkout belanja.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Plus size={18} /> Tambah Alamat Baru
        </button>
      </div>

      {/* Addresses Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16) 0', gap: 'var(--space-3)' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--clr-gold)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>Memuat buku alamat...</span>
        </div>
      ) : addresses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-16) var(--space-6)',
          background: 'var(--clr-bg-2)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--clr-border)',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--clr-bg-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            color: 'var(--clr-gold)',
          }}>
            <MapPin size={28} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, marginBottom: 'var(--space-2)' }}>
            Belum Ada Alamat Tersimpan
          </h3>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem', marginBottom: 'var(--space-6)', maxWidth: '420px', margin: '0 auto var(--space-6)' }}>
            Tambahkan alamat pengiriman rumah, kantor, atau apartemen Anda agar pesanan dapat diproses secara instan.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Tambah Alamat Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
          {addresses.map((addr) => {
            const isDefault = addr.isDefault;
            return (
              <div
                key={addr.id}
                style={{
                  background: isDefault ? 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, var(--clr-bg-2) 100%)' : 'var(--clr-bg-2)',
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
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
                        {addr.label || 'Alamat'}
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
                          <CheckCircle2 size={12} /> Alamat Utama
                        </span>
                      )}
                    </div>

                    {/* Edit / Delete actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <button
                        onClick={() => handleOpenEdit(addr)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', color: 'var(--clr-text-2)' }}
                        title="Ubah Alamat"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', color: 'var(--clr-error)' }}
                        disabled={deletingId === addr.id}
                        title="Hapus Alamat"
                      >
                        {deletingId === addr.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--clr-text)', marginBottom: 'var(--space-1)' }}>
                    {addr.fullName}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-3)', marginBottom: 'var(--space-3)' }}>
                    {addr.phone}
                  </p>

                  {/* Street & Wilayah Hierarchy */}
                  <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-2)', lineHeight: 1.5, marginBottom: 'var(--space-2)' }}>
                    {addr.street}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', lineHeight: 1.5 }}>
                    {[
                      addr.village ? `Kel. ${addr.village}` : null,
                      addr.district ? `Kec. ${addr.district}` : null,
                      addr.city,
                      addr.province,
                      addr.postalCode ? `Kode Pos ${addr.postalCode}` : null,
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Bottom Action (Set Default) */}
                <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {isDefault ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Digunakan sebagai alamat utama
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                      disabled={settingDefaultId === addr.id}
                    >
                      {settingDefaultId === addr.id ? <Loader2 size={12} className="animate-spin" /> : 'Jadikan Alamat Utama'}
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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}>
          <div style={{
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
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400 }}>
                  {editingAddress ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Pengiriman'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)', marginTop: '4px' }}>
                  Isi data penerima dan pilih wilayah pengiriman Indonesia secara presisi.
                </p>
              </div>
              <button
                onClick={() => {
                  if (isOnboarding && addresses.length === 0) {
                    showToast('Harap isi alamat pertama Anda untuk melanjutkan', 'info');
                  } else {
                    setIsModalOpen(false);
                  }
                }}
                className="btn btn-ghost btn-sm"
                style={{ padding: '6px', color: 'var(--clr-text-3)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Label Selection */}
              <div className="input-group">
                <label className="input-label">Label Alamat</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {LABEL_PRESETS.map(({ label, icon: Icon }) => {
                    const isSelected = form.label === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, label }))}
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
                {form.label === 'Lainnya' && (
                  <input
                    className="input"
                    style={{ marginTop: 'var(--space-2)' }}
                    placeholder="Contoh: Villa, Kost, Gudang"
                    value={form.customLabel}
                    onChange={(e) => setForm((p) => ({ ...p, customLabel: e.target.value }))}
                  />
                )}
              </div>

              {/* Recipient info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Nama Lengkap Penerima <span style={{ color: 'var(--clr-error)' }}>*</span></label>
                  <input
                    className={`input ${formErrors.fullName ? 'error' : ''}`}
                    placeholder="Contoh: Sarah Johnson"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, fullName: e.target.value }));
                      setFormErrors((p) => ({ ...p, fullName: '' }));
                    }}
                  />
                  {formErrors.fullName && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{formErrors.fullName}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">Nomor Handphone <span style={{ color: 'var(--clr-error)' }}>*</span></label>
                  <input
                    className={`input ${formErrors.phone ? 'error' : ''}`}
                    placeholder="08123456789"
                    value={form.phone}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, phone: e.target.value }));
                      setFormErrors((p) => ({ ...p, phone: '' }));
                    }}
                  />
                  {formErrors.phone && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{formErrors.phone}</span>}
                </div>
              </div>

              {/* Street Address */}
              <div className="input-group">
                <label className="input-label">Alamat Lengkap / Jalan <span style={{ color: 'var(--clr-error)' }}>*</span></label>
                <textarea
                  className={`input ${formErrors.street ? 'error' : ''}`}
                  placeholder="Nama jalan, nomor gedung/rumah, nomor lantai/unit, RT/RW, patokan"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  value={form.street}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, street: e.target.value }));
                    setFormErrors((p) => ({ ...p, street: '' }));
                  }}
                />
                {formErrors.street && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{formErrors.street}</span>}
              </div>

              {/* Cascading Wilayah Selection */}
              <div>
                <label className="input-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
                  Wilayah Pengiriman (Indonesia) <span style={{ color: 'var(--clr-error)' }}>*</span>
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
                <label className="input-label">Kode Pos <span style={{ color: 'var(--clr-error)' }}>*</span></label>
                <input
                  className={`input ${formErrors.postalCode ? 'error' : ''}`}
                  placeholder="12345"
                  value={form.postalCode}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, postalCode: e.target.value }));
                    setFormErrors((p) => ({ ...p, postalCode: '' }));
                  }}
                />
                {formErrors.postalCode && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{formErrors.postalCode}</span>}
              </div>

              {/* Default Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', marginTop: 'var(--space-2)' }}>
                <input
                  type="checkbox"
                  checked={form.isDefault || addresses.length === 0}
                  disabled={addresses.length === 0}
                  onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  style={{ accentColor: 'var(--clr-gold)', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--clr-text)' }}>
                  Jadikan sebagai alamat pengiriman utama
                </span>
              </label>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-4)' }}>
                {(!isOnboarding || addresses.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost"
                    disabled={isSubmitting}
                  >
                    Batal
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
                    'Simpan Perubahan'
                  ) : (
                    <>Simpan Alamat <ArrowRight size={16} /></>
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
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--clr-gold)' }} />
      </div>
    }>
      <AddressesPageContent />
    </Suspense>
  );
}