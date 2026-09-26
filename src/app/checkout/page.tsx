'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CreditCard, Smartphone, Package, CheckCircle, XCircle, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { formatPrice } from '@/lib/utils';
import type { Address, PaymentResult } from '@/types';

type Step = 'address' | 'payment' | 'processing' | 'result';
type PaymentMethod = 'credit_card' | 'gopay' | 'cod';

const PROVINCES = ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Bali', 'Sumatera Utara', 'Sulawesi Selatan', 'Kalimantan Timur'];

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

  const [address, setAddress] = useState<Address>({
    fullName: user?.name || '',
    phone: '',
    street: '',
    city: '',
    province: 'DKI Jakarta',
    postalCode: '',
    country: 'Indonesia',
  });

  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && items.length === 0 && step === 'address') router.push('/cart'); }, [mounted, items, step]);

  if (!mounted) return null;

  const subtotal = totalPrice();
  const shipping = subtotal >= 5000000 ? 0 : 50000;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  const validateAddress = () => {
    const e: Record<string, string> = {};
    if (!address.fullName) e.fullName = 'Nama wajib diisi';
    if (!address.phone || address.phone.length < 9) e.phone = 'Nomor HP tidak valid';
    if (!address.street) e.street = 'Alamat wajib diisi';
    if (!address.city) e.city = 'Kota wajib diisi';
    if (!address.postalCode || address.postalCode.length < 5) e.postalCode = 'Kode pos tidak valid';
    setAddrErrors(e);
    return !Object.keys(e).length;
  };

  const validateCard = () => {
    if (paymentMethod !== 'credit_card') return true;
    const e: Record<string, string> = {};
    const clean = card.number.replace(/\s/g, '');
    if (!clean || clean.length < 13) e.number = 'Nomor kartu tidak valid';
    if (!card.expiry || !/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'Format: MM/YY';
    if (!card.cvv || card.cvv.length < 3) e.cvv = 'CVV tidak valid';
    if (!card.name) e.name = 'Nama pemegang kartu wajib diisi';
    setCardErrors(e);
    return !Object.keys(e).length;
  };

  const formatCardNumber = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  const handlePlaceOrder = async () => {
    if (!validateCard()) return;
    setIsSubmitting(true);
    setStep('processing');

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items, address, paymentMethod, notes: '' }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error);
      const newOrderId = orderData.data.id;
      setOrderId(newOrderId);

      // Simulate processing delay
      await new Promise((r) => setTimeout(r, 2500));

      // 2. Process payment
      const payRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      if (payData.data.success) clearCart();
      setStep('result');
    } catch {
      showToast('Terjadi kesalahan. Coba lagi.', 'error');
      setStep('payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      {/* Progress Steps */}
      {step !== 'processing' && step !== 'result' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-10)', maxWidth: '480px' }}>
          {[
            { key: 'address', label: 'Alamat' },
            { key: 'payment', label: 'Pembayaran' },
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
                <span style={{ fontSize: '0.8rem', color: step === s.key ? 'var(--clr-text)' : 'var(--clr-text-2)', fontWeight: step === s.key ? 600 : 400 }}>{s.label}</span>
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
            <p style={{ color: 'var(--clr-text-2)' }}>Harap tunggu, jangan tutup halaman ini...</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', animation: 'pulse 1.5s ease infinite' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--clr-gold)', animationDelay: `${i * 0.2}s` }} />
            ))}
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
                { label: 'Total', value: formatPrice(paymentResult.amount) },
                { label: 'Metode', value: paymentResult.method === 'credit_card' ? 'Kartu Kredit' : paymentResult.method === 'gopay' ? 'GoPay' : 'COD' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--clr-border)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>{label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
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

      {/* Address Step */}
      {step === 'address' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-8)', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: 'var(--space-6)' }}>Alamat Pengiriman</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
              {[
                { key: 'fullName', label: 'Nama Lengkap', placeholder: 'John Doe', col: '1 / -1' },
                { key: 'phone', label: 'Nomor HP', placeholder: '08xxxxxxxxxx', col: undefined },
                { key: 'postalCode', label: 'Kode Pos', placeholder: '12345', col: undefined },
                { key: 'street', label: 'Alamat Lengkap', placeholder: 'Jl. Sudirman No. 1, Lantai 5', col: '1 / -1' },
                { key: 'city', label: 'Kota', placeholder: 'Jakarta', col: undefined },
              ].map((f) => (
                <div key={f.key} className="input-group" style={{ gridColumn: f.col }}>
                  <label className="input-label">{f.label}</label>
                  <input
                    className={`input ${addrErrors[f.key] ? 'error' : ''}`}
                    placeholder={f.placeholder}
                    value={address[f.key as keyof Address] as string}
                    onChange={(e) => {
                      setAddress((p) => ({ ...p, [f.key]: e.target.value }));
                      setAddrErrors((p) => ({ ...p, [f.key]: '' }));
                    }}
                  />
                  {addrErrors[f.key] && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{addrErrors[f.key]}</span>}
                </div>
              ))}
              <div className="input-group">
                <label className="input-label">Provinsi</label>
                <select className="input select" value={address.province} onChange={(e) => setAddress((p) => ({ ...p, province: e.target.value }))}>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-8)' }} onClick={() => { if (validateAddress()) setStep('payment'); }}>
              Lanjut ke Pembayaran
            </button>
          </div>

          {/* Order summary */}
          <OrderSummary items={items} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
        </div>
      )}

      {/* Payment Step */}
      {step === 'payment' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-8)', alignItems: 'start' }}>
          <div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-5)' }} onClick={() => setStep('address')}>
              <ArrowLeft size={14} /> Ubah Alamat
            </button>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: 'var(--space-6)' }}>Metode Pembayaran</h2>

            {/* Method selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {[
                { value: 'credit_card' as const, icon: CreditCard, label: 'Kartu Kredit / Debit', desc: 'Visa, Mastercard, JCB' },
                { value: 'gopay' as const, icon: Smartphone, label: 'GoPay', desc: 'Bayar dengan saldo GoPay' },
                { value: 'cod' as const, icon: Package, label: 'COD (Bayar di Tempat)', desc: 'Bayar saat barang tiba' },
              ].map((m) => (
                <div
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  style={{
                    padding: 'var(--space-5)',
                    border: `1px solid ${paymentMethod === m.value ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: paymentMethod === m.value ? 'var(--clr-gold-muted)' : 'var(--clr-bg-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: paymentMethod === m.value ? 'rgba(201,168,76,0.2)' : 'var(--clr-bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <m.icon size={22} style={{ color: paymentMethod === m.value ? 'var(--clr-gold)' : 'var(--clr-text-2)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, marginBottom: '2px' }}>{m.label}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>{m.desc}</p>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${paymentMethod === m.value ? 'var(--clr-gold)' : 'var(--clr-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {paymentMethod === m.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--clr-gold)' }} />}
                  </div>
                </div>
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-3)' }}>Tip: Kartu ending 0000 akan selalu gagal (untuk tes)</span>
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
                    <input className={`input ${cardErrors.name ? 'error' : ''}`} placeholder="JOHN DOE" value={card.name}
                      onChange={(e) => { setCard((p) => ({ ...p, name: e.target.value.toUpperCase() })); setCardErrors((p) => ({ ...p, name: '' })); }} />
                    {cardErrors.name && <span style={{ fontSize: '0.75rem', color: 'var(--clr-error)' }}>{cardErrors.name}</span>}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'gopay' && (
              <div style={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center', animation: 'fadeIn 0.3s both' }}>
                <Smartphone size={48} style={{ color: 'var(--clr-gold)', margin: '0 auto var(--space-4)' }} />
                <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Bayar via GoPay</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>Klik bayar sekarang dan QR code mock akan diproses secara otomatis.</p>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div style={{ background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', textAlign: 'center', animation: 'fadeIn 0.3s both' }}>
                <Package size={48} style={{ color: 'var(--clr-gold)', margin: '0 auto var(--space-4)' }} />
                <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Bayar di Tempat (COD)</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>Siapkan uang tunai {formatPrice(total)} saat kurir tiba.</p>
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 'var(--space-8)' }} onClick={handlePlaceOrder} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Bayar Sekarang — {formatPrice(total)}</>}
            </button>
          </div>

          <OrderSummary items={items} subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
        </div>
      )}
    </div>
  );
}

function OrderSummary({ items, subtotal, shipping, tax, total }: {
  items: import('@/types').CartItem[];
  subtotal: number; shipping: number; tax: number; total: number;
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
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)' }}>{item.size} · {item.color}</p>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatPrice(item.product.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <hr className="divider" />
      {[
        { label: 'Subtotal', value: formatPrice(subtotal) },
        { label: 'Ongkir', value: shipping === 0 ? 'Gratis!' : formatPrice(shipping) },
        { label: 'PPN (10%)', value: formatPrice(tax) },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--clr-text-2)' }}>{label}</span>
          <span style={{ color: label === 'Ongkir' && shipping === 0 ? 'var(--clr-success)' : 'inherit' }}>{value}</span>
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
