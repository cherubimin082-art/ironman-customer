import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const tomorrowStr = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const parseSlotEndMinutes = (s) => {
  if (!s) return null;
  const parts = s.split(/\s[–\-]\s/);
  if (parts.length < 2) return null;
  const m = parts[parts.length - 1].trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

// Mirrors backend utils/scheduling.js — weekday name for a YYYY-MM-DD string,
// UTC-anchored so it never disagrees with the server's own calculation.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayOf = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};
const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
};
// Push forward past the vendor's weekly leave day if the date lands on it.
const skipLeaveDay = (dateStr, leaveDay) =>
  leaveDay && weekdayOf(dateStr) === leaveDay ? addDays(dateStr, 1) : dateStr;

/* ─── Garment Card ─── */
function GarmentCard({ garment }) {
  const { cart, addToCart, removeFromCart } = useOrder();
  const qty = cart.find(g => g.id === garment.id)?.qty || 0;
  const active = qty > 0;

  return (
    <div style={{
      position: 'relative', background: 'white', borderRadius: 20,
      border: active ? '2px solid #B91C1C' : '1.5px solid #F1F5F9',
      boxShadow: active ? '0 4px 20px rgba(185,28,28,0.13)' : '0 1px 6px rgba(0,0,0,0.05)',
      padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      {/* Qty badge */}
      {active && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>{qty}</span>
        </div>
      )}

      {/* Icon */}
      <div style={{ width: 64, height: 64, borderRadius: 18, background: active ? '#FEF2F2' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {garment.image_url
          ? <img src={garment.image_url} alt={garment.name} style={{ width: 40, height: 40, objectFit: 'contain' }} />
          : <span style={{ fontSize: 36 }}>{garment.icon}</span>}
      </div>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{garment.name}</p>
        <p style={{ fontSize: 13, fontWeight: 800, color: active ? '#B91C1C' : '#64748B', margin: '4px 0 0' }}>₹{garment.price}</p>
      </div>

      {qty === 0 ? (
        <button
          onClick={() => addToCart(garment)}
          style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: '#B91C1C', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >Add</button>
      ) : (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#B91C1C', borderRadius: 12, padding: '4px 6px' }}>
          <button onClick={() => removeFromCart(garment.id)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 20, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>{qty}</span>
          <button onClick={() => addToCart(garment)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 20, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ─── */
function GarmentSkeleton() {
  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, width: 80, background: '#F1F5F9', borderRadius: 99 }} />
      <div style={{ height: 12, width: 48, background: '#F1F5F9', borderRadius: 99 }} />
      <div style={{ height: 38, width: '100%', background: '#F1F5F9', borderRadius: 12 }} />
    </div>
  );
}

/* ─── Cart Summary (desktop sidebar) ─── */
function CartSummary({ cart, cartTotal, cartCount, step, setStep, placing, handlePlaceOrder, clearCart }) {
  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #F1F5F9', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'sticky', top: 90 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Your Cart</p>
        {cartCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: '#B91C1C', padding: '2px 8px', borderRadius: 99 }}>
            {cartCount} item{cartCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {cart.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>Cart is empty</p>
          <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }}>Select garments to add</p>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 20px', maxHeight: 240, overflowY: 'auto' }}>
            {cart.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{g.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>× {g.qty}</p>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', flexShrink: 0 }}>₹{g.price * g.qty}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#B91C1C' }}>₹{cartTotal}</span>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            {step === 'garments' ? (
              <button
                onClick={() => setStep('confirm')}
                style={{ width: '100%', padding: '13px', borderRadius: 14, background: '#B91C1C', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Proceed to Checkout
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                style={{ width: '100%', padding: '13px', borderRadius: 14, background: placing ? '#E57373' : '#B91C1C', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: placing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {placing ? (
                  <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Processing…</>
                ) : (
                  <>Pay ₹{cartTotal}</>
                )}
              </button>
            )}
            {cartCount > 0 && (
              <button onClick={() => { clearCart(); setStep('garments'); }} style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 12, background: 'none', color: '#94A3B8', fontSize: 12.5, fontWeight: 600, border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                Clear cart
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function OrderPage() {
  const { cart, cartTotal, cartCount, garments, garmentsLoading, reloadGarments, loadOrders, apartments, clearCart } = useOrder();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('All');
  const [step, setStep]       = useState('garments');
  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);
  const aptSetRef  = useRef(false);

  const [apartment, setApartment] = useState(user?.apartment || '');
  const [pickupDate, setPickupDate] = useState('');
  const [slotTimeOver, setSlotTimeOver] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const categories = ['All', ...new Set(garments.map(g => g.category))];
  const filtered   = activeCategory === 'All' ? garments : garments.filter(g => g.category === activeCategory);
  const today      = todayStr();
  const aptData    = apartments.find(a => a.name === apartment);
  const fixedTime  = aptData?.pickup_time  ?? null;
  const delivTime  = aptData?.delivery_time ?? null;

  const minDate = (() => {
    if (!fixedTime) return today;
    const end = parseSlotEndMinutes(fixedTime);
    if (!end) return today;
    const now = new Date();
    return (now.getHours() * 60 + now.getMinutes()) >= end ? tomorrowStr() : today;
  })();

  useEffect(() => { reloadGarments(); }, [reloadGarments]);
  useEffect(() => {
    if (!aptSetRef.current && user?.apartment && apartments.length > 0) {
      aptSetRef.current = true;
      handleAptChange(user.apartment);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartments]);

  const handleAptChange = (val) => {
    setApartment(val); setConfirmError('');
    const apt = apartments.find(a => a.name === val);
    const end = parseSlotEndMinutes(apt?.pickup_time);
    if (end !== null) {
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      const candidate = cur < end ? todayStr() : tomorrowStr();
      setPickupDate(skipLeaveDay(candidate, apt?.vendor_leave_day));
      setSlotTimeOver(cur >= end);
    } else {
      setPickupDate(''); setSlotTimeOver(false);
    }
  };

  const loadRazorpay = () => new Promise(res => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });

  const handlePlaceOrder = async () => {
    if (placingRef.current) return;
    if (!apartment)  return setConfirmError('Please select your apartment');
    if (!pickupDate) return setConfirmError('Please select a pickup date');
    if (fixedTime && pickupDate === today) {
      const end = parseSlotEndMinutes(fixedTime);
      const now = new Date();
      if (end && (now.getHours() * 60 + now.getMinutes()) >= end) {
        setConfirmError("Today's pickup slot has passed. Moved to tomorrow.");
        setPickupDate(tomorrowStr()); setSlotTimeOver(true); return;
      }
    }
    setConfirmError(''); placingRef.current = true; setPlacing(true);

    let coords = null;
    if (navigator.geolocation) {
      coords = await new Promise(res =>
        navigator.geolocation.getCurrentPosition(
          p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => res(null), { timeout: 5000 }
        )
      );
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const items = cart.map(g => ({ garment_id: g.id, garment_name: g.name, quantity: g.qty, unit_price: g.price }));
        const { data: rzp } = await api.post('/payment/create-order', { amount: cartTotal, items });
        const token = localStorage.getItem('si_token') || '';
        const params = new URLSearchParams({
          rzp_order_id: rzp.razorpay_order_id, key: rzp.key_id, amount: String(rzp.amount),
          items: btoa(JSON.stringify(items)), apartment, pickup_date: pickupDate,
          lat: coords?.latitude != null ? String(coords.latitude) : '',
          lng: coords?.longitude != null ? String(coords.longitude) : '', token,
        });
        const listener = await Browser.addListener('browserFinished', async () => {
          listener.remove(); await loadOrders(); navigate('/orders');
        });
        await Browser.open({ url: `https://dev.ironman.today/pay?${params}`, toolbarColor: '#B91C1C', presentationStyle: 'fullscreen' });
      } catch (err) {
        setConfirmError(err?.response?.data?.message || err?.message || 'Payment failed.');
      } finally { placingRef.current = false; setPlacing(false); }
      return;
    }

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setConfirmError('Could not load payment gateway.'); placingRef.current = false; setPlacing(false); return; }
      const items = cart.map(g => ({ garment_id: g.id, garment_name: g.name, quantity: g.qty, unit_price: g.price }));
      const { data: rzp } = await api.post('/payment/create-order', { amount: cartTotal, items });
      await new Promise((resolve, reject) => {
        let paid = false;
        const options = {
          key: rzp.key_id, amount: rzp.amount, currency: rzp.currency,
          name: 'Iron Man', description: 'Ironing Service', order_id: rzp.razorpay_order_id,
          prefill: { name: user?.name || '', contact: user?.phone || '' },
          theme: { color: '#B91C1C' },
          handler: async (r) => {
            paid = true;
            try {
              const { data } = await api.post('/payment/verify-and-place', {
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_order_id: r.razorpay_order_id,
                razorpay_signature: r.razorpay_signature,
                items, apartment, pickup_date: pickupDate,
                latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null,
              });
              await loadOrders(); clearCart(); resolve(data.order);
            } catch (e) { reject(e); }
          },
          modal: { ondismiss: () => { if (!paid) reject(new Error('dismissed')); } },
        };
        const r = new window.Razorpay(options);
        r.on('payment.failed', e => reject(new Error(e.error?.description || 'Payment failed')));
        r.open();
      }).then(order => navigate(`/track?id=${order.id}`));
    } catch (err) {
      if (err?.message !== 'dismissed')
        setConfirmError(err?.response?.data?.message || err?.message || 'Payment failed.');
    } finally { placingRef.current = false; setPlacing(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F8', paddingBottom: 96 }}>

      {/* ── Header ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #F1F5F9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))', paddingBottom: 14 }}>

            {/* Back */}
            <button
              onClick={() => step === 'garments' ? navigate('/home') : setStep('garments')}
              style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Title + Steps */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {step === 'garments' ? 'Book Ironing' : 'Confirm Order'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                {['garments', 'confirm'].map((s, i) => {
                  const done = s === 'garments' && step === 'confirm';
                  const active = s === step;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: (active || done) ? '#B91C1C' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                          {done
                            ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
                            : <span style={{ fontSize: 9, fontWeight: 800, color: active ? 'white' : '#94A3B8' }}>{i + 1}</span>}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: active ? '#B91C1C' : '#94A3B8' }}>
                          {s === 'garments' ? 'Garments' : 'Confirm'}
                        </span>
                      </div>
                      {i === 0 && <div style={{ width: 28, height: 2, borderRadius: 99, background: step === 'confirm' ? '#B91C1C' : '#E2E8F0', transition: 'background 0.2s' }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clear cart */}
            {cartCount > 0 && (
              <button
                onClick={() => { clearCart(); setStep('garments'); }}
                style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 24 }} className="lg-two-col">

          {/* Left */}
          <div>
            {/* ── GARMENTS STEP ── */}
            {step === 'garments' && (
              <>
                {/* Category chips */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none' }}>
                  {categories.map(cat => {
                    const count = cat === 'All' ? garments.length : garments.filter(g => g.category === cat).length;
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                          background: active ? '#B91C1C' : 'white',
                          color: active ? 'white' : '#475569',
                          boxShadow: active ? '0 3px 10px rgba(185,28,28,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                      >
                        {cat}
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: active ? 'rgba(255,255,255,0.2)' : '#F8FAFC', color: active ? 'white' : '#94A3B8' }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Garment grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 12 }}>
                  {garmentsLoading
                    ? Array.from({ length: 6 }).map((_, i) => <GarmentSkeleton key={i} />)
                    : filtered.map(g => <GarmentCard key={g.id} garment={g} />)}
                </div>
              </>
            )}

            {/* ── CONFIRM STEP ── */}
            {step === 'confirm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Order items */}
                <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Order Items</p>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    {cart.map(g => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 20 }}>{g.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>{g.name}</p>
                          <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '2px 0 0' }}>× {g.qty} &nbsp;·&nbsp; ₹{g.price} each</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>₹{g.price * g.qty}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1.5px dashed #F1F5F9', marginTop: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Total Amount</span>
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#B91C1C' }}>₹{cartTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery details */}
                <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Pickup Details</p>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Apartment */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                        Apartment <span style={{ color: '#B91C1C' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={apartment}
                          onChange={e => handleAptChange(e.target.value)}
                          style={{
                            width: '100%', appearance: 'none', fontSize: 14, borderRadius: 14, padding: '12px 40px 12px 16px', outline: 'none',
                            border: apartment ? '1.5px solid #B91C1C' : '1.5px solid #E2E8F0',
                            background: 'white', color: apartment ? '#0F172A' : '#94A3B8',
                            boxShadow: apartment ? '0 0 0 3px rgba(185,28,28,0.06)' : 'none',
                          }}
                        >
                          <option value="" disabled>Choose your apartment…</option>
                          {apartments.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                        </select>
                        <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" width="16" height="16">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                      {user?.apartment && apartment === user.apartment && (
                        <p style={{ fontSize: 11, color: '#64748B', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
                          Pre-filled from your profile
                        </p>
                      )}
                    </div>

                    {/* Date + Time */}
                    <div style={{ display: 'grid', gridTemplateColumns: fixedTime ? '1fr 1fr' : '1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                          Pickup Date <span style={{ color: '#B91C1C' }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={pickupDate}
                          min={minDate}
                          onChange={e => {
                            const raw = e.target.value;
                            if (raw < minDate) {
                              setPickupDate(skipLeaveDay(minDate, aptData?.vendor_leave_day));
                              setSlotTimeOver(minDate > today);
                            } else {
                              setPickupDate(skipLeaveDay(raw, aptData?.vendor_leave_day));
                              setSlotTimeOver(false);
                            }
                            setConfirmError('');
                          }}
                          style={{
                            width: '100%', fontSize: 14, borderRadius: 14, padding: '12px 16px', outline: 'none', boxSizing: 'border-box',
                            border: pickupDate ? '1.5px solid #B91C1C' : '1.5px solid #E2E8F0',
                            background: 'white', color: pickupDate ? '#0F172A' : '#94A3B8',
                            boxShadow: pickupDate ? '0 0 0 3px rgba(185,28,28,0.06)' : 'none',
                          }}
                        />
                        {aptData?.vendor_leave_day && (
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: '5px 0 0' }}>
                            Shop closed {aptData.vendor_leave_day}s — those dates auto-skip.
                          </p>
                        )}
                      </div>
                      {fixedTime && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Pickup Time</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 14, padding: '12px 16px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#B91C1C' }}>{fixedTime}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {slotTimeOver && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: '12px 16px', background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
                        <svg style={{ flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <p style={{ fontSize: 12.5, color: '#92400E', fontWeight: 500, margin: 0 }}>
                          Today's slot has passed. Pickup moved to <strong>tomorrow</strong>.
                        </p>
                      </div>
                    )}

                    {delivTime && (
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Delivery Time</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 14, padding: '12px 16px', background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1D4ED8' }}>{delivTime}</span>
                          <span style={{ fontSize: 11, color: '#60A5FA', marginLeft: 'auto' }}>Clothes delivered back</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Payment</p>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '14px 16px', background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Razorpay</p>
                        <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '2px 0 0' }}>UPI · Cards · Net Banking · Wallets</p>
                      </div>
                      <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {confirmError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '13px 16px', background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ fontSize: 13.5, color: '#DC2626', fontWeight: 500, margin: 0 }}>{confirmError}</p>
                  </div>
                )}

                {/* Mobile pay button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  style={{ display: 'block', width: '100%', padding: '16px', borderRadius: 18, background: placing ? '#E57373' : '#B91C1C', color: 'white', fontSize: 16, fontWeight: 800, border: 'none', cursor: placing ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(185,28,28,0.35)' }}
                  className="lg-hide"
                >
                  {placing ? 'Processing…' : `Pay ₹${cartTotal}`}
                </button>
              </div>
            )}
          </div>

          {/* Right: Cart sidebar (desktop only) */}
          <div className="lg-show" style={{ display: 'none' }}>
            <CartSummary
              cart={cart} cartTotal={cartTotal} cartCount={cartCount}
              step={step} setStep={setStep} placing={placing}
              handlePlaceOrder={handlePlaceOrder} clearCart={clearCart}
            />
          </div>
        </div>
      </div>

      {/* Mobile floating checkout bar */}
      {step === 'garments' && cartCount > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))', padding: '0 16px', zIndex: 40 }}>
          <button
            onClick={() => setStep('confirm')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: 20, background: '#B91C1C', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(185,28,28,0.4)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white' }}>
                {cartCount}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{cartCount} item{cartCount !== 1 ? 's' : ''} selected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>₹{cartTotal}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .lg-two-col { grid-template-columns: minmax(0,1fr) 300px !important; }
          .lg-show { display: block !important; }
          .lg-hide { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
