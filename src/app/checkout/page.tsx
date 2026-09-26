'use client';
// ============================================================
// LUXE E-Commerce - Checkout Page
// Integrated with User Saved Addresses, Wilayah Indonesia & RajaOngkir Shipping
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  CreditCard,
  Smartphone,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  MapPin,
  Plus,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Truck,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { formatPrice } from '@/lib/utils';
import type { Address, PaymentResult, UserAddress, ShippingCostOption, ShippingDestination } from '@/types';
import WilayahSelect, { type WilayahValue } from '@/components/ui/WilayahSelect';

type Step = 'address' | 'payment' | 'processing' | 'result';
type PaymentMethod = 'credit_card' | 'gopay' | 'cod';
type AddressMode = 'saved' | 'new';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<Step>('address');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressMode, setAddressMode] = useState<AddressMode>('saved');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [newAddressLabel, setNewAddressLabel] = useState('Rumah');

  const [address, setAddress] = useState<Address>({
    fullName: user?.name || '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Indonesia',
    district: '',
    village: '',
    label: 'Rumah',
  });

  // RajaOngkir Shipping State
  const [shippingOptions, setShippingOptions] = useState<ShippingCostOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingCostOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [destinationInfo, setDestinationInfo] = useState<ShippingDestination | null>(null);

  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});
  const [wilayahErrors, setWilayahErrors] = useState<Partial<Record<keyof WilayahValue, string>>>({});

  // Total weight in grams (default 500g per item if not set)
  const totalWeight = items.reduce(
    (sum, item) => sum + (item.product.weight || 500) * item.quantity,
    0
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch shipping costs based on current address
  const fetchShippingRates = useCallback(async (targetAddr: Address) => {
    const searchKeyword = targetAddr.district || targetAddr.city;
    if (!searchKeyword) {
      setShippingOptions([]);
      setSelectedShipping(null);
      return;
    }

    setLoadingShipping(true);
    setShippingError(null);

    try {
      // 1. Search destination
      const destRes = await fetch(`/api/shipping/search-destination?keyword=${encodeURIComponent(searchKeyword)}`);
      const destData = await destRes.json();

      if (!destData.success || !Array.isArray(destData.data) || destData.data.length === 0) {
        setShippingError('Lokasi tujuan tidak ditemukan di RajaOngkir. Pastikan kecamatan atau kota terisi dengan benar.');
        setShippingOptions([]);
        setSelectedShipping(null);
        setLoadingShipping(false);
        return;
      }

      const bestDest: ShippingDestination = destData.data[0];
      setDestinationInfo(bestDest);

      // 2. Calculate domestic cost
      const costRes = await fetch('/api/shipping/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId: bestDest.id,
          weight: totalWeight,
          courier: 'all',
        }),
      });

      const costData = await costRes.json();
      if (costData.success && Array.isArray(costData.data) && costData.data.length > 0) {
        const options: ShippingCostOption[] = costData.data;
        setShippingOptions(options);
        // Default to first option
        setSelectedShipping(options[0]);
      } else {
        setShippingError('Gagal menghitung ongkos kirim. Silakan coba lagi.');
        setShippingOptions([]);
        setSelectedShipping(null);
      }
    } catch {
      setShippingError('Gagal menghubungkan ke layanan ongkos kirim RajaOngkir.');
      setShippingOptions([]);
      setSelectedShipping(null);
    } finally {
      setLoadingShipping(false);
    }
  }, [totalWeight]);

  // Fetch saved addresses on mount
  useEffect(() => {
    if (!mounted) return;
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const res = await fetch('/api/addresses', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.addresses)) {
          const list: UserAddress[] = data.data.addresses;
          setSavedAddresses(list);
          if (list.length > 0) {
            setAddressMode('saved');
            const defaultAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddressId(defaultAddr.id);
            const addrObj: Address = {
              fullName: defaultAddr.fullName,
              phone: defaultAddr.phone,
              street: defaultAddr.street,
              city: defaultAddr.city,
              province: defaultAddr.province,
              district: defaultAddr.district,
              village: defaultAddr.village,
              postalCode: defaultAddr.postalCode,
              country: defaultAddr.country || 'Indonesia',
              label: defaultAddr.label,
            };
            setAddress(addrObj);
            fetchShippingRates(addrObj);
          } else {
            setAddressMode('new');
          }
        } else {
          setAddressMode('new');
        }
      } catch {
        setAddressMode('new');
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [mounted, token, fetchShippingRates]);

  useEffect(() => {
    if (mounted && items.length === 0 && step === 'address') {
      router.push('/cart');
    }
  }, [mounted, items, step, router]);

  if (!mounted) return null;

  const subtotal = totalPrice();
  // Dynamic shipping cost from selected RajaOngkir rate
  const shipping = selectedShipping ? selectedShipping.cost : 0;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  const handleSelectSavedAddress = (saved: UserAddress) => {
    setSelectedAddressId(saved.id);
    const addrObj: Address = {
      fullName: saved.fullName,
      phone: saved.phone,
      street: saved.street,
      city: saved.city,
      province: saved.province,
      district: saved.district,
      village: saved.village,
      postalCode: saved.postalCode,
      country: saved.country || 'Indonesia',
      label: saved.label,
    };
    setAddress(addrObj);
    setAddrErrors({});
    setWilayahErrors({});
    fetchShippingRates(addrObj);
  };

  const validateAddress = () => {
    if (addressMode === 'saved') {
      if (!selectedAddressId) {
        showToast('Pilih salah satu alamat pengiriman', 'error');
        return false;
      }
      if (!selectedShipping) {
        showToast('Pilih salah satu layanan kurir pengiriman', 'error');
        return false;
      }
      return true;
    }

    const e: Record<string, string> = {};
    if (!address.fullName.trim()) e.fullName = 'Nama wajib diisi';
    if (!address.phone || address.phone.length < 9) e.phone = 'Nomor HP tidak valid';
    if (!address.street.trim()) e.street = 'Alamat lengkap wajib diisi';
    if (!address.postalCode || address.postalCode.length < 5) e.postalCode = 'Kode pos tidak valid';
    setAddrErrors(e);

    const we: Partial<Record<keyof WilayahValue, string>> = {};
    if (!address.province) we.province = 'Provinsi wajib dipilih';
    if (!address.city) we.regency = 'Kabupaten/Kota wajib dipilih';
    if (!address.district) we.district = 'Kecamatan wajib dipilih';
    if (!address.village) we.village = 'Kelurahan wajib dipilih';
    setWilayahErrors(we);

    if (!selectedShipping) {
      showToast('Pilih salah satu layanan kurir pengiriman', 'error');
      return false;
    }

    return Object.keys(e).length === 0 && Object.keys(we).length === 0;
  };

  const validateCard = () => {
    if (paymentMethod !== 'credit_card') return true;
    const e: Record<string, string> = {};
    const clean = card.number.replace(/\s/g, '');
    if (!clean || clean.length < 13) e.number = 'Nomor kartu tidak valid';
    if (!card.expiry || !/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'Format: MM/YY';
    if (!card.cvv || card.cvv.length < 3) e.cvv = 'CVV tidak valid';
    if (!card.name.trim()) e.name = 'Nama pemegang kartu wajib diisi';
    setCardErrors(e);
    return Object.keys(e).length === 0;
  };

  const formatCardNumber = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  const handleProceedToPayment = async () => {
    if (!validateAddress()) return;

    // If new address mode and save to account is checked, save in background
    if (addressMode === 'new' && saveToAccount && token) {
      try {
        await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            label: newAddressLabel || 'Alamat',
            fullName: address.fullName,
            phone: address.phone,
            street: address.street,
            province: address.province,
            city: address.city,
            district: address.district,
            village: address.village,
            postalCode: address.postalCode,
            country: 'Indonesia',
            isDefault: savedAddresses.length === 0,
          }),
        });
      } catch {
        // silent fail on background save
      }
    }

    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!validateCard()) return;
    setIsSubmitting(true);
    setStep('processing');

    try {
      // 1. Create order with dynamic shipping cost & courier details
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items,
          address,
          shipping: selectedShipping?.cost || 0,
          courier: selectedShipping?.name || 'Reguler',
          courierService: selectedShipping?.service || 'REG',
          courierEtd: selectedShipping?.etd || '',
          paymentMethod,
          notes: '',
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error);
      const newOrderId = orderData.data.id;
      setOrderId(newOrderId);

      // Simulate processing delay
      await new Promise((r) => setTimeout(r, 2000));

      // 2. Process payment
      const payRes = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId: newOrderId,
          method: paymentMethod,
          cardNumber: card.number,
          cardExpiry: card.expiry,
          cardCvv: card.cvv,
          cardName: card.name,
        }),
      });
      const payData = await payRes.json();
      setPaymentResult(payData.data);
      if (payData.data?.success) clearCart();
      setStep('result');
    } catch {
      showToast('Terjadi kesalahan proses pembayaran. Coba lagi.', 'error');
      setStep('payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)', minHeight: '80vh' }}>
      {/* Progress Steps */}
      {step !== 'processing' && step !== 'result' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-10)', maxWidth: '480px' }}>
          {[
            { key: 'address', label: '1. Alamat & Pengiriman' },
            { key: 'payment', label: '2. Pembayaran' },
          ].map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: i === 0 ? 'none' : 1 }}>
              {i > 0 && <div style={{ flex: 1, height: '1px', background: step === 'payment' ? 'var(--clr-gold)' : 'var(--clr-border)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: step === s.key ? 'var(--clr-gold)' : step === 'payment' && s.key === 'address' ? 'var(--clr-success)' : 'var(--clr-bg-3)',
                  border: `1px solid ${step === s.key ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  color: step === s.key ? '#000' : step === 'payment' && s.key === 'address' ? '#fff' : 'var(--clr-text-2)',
                }}>
                  {step === 'payment' && s.key === 'address' ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.85rem', color: step === s.key ? 'var(--clr-text)' : 'var(--clr-text-2)', fontWeight: step === s.key ? 600 : 400 }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processing Screen */}
      {step === 'processing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-6)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--clr-gold-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--clr-gold-dark)' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--clr-gold)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: 'var(--space-3)' }}>Memproses Pembayaran</h2>
            <p style={{ color: 'var(--clr-text-2)' }}>Harap tunggu sejenak, pesanan Anda sedang diverifikasi...</p>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {step === 'result' && paymentResult && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-6)', animation: 'scaleIn 0.4s both' }}>
          {paymentResult.success ? (
            <div style={{ width: '80px', height: '80px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle size={40} style={{ color: 'var(--clr-success)' }} />
            </div>
          ) : (
            <div style={{ width: '80px', height: '80px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
              <XCircle size={40} style={{ color: 'var(--clr-error)' }} />
            </div>
          )}

          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 400, marginBottom: 'var(--space-3)' }}>
              {paymentResult.success ? 'Pembayaran Berhasil!' : 'Pembayaran Gagal'}
            </h2>
            <p style={{ color: 'var(--clr-text-2)', marginBottom: 'var(--space-4)' }}>{paymentResult.message}</p>

            <div className="card" style={{ padding: 'var(--space-5)', textAlign: 'left', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Order ID', value: orderId },
                { label: 'Transaction ID', value: paymentResult.transactionId },
                { label: 'Kurir Pengiriman', value: `${selectedShipping?.name || 'Kurir'} - ${selectedShipping?.service || 'REG'} (${selectedShipping?.etd || 'Estimasi tiba'})` },
                { label: 'Ongkos Kirim', value: formatPrice(selectedShipping?.cost || 0) },
                { label: 'Total', value: formatPrice(paymentResult.amount) },
                { label: 'Metode', value: paymentResult.method === 'credit_card' ? 'Kartu Kredit' : paymentResult.method === 'gopay' ? 'GoPay' : 'COD' },
                { label: 'Alamat Kirim', value: `${address.fullName} - ${address.city}, ${address.province}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>{label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
              {paymentResult.success ? (
                <>
                  <button className="btn btn-primary" onClick={() => router.push('/orders')}>Lihat Pesanan</button>
                  <button className="btn btn-ghost" onClick={() => router.push('/products')}>Lanjut Belanja</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => setStep('payment')}>Coba Lagi</button>
                  <button className="btn btn-ghost" onClick={() => router.push('/')}>Kembali ke Beranda</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Address & Shipping Selection */}
      {step === 'address' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-8)', alignItems: 'start' }}>
          <div>
            {/* Address Selection Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400 }}>Alamat Pengiriman</h2>
              <Link href="/addresses" style={{ fontSize: '0.8rem', color: 'var(--clr-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                Buku Alamat <ExternalLink size={13} />
              </Link>
            </div>

            {loadingAddresses ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-8) 0' }}>
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--clr-gold)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>Memeriksa alamat tersimpan Anda...</span>
              </div>
            ) : savedAddresses.length > 0 && addressMode === 'saved' ? (
              /* Mode A: Choose from Saved Addresses */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                  {savedAddresses.map((saved) => {
                    const isSelected = selectedAddressId === saved.id;
                    return (
                      <div
                        key={saved.id}
                        onClick={() => handleSelectSavedAddress(saved)}
                        style={{
                          background: isSelected ? 'linear-gradient(180deg, rgba(201,168,76,0.1) 0%, var(--clr-bg-2) 100%)' : 'var(--clr-bg-2)',
                          border: `1.5px solid ${isSelected ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                          borderRadius: 'var(--radius-lg)',
                          padding: 'var(--space-5)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--clr-bg-3)',
                              color: 'var(--clr-text-2)',
                              border: '1px solid var(--clr-border)',
                            }}>
                              {saved.label || 'Alamat'}
                            </span>
                            {saved.isDefault && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--clr-gold)', background: 'rgba(201,168,76,0.15)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-gold)' }}>
                                Utama
                              </span>
                            )}
                          </div>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                            background: isSelected ? 'var(--clr-gold)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000' }} />}
                          </div>
                        </div>

                        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--clr-text)' }}>{saved.fullName}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', marginBottom: 'var(--space-2)' }}>{saved.phone}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', lineHeight: 1.4, marginBottom: 'var(--space-2)' }}>{saved.street}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>
                          {[saved.village, saved.district, saved.city, saved.province, saved.postalCode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Option to use a new address */}
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode('new');
                      const emptyAddr: Address = {
                        fullName: user?.name || '',
                        phone: '',
                        street: '',
                        city: '',
                        province: '',
                        district: '',
                        village: '',
                        postalCode: '',
                        country: 'Indonesia',
                        label: 'Lainnya',
                      };
                      setAddress(emptyAddr);
                      setShippingOptions([]);
                      setSelectedShipping(null);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
                  >
                    <Plus size={15} /> Gunakan Alamat Lain / Baru
                  </button>
                </div>
              </div>
            ) : (
              /* Mode B: Manual / New Address Form */
              <div>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddressMode('saved');
                      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                      handleSelectSavedAddress(defaultAddr);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ marginBottom: 'var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-gold)' }}
                  >
                    <ArrowLeft size={15} /> Pilih dari Alamat Tersimpan ({savedAddresses.length})
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Nama Lengkap Penerima</label>
                    <input
                      className={`input ${addrErrors.fullName ? 'error' : ''}`}
                      placeholder="Contoh: Sarah Johnson"
                      value={address.fullName}
                      onChange={(e) => {
                        setAddress((p) => ({ ...p, fullName: e.target.value }));
                        setAddrErrors((p) => ({ ...p, fullName: '' }));
                      }}
                    />
                    {addrErrors.fullName && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{addrErrors.fullName}</span>}
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Nomor Handphone</label>
                    <input
                      className={`input ${addrErrors.phone ? 'error' : ''}`}
                      placeholder="08123456789"
                      value={address.phone}
                      onChange={(e) => {
                        setAddress((p) => ({ ...p, phone: e.target.value }));
                        setAddrErrors((p) => ({ ...p, phone: '' }));
                      }}
                    />
                    {addrErrors.phone && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{addrErrors.phone}</span>}
                  </div>

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Alamat Lengkap / Jalan</label>
                    <textarea
                      className={`input ${addrErrors.street ? 'error' : ''}`}
                      placeholder="Nama jalan, nomor rumah, gedung/lantai, RT/RW"
                      rows={2}
                      value={address.street}
                      onChange={(e) => {
                        setAddress((p) => ({ ...p, street: e.target.value }));
                        setAddrErrors((p) => ({ ...p, street: '' }));
                      }}
                    />
                    {addrErrors.street && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{addrErrors.street}</span>}
                  </div>
                </div>

                {/* Wilayah cascading select */}
                <div style={{ marginTop: 'var(--space-5)' }}>
                  <WilayahSelect
                    onChange={(val: WilayahValue) => {
                      const updated: Address = {
                        ...address,
                        province: val.province,
                        city: val.regency,
                        district: val.district,
                        village: val.village,
                        postalCode: val.postalCode,
                      };
                      setAddress(updated);
                      setWilayahErrors({});
                      setAddrErrors((p) => ({ ...p, postalCode: '' }));

                      // When district or city is selected, automatically recalculate shipping
                      if (val.district || val.regency) {
                        fetchShippingRates(updated);
                      }
                    }}
                    errors={wilayahErrors}
                  />
                </div>

                {/* Kode pos readonly/auto-fill */}
                {address.postalCode && (
                  <div className="input-group" style={{ marginTop: 'var(--space-4)', maxWidth: '200px' }}>
                    <label className="input-label">Kode Pos</label>
                    <input
                      className="input"
                      value={address.postalCode}
                      onChange={(e) => setAddress((p) => ({ ...p, postalCode: e.target.value }))}
                      style={{ color: 'var(--clr-gold)', fontWeight: 600, letterSpacing: '0.1em' }}
                    />
                  </div>
                )}

                {/* Save to address book option */}
                {token && (
                  <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--clr-bg-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={saveToAccount}
                        onChange={(e) => setSaveToAccount(e.target.checked)}
                        style={{ accentColor: 'var(--clr-gold)', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        Simpan alamat ini ke buku alamat saya
                      </span>
                    </label>

                    {saveToAccount && (
                      <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)' }}>Simpan sebagai:</span>
                        {['Rumah', 'Kantor', 'Apartemen', 'Lainnya'].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setNewAddressLabel(lbl)}
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              border: `1px solid ${newAddressLabel === lbl ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                              background: newAddressLabel === lbl ? 'var(--clr-gold)' : 'var(--clr-bg-2)',
                              color: newAddressLabel === lbl ? '#000' : 'var(--clr-text-2)',
                              cursor: 'pointer',
                            }}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* RajaOngkir Shipping Options Section */}
            <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)', background: 'var(--clr-bg-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Truck size={20} style={{ color: 'var(--clr-gold)' }} />
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400 }}>
                    Layanan Pengiriman (RajaOngkir)
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Scale size={13} /> Total Berat: {(totalWeight / 1000).toFixed(1)} kg ({totalWeight.toLocaleString()} gr)
                  </span>
                  {(address.district || address.city) && (
                    <button
                      type="button"
                      onClick={() => fetchShippingRates(address)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--clr-gold)' }}
                      title="Hitung Ulang Ongkir"
                    >
                      <RefreshCw size={13} className={loadingShipping ? 'animate-spin' : ''} /> Refresh
                    </button>
                  )}
                </div>
              </div>

              {loadingShipping ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) 0', gap: 'var(--space-3)' }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--clr-gold)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>Menghitung ongkos kirim resmi RajaOngkir...</span>
                </div>
              ) : shippingError ? (
                <div style={{
                  padding: 'var(--space-4)',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--clr-error)', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} />
                    <span>{shippingError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchShippingRates(address)}
                    className="btn btn-outline btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: 'var(--space-1)', fontSize: '0.75rem' }}
                  >
                    Coba Hitung Lagi
                  </button>
                </div>
              ) : shippingOptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--clr-text-3)', fontSize: '0.85rem' }}>
                  Pilih atau isi kecamatan & kota tujuan untuk menampilkan pilihan kurir.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
                  {shippingOptions.map((opt) => {
                    const isSelected = selectedShipping?.name === opt.name && selectedShipping?.service === opt.service;
                    return (
                      <div
                        key={`${opt.code}-${opt.service}-${opt.cost}`}
                        onClick={() => setSelectedShipping(opt)}
                        style={{
                          background: isSelected ? 'linear-gradient(180deg, rgba(201,168,76,0.12) 0%, var(--clr-bg-3) 100%)' : 'var(--clr-bg-3)',
                          border: `1.5px solid ${isSelected ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-4)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clr-gold)' }}>
                              {opt.name}
                            </span>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--clr-text)', margin: '2px 0' }}>
                              {opt.service}
                            </h4>
                            {opt.description && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>{opt.description}</p>
                            )}
                          </div>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                            background: isSelected ? 'var(--clr-gold)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px',
                          }}>
                            {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000' }} />}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--clr-border)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={12} /> {opt.etd}
                          </span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isSelected ? 'var(--clr-gold)' : 'var(--clr-text)' }}>
                            {formatPrice(opt.cost)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ marginTop: 'var(--space-8)' }}
              onClick={handleProceedToPayment}
            >
              Lanjut ke Pembayaran
            </button>
          </div>

          {/* Order summary */}
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
            selectedShipping={selectedShipping}
          />
        </div>
      )}

      {/* Step 2: Payment Step */}
      {step === 'payment' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-8)', alignItems: 'start' }}>
          <div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 'var(--space-5)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              onClick={() => setStep('address')}
            >
              <ArrowLeft size={16} /> Ubah Alamat & Kurir Pengiriman
            </button>

            {/* Address & Shipping Review Summary */}
            <div style={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                    Alamat Pengiriman Terpilih
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>{address.label || 'Alamat'}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{address.fullName} ({address.phone})</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', marginTop: '2px' }}>
                  {address.street}, {[address.village, address.district, address.city, address.province, address.postalCode].filter(Boolean).join(', ')}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Truck size={16} style={{ color: 'var(--clr-gold)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--clr-text)' }}>
                    {selectedShipping?.name} ({selectedShipping?.service}) - Est. {selectedShipping?.etd}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--clr-gold)' }}>
                  {formatPrice(selectedShipping?.cost || 0)}
                </span>
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: 'var(--space-6)' }}>Metode Pembayaran</h2>

            {/* Payment method selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {[
                { key: 'credit_card', label: 'Kartu Kredit', icon: CreditCard },
                { key: 'gopay', label: 'GoPay / QRIS', icon: Smartphone },
                { key: 'cod', label: 'COD (Bayar di Tempat)', icon: Package },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPaymentMethod(key as PaymentMethod)}
                  style={{
                    padding: 'var(--space-4)',
                    background: paymentMethod === key ? 'var(--clr-gold-muted)' : 'var(--clr-bg-2)',
                    border: `1px solid ${paymentMethod === key ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={24} style={{ color: paymentMethod === key ? 'var(--clr-gold)' : 'var(--clr-text-2)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: paymentMethod === key ? 'var(--clr-gold)' : 'var(--clr-text)' }}>{label}</span>
                </button>
              ))}
            </div>

            {/* Credit card form */}
            {paymentMethod === 'credit_card' && (
              <div style={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', animation: 'fadeIn 0.3s both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
                  <Lock size={14} style={{ color: 'var(--clr-gold)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Data Kartu Terenkripsi (DEMO)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Nomor Kartu</label>
                    <input
                      className={`input ${cardErrors.number ? 'error' : ''}`}
                      placeholder="4242 4242 4242 4242"
                      value={card.number}
                      maxLength={19}
                      onChange={(e) => { setCard((p) => ({ ...p, number: formatCardNumber(e.target.value) })); setCardErrors((p) => ({ ...p, number: '' })); }}
                    />
                    {cardErrors.number && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{cardErrors.number}</span>}
                    <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-3)' }}>Tip: Kartu ending 0000 akan selalu gagal (untuk simulasi penolakan)</span>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Expired (MM/YY)</label>
                    <input className={`input ${cardErrors.expiry ? 'error' : ''}`} placeholder="12/28" value={card.expiry} maxLength={5}
                      onChange={(e) => { setCard((p) => ({ ...p, expiry: formatExpiry(e.target.value) })); setCardErrors((p) => ({ ...p, expiry: '' })); }} />
                    {cardErrors.expiry && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{cardErrors.expiry}</span>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">CVV</label>
                    <input className={`input ${cardErrors.cvv ? 'error' : ''}`} placeholder="123" type="password" maxLength={4} value={card.cvv}
                      onChange={(e) => { setCard((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '') })); setCardErrors((p) => ({ ...p, cvv: '' })); }} />
                    {cardErrors.cvv && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{cardErrors.cvv}</span>}
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Nama di Kartu</label>
                    <input className={`input ${cardErrors.name ? 'error' : ''}`} placeholder="SARAH JOHNSON" value={card.name}
                      onChange={(e) => { setCard((p) => ({ ...p, name: e.target.value.toUpperCase() })); setCardErrors((p) => ({ ...p, name: '' })); }} />
                    {cardErrors.name && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{cardErrors.name}</span>}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'gopay' && (
              <div style={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center', animation: 'fadeIn 0.3s both' }}>
                <Smartphone size={48} style={{ color: 'var(--clr-gold)', margin: '0 auto var(--space-4)' }} />
                <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Bayar via GoPay / QRIS</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>Klik bayar sekarang dan transaksi simulasi QRIS akan diproses secara otomatis.</p>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div style={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center', animation: 'fadeIn 0.3s both' }}>
                <Package size={48} style={{ color: 'var(--clr-gold)', margin: '0 auto var(--space-4)' }} />
                <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Bayar di Tempat (COD)</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>Siapkan uang tunai sejumlah {formatPrice(total)} saat kurir tiba di alamat Anda.</p>
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 'var(--space-8)' }} onClick={handlePlaceOrder} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Bayar Sekarang - {formatPrice(total)}</>}
            </button>
          </div>

          {/* Order summary */}
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
            selectedShipping={selectedShipping}
          />
        </div>
      )}
    </div>
  );
}

function OrderSummary({ items, subtotal, shipping, tax, total, selectedShipping }: {
  items: import('@/types').CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  selectedShipping: ShippingCostOption | null;
}) {
  return (
    <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 'calc(var(--nav-height) + 16px)' }}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.1rem', marginBottom: 'var(--space-5)' }}>Pesanan Anda</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', maxHeight: '280px', overflowY: 'auto' }}>
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}-${item.color}`} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '52px', height: '68px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--clr-bg-3)' }}>
              <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', background: 'var(--clr-gold)', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.product.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)' }}>{item.size} • {item.color}</p>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatPrice(item.product.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <hr className="divider" />
      {[
        { label: 'Subtotal', value: formatPrice(subtotal) },
        { label: selectedShipping ? `Ongkir (${selectedShipping.name} ${selectedShipping.service})` : 'Ongkir', value: shipping === 0 ? 'Pilih Kurir' : formatPrice(shipping) },
        { label: 'PPN (10%)', value: formatPrice(tax) },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--clr-text-2)' }}>{label}</span>
          <span style={{ color: label.startsWith('Ongkir') && shipping > 0 ? 'var(--clr-gold)' : 'inherit', fontWeight: label.startsWith('Ongkir') && shipping > 0 ? 600 : 400 }}>{value}</span>
        </div>
      ))}
      <hr className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>Total</span>
        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--clr-gold)' }}>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
