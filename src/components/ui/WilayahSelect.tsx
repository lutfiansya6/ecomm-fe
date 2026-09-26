'use client';
// ============================================================
// WilayahSelect - Cascading dropdown untuk wilayah Indonesia
// Provinsi -> Kabupaten/Kota -> Kecamatan -> Kelurahan + Kode Pos
// Menggunakan proxy API backend, bukan langsung ke emsifa.com
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

// --- Types ---------------------------------------------------
interface WilayahItem {
  id: string;
  name: string;
}
interface VillageItem extends WilayahItem {
  postal_code: string;
}

export interface WilayahValue {
  province: string;
  regency: string;
  district: string;
  village: string;
  postalCode: string;
}

interface Props {
  /** Called whenever any wilayah field changes. */
  onChange: (val: WilayahValue) => void;
  /** Initial/pre-filled values (optional). */
  initialValue?: Partial<WilayahValue>;
  /** Whether fields should be read-only. */
  disabled?: boolean;
  /** Error messages keyed by field name. */
  errors?: Partial<Record<keyof WilayahValue, string>>;
  /** Base URL for the API (default: '/api/wilayah'). */
  apiBase?: string;
}

const DEFAULT_API = '/api/wilayah';

// --- WilayahDropdown -----------------------------------------
// options is typed as WilayahItem[] but is always guarded with
// Array.isArray() to prevent "options.map is not a function"
// in case the parent passes undefined/null before fetch resolves.
function WilayahDropdown({
  id, label, value, options, placeholder, disabled, loading, error, onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: WilayahItem[];
  placeholder: string;
  disabled: boolean;
  loading: boolean;
  error?: string;
  onChange: (id: string, name: string) => void;
}) {
  // Defensive: ensure options is always iterable
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div className="input-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select
          id={id}
          className={`input select${error ? ' error' : ''}`}
          value={value}
          disabled={disabled || loading}
          onChange={(e) => {
            const opt = safeOptions.find((o) => o.id === e.target.value);
            onChange(e.target.value, opt?.name ?? '');
          }}
          style={{
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            paddingRight: '2.75rem',
          }}
        >
          <option value="">{placeholder}</option>
          {safeOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        {loading && (
          <span style={{
            position: 'absolute', right: '2.5rem', top: '50%',
            transform: 'translateY(-50%)', display: 'flex',
            alignItems: 'center', pointerEvents: 'none',
          }}>
            <Loader2 size={14} style={{ color: 'var(--clr-gold)', animation: 'spin 1s linear infinite' }} />
          </span>
        )}
      </div>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={12} />{error}
        </span>
      )}
    </div>
  );
}

