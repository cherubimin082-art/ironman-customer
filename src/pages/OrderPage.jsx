import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ChevronLeftIcon, CheckIcon, ArrowRightIcon, ClockIcon, CalendarIcon } from '../components/Icons';
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

/* ── Garment Card ── */
function GarmentCard({ garment }) {
  const { cart, addToCart, removeFromCart } = useOrder();
  const qty = cart.find(g => g.id === garment.id)?.qty || 0;
  const active = qty > 0;

  return (
    <div
      className="relative bg-white rounded-2xl p-4 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer select-none"
      style={{
        border: active ? '1.5px solid #B91C1C' : '1.5px solid #F1F5F9',
        boxShadow: active ? '0 4px 16px rgba(220,38,38,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {active && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{qty}</span>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: active ? '#FEF2F2' : '#F8F9FB' }}
      >
        {garment.image_url
          ? <img src={garment.image_url} alt={garment.name} className="w-10 h-10 object-contain" />
          : <span className="text-4xl">{garment.icon}</span>}
      </div>

      <div className="text-center w-full">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{garment.name}</p>
        <p className="text-sm font-bold mt-0.5" style={{ color: active ? '#B91C1C' : '#64748B' }}>₹{garment.price}</p>
      </div>

      {qty === 0 ? (
        <button
          onClick={() => addToCart(garment)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: '#B91C1C', color: '#fff' }}
        >
          Add
        </button>
      ) : (
        <div className="w-full flex items-center justify-between rounded-xl px-1.5 py-1.5" style={{ background: '#B91C1C' }}>
          <button
            onClick={() => removeFromCart(garment.id)}
            className="w-8 h-8 flex items-center justify-center text-white text-xl font-bold hover:bg-white/20 rounded-lg transition-colors"
          >−</button>
          <span className="text-white text-sm font-bold w-5 text-center">{qty}</span>
          <button
            onClick={() => addToCart(garment)}
            className="w-8 h-8 flex items-center justify-center text-white text-xl font-bold hover:bg-white/20 rounded-lg transition-colors"
          >+</button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
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
    const end = parseSlotEndMinutes(apartments.find(a => a.name === val)?.pickup_time);
    if (end !== null) {
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      setPickupDate(cur < end ? todayStr() : tomorrowStr());
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
        const { data: rzp } = await api.post('/payment/create-order', { amount: cartTotal });
        const items = cart.map(g => ({ garment_id: g.id, garment_name: g.name, quantity: g.qty, unit_price: g.price }));
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
      const { data: rzp } = await api.post('/payment/create-order', { amount: cartTotal });
      const items = cart.map(g => ({ garment_id: g.id, garment_name: g.name, quantity: g.qty, unit_price: g.price }));
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

  /* ── Cart Sidebar ── */
  const Sidebar = () => (
    <div className="hidden lg:block">
      <div className="sticky top-24 rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F1F5F9', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

        {/* Header */}
        <div className="bg-white px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your Order</p>
            {cartCount > 0 && (
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#B91C1C' }}>
                {cartCount} item{cartCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white px-5 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F8F9FB' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500">Cart is empty</p>
            <p className="text-xs text-slate-400 mt-1">Pick garments from the list</p>
          </div>
        ) : (
          <div className="bg-white">
            <div className="px-5 py-3 space-y-3 max-h-60 overflow-y-auto">
              {cart.map(g => (
                <div key={g.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{g.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{g.name}</p>
                      <p className="text-[10px] text-slate-400">× {g.qty}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-800 shrink-0">₹{g.price * g.qty}</span>
                </div>
              ))}
            </div>

            <div className="mx-5 py-3" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">Total</span>
                <span className="text-lg font-black" style={{ color: '#B91C1C' }}>₹{cartTotal}</span>
              </div>
            </div>

            <div className="px-5 pb-5">
              {step === 'garments' ? (
                <button
                  onClick={() => setStep('confirm')}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: '#B91C1C' }}
                >
                  Proceed to Checkout <ArrowRightIcon size={14} />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#B91C1C' }}
                >
                  {placing
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                    : <><CheckIcon size={15} />Pay ₹{cartTotal}</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 lg:pb-12" style={{ background: 'linear-gradient(160deg, #fff0f3 0%, #F5F5F8 25%, #F5F5F8 100%)' }}>

      {/* ── Header ── */}
      <div className="bg-white sticky top-0 z-30" style={{ borderBottom: '1px solid #F1F5F9', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:pt-5 pb-3" style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))' }}>

            <button
              onClick={() => step === 'garments' ? navigate('/') : setStep('garments')}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-slate-100"
              style={{ color: '#64748B' }}
            >
              <ChevronLeftIcon size={20} />
            </button>

            <div className="flex-1">
              <h1 className="text-base font-bold text-slate-900">
                {step === 'garments' ? 'Book Ironing' : 'Confirm Order'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                {['garments', 'confirm'].map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors"
                      style={step === s || (s === 'garments' && step === 'confirm')
                        ? { background: '#B91C1C', color: '#fff' }
                        : { background: '#F1F5F9', color: '#94A3B8' }}
                    >
                      {s === 'garments' && step === 'confirm' ? '✓' : i + 1}
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: step === s ? '#B91C1C' : '#94A3B8' }}>
                      {s === 'garments' ? 'Garments' : 'Confirm'}
                    </span>
                    {i === 0 && <div className="w-8 h-px" style={{ background: step === 'confirm' ? '#B91C1C' : '#E2E8F0' }} />}
                  </div>
                ))}
              </div>
            </div>

            {cartCount > 0 && (
              <button
                onClick={() => { clearCart(); setStep('garments'); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-rose-50"
                style={{ color: '#94A3B8' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-6">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">

          {/* ── Left Panel ── */}
          <div>

            {/* GARMENTS STEP */}
            {step === 'garments' && (
              <>
                {/* Category filter */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                  {categories.map(cat => {
                    const count = cat === 'All' ? garments.length : garments.filter(g => g.category === cat).length;
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                        style={active
                          ? { background: '#B91C1C', color: '#fff', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }
                          : { background: '#fff', color: '#475569', border: '1.5px solid #F1F5F9' }}
                      >
                        {cat}
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={active ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: '#F8F9FB', color: '#94A3B8' }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Garments grid */}
                {garmentsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3 animate-pulse" style={{ border: '1.5px solid #F1F5F9' }}>
                        <div className="w-16 h-16 rounded-2xl bg-slate-100" />
                        <div className="h-3 w-20 bg-slate-100 rounded-full" />
                        <div className="h-3 w-12 bg-slate-100 rounded-full" />
                        <div className="h-10 w-full bg-slate-100 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filtered.map(g => <GarmentCard key={g.id} garment={g} />)}
                  </div>
                )}
              </>
            )}

            {/* CONFIRM STEP */}
            {step === 'confirm' && (
              <div className="space-y-4">

                {/* Order items */}
                <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Order Items</p>
                  <div className="space-y-3">
                    {cart.map(g => (
                      <div key={g.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FEF2F2' }}>
                          <span className="text-xl">{g.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{g.name}</p>
                          <p className="text-xs text-slate-400">× {g.qty} &nbsp;·&nbsp; ₹{g.price} each</p>
                        </div>
                        <span className="text-sm font-bold text-slate-800">₹{g.price * g.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid #F8F9FB' }}>
                    <span className="text-sm font-bold text-slate-700">Total Amount</span>
                    <span className="text-xl font-black" style={{ color: '#B91C1C' }}>₹{cartTotal}</span>
                  </div>
                </div>

                {/* Delivery details */}
                <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Delivery Details</p>

                  {/* Apartment */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Apartment <span style={{ color: '#B91C1C' }}>*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={apartment}
                        onChange={e => handleAptChange(e.target.value)}
                        className="w-full appearance-none text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none transition-all"
                        style={{
                          border: apartment ? '1.5px solid #B91C1C' : '1.5px solid #E2E8F0',
                          background: '#fff',
                          color: apartment ? '#0F172A' : '#94A3B8',
                          boxShadow: apartment ? '0 0 0 3px rgba(220,38,38,0.06)' : 'none',
                        }}
                      >
                        <option value="" disabled>Choose your apartment…</option>
                        {apartments.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                    {user?.apartment && apartment === user.apartment && (
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <CheckIcon size={10} className="text-green-500" /> Pre-filled from your profile
                      </p>
                    )}
                  </div>

                  {/* Date + Time row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <CalendarIcon size={12} className="text-slate-400" />
                        Pickup Date <span style={{ color: '#B91C1C' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        min={minDate}
                        onChange={e => {
                          const v = e.target.value;
                          if (v < minDate) { setPickupDate(minDate); setSlotTimeOver(minDate > today); }
                          else { setPickupDate(v); setSlotTimeOver(false); setConfirmError(''); }
                        }}
                        className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
                        style={{
                          border: pickupDate ? '1.5px solid #B91C1C' : '1.5px solid #E2E8F0',
                          background: '#fff',
                          color: pickupDate ? '#0F172A' : '#94A3B8',
                          boxShadow: pickupDate ? '0 0 0 3px rgba(220,38,38,0.06)' : 'none',
                        }}
                      />
                    </div>

                    {fixedTime && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                          <ClockIcon size={12} className="text-slate-400" /> Pickup Time
                        </label>
                        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                          <ClockIcon size={14} className="text-red-500 shrink-0" />
                          <span className="text-sm font-semibold text-red-700">{fixedTime}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {slotTimeOver && (
                    <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-3" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                      <p className="text-xs text-amber-700 font-medium">
                        Today's slot has passed. Pickup moved to <strong>tomorrow</strong>.
                      </p>
                    </div>
                  )}

                  {delivTime && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <ClockIcon size={12} className="text-blue-400" /> Delivery Time
                      </label>
                      <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
                        <ClockIcon size={14} className="text-blue-500 shrink-0" />
                        <span className="text-sm font-semibold text-blue-700">{delivTime}</span>
                        <span className="text-xs text-blue-400 ml-auto">Clothes delivered back</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Payment Method</p>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8F9FB', border: '1.5px solid #E2E8F0' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Razorpay</p>
                      <p className="text-xs text-slate-400">UPI · Cards · Net Banking · Wallets</p>
                    </div>
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#B91C1C' }}>
                      <CheckIcon size={10} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {confirmError && (
                  <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{confirmError}</p>
                  </div>
                )}

                {/* Mobile pay button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full lg:hidden py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#B91C1C', boxShadow: '0 4px 16px rgba(220,38,38,0.35)' }}
                >
                  {placing
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                    : <><CheckIcon size={18} />Pay ₹{cartTotal}</>}
                </button>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ── */}
          <Sidebar />
        </div>
      </div>

      {/* ── Mobile floating bar (garments step) ── */}
      {step === 'garments' && cartCount > 0 && (
        <div
          className="fixed left-0 right-0 px-4 z-40 lg:hidden"
          style={{ bottom: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={() => setStep('confirm')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white font-semibold"
            style={{ background: '#B91C1C', boxShadow: '0 8px 24px rgba(220,38,38,0.4)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>
                {cartCount}
              </span>
              <span className="text-sm">{cartCount} item{cartCount !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold">₹{cartTotal}</span>
              <ArrowRightIcon size={16} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
