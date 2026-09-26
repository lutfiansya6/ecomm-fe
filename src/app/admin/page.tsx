'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/utils';
import {
  Users, Package, ShoppingBag, TrendingUp,
  Edit2, Trash2, Plus, X, Check
} from 'lucide-react';
import type { Product } from '@/types';
import Image from 'next/image';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
}

export default function AdminPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, pendingOrders: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'stats' | 'products'>('stats');

  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordRes, prodRes] = await Promise.all([
        fetch('/api/orders', { headers }),
        fetch('/api/products'),
      ]);
      const ordData = await ordRes.json();
      const prodData = await prodRes.json();

      const orders = ordData.data?.orders || [];
      setStats({
        totalOrders: orders.length,
        totalRevenue: orders.filter((o: { paymentStatus: string }) => o.paymentStatus === 'paid').reduce((s: number, o: { total: number }) => s + o.total, 0),
        totalProducts: prodData.data?.total || 0,
        pendingOrders: orders.filter((o: { orderStatus: string }) => o.orderStatus === 'pending').length,
      });
      setProducts(prodData.data?.products || []);
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const handleUpdateStock = async (id: string) => {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock: editStock }),
    });
    setProducts((p) => p.map((prod) => prod.id === id ? { ...prod, stock: editStock } : prod));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setProducts((p) => p.filter((prod) => prod.id !== id));
  };

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9rem', marginTop: 'var(--space-1)' }}>LUXE — Prototype Control Panel</p>
        </div>
        <span className="badge badge-gold" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>Admin Access</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-4)' }}>
        {[
          { key: 'stats', label: 'Overview' },
          { key: 'products', label: 'Produk' },
        ].map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(t.key as 'stats' | 'products')}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <>
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div style={{ animation: 'fadeIn 0.3s both' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-10)' }}>
                {[
                  { icon: ShoppingBag, label: 'Total Orders', value: stats.totalOrders, suffix: 'pesanan', color: 'var(--clr-gold)' },
                  { icon: TrendingUp, label: 'Total Revenue', value: formatPrice(stats.totalRevenue), suffix: '(lunas)', color: 'var(--clr-success)' },
                  { icon: Package, label: 'Total Produk', value: stats.totalProducts, suffix: 'SKU', color: 'var(--clr-gold)' },
                  { icon: Users, label: 'Pending Orders', value: stats.pendingOrders, suffix: 'menunggu', color: 'var(--clr-warning)' },
                ].map(({ icon: Icon, label, value, suffix, color }) => (
                  <div key={label} className="card" style={{ padding: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--clr-text-2)' }}>{label}</span>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--clr-text)', lineHeight: 1 }}>{value}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', marginTop: '4px' }}>{suffix}</p>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, marginBottom: 'var(--space-2)' }}>Catatan Prototype</h3>
                <p style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem', lineHeight: '1.8' }}>
                  Data ini adalah data dummy in-memory. Setiap server restart, data kembali ke kondisi awal.
                  API Routes sudah fully functional dan dapat dites via endpoint <code style={{ color: 'var(--clr-gold)', background: 'var(--clr-bg-3)', padding: '2px 6px', borderRadius: '4px' }}>/api/*</code>.
                </p>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div style={{ animation: 'fadeIn 0.3s both' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      {['Produk', 'Kategori', 'Harga', 'Stok', 'Rating', 'Aksi'].map((h) => (
                        <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-2)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, i) => (
                      <tr key={product.id} style={{ borderBottom: '1px solid var(--clr-border)', animation: `fadeIn 0.3s ${i * 0.03}s both` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--clr-bg-3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ position: 'relative', width: '44px', height: '56px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--clr-bg-3)' }}>
                              <Image src={product.images[0]} alt={product.name} fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 600 }}>{product.name}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>{product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className="badge badge-neutral">{product.category}</span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{formatPrice(product.price)}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {editingId === product.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <input
                                className="input"
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(Number(e.target.value))}
                                style={{ width: '70px', padding: '4px 8px', fontSize: '0.875rem' }}
                              />
                              <button onClick={() => handleUpdateStock(product.id)} style={{ color: 'var(--clr-success)', cursor: 'pointer' }}>
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditingId(null)} style={{ color: 'var(--clr-error)', cursor: 'pointer' }}>
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: product.stock <= 5 ? 'var(--clr-warning)' : product.stock === 0 ? 'var(--clr-error)' : 'var(--clr-text)' }}>
                              {product.stock}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--clr-gold)' }}>
                          ★ {product.rating} ({product.reviewCount})
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              onClick={() => { setEditingId(product.id); setEditStock(product.stock); }}
                              title="Edit stok"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              onClick={() => handleDelete(product.id)}
                              title="Hapus produk"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