// --- WilayahSelect (main) ------------------------------------
export default function WilayahSelect({
  onChange,
  initialValue,
  disabled = false,
  errors = {},
  apiBase = DEFAULT_API,
}: Props) {
  // Selected IDs (for cascading logic)
  const [provinceId, setProvinceId] = useState('');
  const [regencyId, setRegencyId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [villageId, setVillageId] = useState('');

  // Selected display names (these are what get saved to Address)
  const [provinceName, setProvinceName] = useState(initialValue?.province ?? '');
  const [regencyName, setRegencyName] = useState(initialValue?.regency ?? '');
  const [districtName, setDistrictName] = useState(initialValue?.district ?? '');
  const [villageName, setVillageName] = useState(initialValue?.village ?? '');
  const [postalCode, setPostalCode] = useState(initialValue?.postalCode ?? '');

  // Data lists — ALWAYS initialised as empty arrays (never undefined)
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<VillageItem[]>([]);

  // Loading states per level
  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingVil, setLoadingVil] = useState(false);

  // API error message
  const [apiError, setApiError] = useState('');

  // --- Fetch helper ------------------------------------------
  // Always returns an array — never throws to the caller.
  // Backend wraps data as { success: true, data: [...] }.
  async function apiFetch<T extends WilayahItem[]>(url: string): Promise<T> {
    setApiError('');
    try {
      const res = await fetch(url);
      if (!res.ok) {
        setApiError(`Layanan data wilayah error (HTTP ${res.status})`);
        return [] as unknown as T;
      }
      let json: unknown;
      try {
        json = await res.json();
      } catch {
        setApiError('Response dari server tidak valid');
        return [] as unknown as T;
      }

      // Handle both { success, data: [...] }, { success, data: { data: [...] } }, and bare array formats
      if (json && typeof json === 'object' && !Array.isArray(json)) {
        const wrapped = json as { success?: boolean; data?: unknown; error?: string };
        if (wrapped.success === false) {
          setApiError(wrapped.error ?? 'Terjadi kesalahan saat memuat data wilayah');
          return [] as unknown as T;
        }
        const data = wrapped.data;
        if (Array.isArray(data)) return data as T;
        if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
          return (data as { data: unknown }).data as T;
        }
        return [] as unknown as T;
      }
      // Bare array response
      return (Array.isArray(json) ? json : []) as T;
    } catch {
      setApiError('Layanan data wilayah sedang tidak tersedia');
      return [] as unknown as T;
    }
  }

  // --- Load provinces on mount -------------------------------
  useEffect(() => {
    setLoadingProv(true);
    apiFetch<WilayahItem[]>(`${apiBase}/provinces`).then((data) => {
      setProvinces(data);
      setLoadingProv(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // --- Emit current values upward ----------------------------
  const emit = useCallback((overrides: Partial<WilayahValue> = {}) => {
    onChange({
      province: provinceName,
      regency: regencyName,
      district: districtName,
      village: villageName,
      postalCode,
      ...overrides,
    });
  }, [onChange, provinceName, regencyName, districtName, villageName, postalCode]);

  // --- Cascade handlers --------------------------------------
  const handleProvinceChange = async (id: string, name: string) => {
    setProvinceId(id); setProvinceName(name);
    setRegencyId(''); setRegencyName('');
    setDistrictId(''); setDistrictName('');
    setVillageId(''); setVillageName('');
    setPostalCode('');
    setRegencies([]); setDistricts([]); setVillages([]);
    emit({ province: name, regency: '', district: '', village: '', postalCode: '' });
    if (!id) return;
    setLoadingReg(true);
    const data = await apiFetch<WilayahItem[]>(`${apiBase}/regencies/${id}`);
    setRegencies(data);
    setLoadingReg(false);
  };

  const handleRegencyChange = async (id: string, name: string) => {
    setRegencyId(id); setRegencyName(name);
    setDistrictId(''); setDistrictName('');
    setVillageId(''); setVillageName('');
    setPostalCode('');
    setDistricts([]); setVillages([]);
    emit({ regency: name, district: '', village: '', postalCode: '' });
    if (!id) return;
    setLoadingDist(true);
    const data = await apiFetch<WilayahItem[]>(`${apiBase}/districts/${id}`);
    setDistricts(data);
    setLoadingDist(false);
  };

  const handleDistrictChange = async (id: string, name: string) => {
    setDistrictId(id); setDistrictName(name);
    setVillageId(''); setVillageName('');
    setPostalCode('');
    setVillages([]);
    emit({ district: name, village: '', postalCode: '' });
    if (!id) return;
    setLoadingVil(true);
    const data = await apiFetch<VillageItem[]>(`${apiBase}/villages/${id}`);
    setVillages(data);
    setLoadingVil(false);
  };

  const handleVillageChange = (id: string, name: string) => {
    setVillageId(id); setVillageName(name);
    const found = Array.isArray(villages) ? villages.find((v) => v.id === id) : undefined;
    const kodePos = found?.postal_code ?? '';
    setPostalCode(kodePos);
    emit({ village: name, postalCode: kodePos });
  };

  const anyLoading = loadingProv || loadingReg || loadingDist || loadingVil;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--clr-border)',
        marginBottom: 'var(--space-1)',
      }}>
        <MapPin size={15} style={{ color: 'var(--clr-gold)', flexShrink: 0 }} />
        <span style={{
          fontSize: '0.75rem', fontWeight: 500,
          textTransform: 'uppercase' as const, letterSpacing: '0.1em',
          color: 'var(--clr-text-2)',
        }}>
          Wilayah Pengiriman
        </span>
        {anyLoading && (
          <Loader2 size={12} style={{ color: 'var(--clr-gold)', marginLeft: 'auto', animation: 'spin 1s linear infinite' }} />
        )}
      </div>

      {/* API error banner */}
      {apiError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--clr-error)',
        }}>
          <AlertCircle size={14} />{apiError}
        </div>
      )}

      {/* 2-column dropdown grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <WilayahDropdown
          id="wilayah-province" label="Provinsi"
          value={provinceId} options={provinces}
          placeholder={loadingProv ? 'Memuat...' : '— Pilih Provinsi —'}
          disabled={disabled || loadingProv} loading={loadingProv}
          error={errors.province} onChange={handleProvinceChange}
        />
        <WilayahDropdown
          id="wilayah-regency" label="Kabupaten / Kota"
          value={regencyId} options={regencies}
          placeholder={!provinceId ? '— Pilih provinsi dulu —' : loadingReg ? 'Memuat...' : '— Pilih Kab/Kota —'}
          disabled={disabled || !provinceId || loadingReg} loading={loadingReg}
          error={errors.regency} onChange={handleRegencyChange}
        />
        <WilayahDropdown
          id="wilayah-district" label="Kecamatan"
          value={districtId} options={districts}
          placeholder={!regencyId ? '— Pilih kab/kota dulu —' : loadingDist ? 'Memuat...' : '— Pilih Kecamatan —'}
          disabled={disabled || !regencyId || loadingDist} loading={loadingDist}
          error={errors.district} onChange={handleDistrictChange}
        />
        <WilayahDropdown
          id="wilayah-village" label="Kelurahan / Desa"
          value={villageId} options={villages}
          placeholder={!districtId ? '— Pilih kecamatan dulu —' : loadingVil ? 'Memuat...' : '— Pilih Kelurahan —'}
          disabled={disabled || !districtId || loadingVil} loading={loadingVil}
          error={errors.village} onChange={handleVillageChange}
        />
      </div>

      {/* Kode Pos — auto-filled, read-only */}
      {villageId && (
        <div className="input-group" style={{ animation: 'fadeIn 0.3s both' }}>
          <label className="input-label" htmlFor="wilayah-postal">
            Kode Pos{' '}
            <span style={{ color: 'var(--clr-gold)', marginLeft: 4, fontSize: '0.6rem' }}>
              ● OTOMATIS
            </span>
          </label>
          <input
            id="wilayah-postal"
            className="input"
            value={postalCode}
            readOnly
            style={{
              background: 'var(--clr-bg-3)', color: 'var(--clr-gold)',
              fontWeight: 600, cursor: 'default', letterSpacing: '0.15em',
            }}
          />
        </div>
      )}

      {/* Summary chip — shown once village is selected */}
      {villageName && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--clr-gold-muted)', border: '1px solid var(--clr-gold-dark)',
          borderRadius: 'var(--radius-md)', fontSize: '0.8rem',
          color: 'var(--clr-gold-light)', animation: 'fadeIn 0.3s both', lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 600 }}>📍 </span>
          {[villageName, districtName, regencyName, provinceName].filter(Boolean).join(', ')}
          {postalCode && <span style={{ marginLeft: 8, opacity: 0.8 }}>{postalCode}</span>}
        </div>
      )}
    </div>
  );
}

export type { WilayahValue as WilayahData };
