import { useState, useEffect, useCallback } from 'react';
import { useOrder } from '../context/OrderContext';
import OrderStatusBar from '../components/OrderStatusBar';
import { CalendarIcon, ClockIcon } from '../components/Icons';
import api from '../services/api';

const STATUS_CONFIG = {
  pending:            { label: 'Order Placed',        bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  vendor_accepted:    { label: 'Vendor Confirmed',    bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
  delivery_assigned:  { label: 'Agent Assigned',      bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
  picked_up:          { label: 'Clothes Picked Up',   bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400'     },
  at_vendor:            { label: 'At Iron Shop',          bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
  ironing_in_progress:  { label: 'Ironing in Progress',  bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  in_progress:          { label: 'Ironing in Progress',  bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
  ready_for_delivery:   { label: 'Ironing Complete',     bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  picked_from_vendor:   { label: 'On the Way',           bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
  out_for_delivery:     { label: 'Out for Delivery',     bg: 'bg-red-50',  text: 'text-red-700',  dot: 'bg-red-500'  },
  delivered:          { label: 'Delivered',           bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled:          { label: 'Cancelled',           bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400'    },
};

function parseItems(raw) {
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); }
  catch { return []; }
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── OTP Bottom Sheet ───────────────────────────────────────────
function OtpPopup({ notification, onDismiss }) {
  if (!notification) return null;
  const isPickup = notification.type === 'pickup';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(15,23,42,0.7)' }}
      onClick={onDismiss}
    >
      <div
        className="bg-white w-full sm:max-w-[380px] sm:rounded-3xl rounded-t-[2rem] px-6 pt-8 shadow-2xl text-center"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isPickup ? 'bg-blue-50' : 'bg-emerald-50'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke={isPickup ? '#3b82f6' : '#10b981'} strokeWidth="2" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 mb-2">
          {isPickup ? 'Pickup OTP' : 'Delivery OTP'}
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-xs mx-auto">
          {isPickup
            ? 'Your delivery agent has arrived! Share this OTP with them to hand over your clothes.'
            : 'Your ironed clothes are here! Share this OTP with the delivery agent.'}
        </p>

        <div className={`rounded-2xl py-5 mb-6 ${isPickup ? 'bg-blue-50 border-2 border-dashed border-blue-200' : 'bg-emerald-50 border-2 border-dashed border-emerald-200'}`}>
          <p className={`text-5xl font-black tracking-[0.25em] ${isPickup ? 'text-blue-700' : 'text-emerald-700'}`}>
            {notification.otp}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-2">
            One-time password
          </p>
        </div>

        <button
          onClick={onDismiss}
          className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98] ${
            isPickup
              ? 'bg-gradient-to-r from-blue-500 to-red-600 shadow-[0_4px_14px_rgba(99,102,241,0.4)]'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
          }`}
        >
          Got It
        </button>
      </div>
    </div>
  );
}

// ── Live Location Card ────────────────────────────────────────
function LiveLocationCard({ location, orderId }) {
  if (!location || location.orderId !== orderId) return null;
  const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)] animate-pulse" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Location</p>
      </div>
      <p className="text-sm text-slate-700 font-medium mb-1">Delivery agent is on the way</p>
      <p className="text-xs text-slate-400 font-mono mb-3">
        {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
      </p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="block w-full text-center py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
      >
        Open in Maps →
      </a>
    </div>
  );
}

// ── Order card in list ────────────────────────────────────────
function OrderCard({ order, active, onClick }) {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };
  const displayId = order.order_code || `#${order.id}`;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.99] ${
        active ? 'border-red-500 bg-red-50/50' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-bold ${active ? 'text-red-700' : 'text-slate-800'}`}>{displayId}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.created_at)}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-slate-500">{order.slot}</p>
        <p className="text-sm font-bold text-slate-800">₹{parseFloat(order.total || 0).toFixed(0)}</p>
      </div>
    </button>
  );
}

// ── Cancel Confirmation Modal ─────────────────────────────────
function CancelModal({ onConfirm, onClose, busy }) {
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.65)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-extrabold text-slate-900 text-center mb-1">Cancel Order?</h2>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          Are you sure you want to cancel this order? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-rose-500 text-sm font-bold text-white hover:bg-rose-600 transition-colors disabled:opacity-60"
          >
            {busy ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Star picker ───────────────────────────────────────────────
function StarPicker({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className="text-2xl leading-none disabled:cursor-default"
          style={{ color: i <= (hovered || value) ? '#f59e0b' : '#e5e7eb', transition: 'color 0.1s' }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Rating Section ─────────────────────────────────────────────
function RatingSection({ orderId }) {
  const [existing,  setExisting]  = useState(null); // null = loading, false = not rated
  const [vRating,   setVRating]   = useState(0);
  const [dRating,   setDRating]   = useState(0);
  const [vReview,   setVReview]   = useState('');
  const [dReview,   setDReview]   = useState('');
  const [busy,      setBusy]      = useState(false);
  const [done,      setDone]      = useState(false);
  const [err,       setErr]       = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/customer/order-rating/${orderId}`);
      setExisting(data.rating || false);
    } catch { setExisting(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vRating && !dRating) { setErr('Please give at least one rating.'); return; }
    setBusy(true); setErr('');
    try {
      await api.post(`/customer/rate-order/${orderId}`, {
        vendor_rating: vRating || null,
        delivery_rating: dRating || null,
        vendor_review: vReview || null,
        delivery_review: dReview || null,
      });
      setDone(true);
      load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not submit rating.');
    } finally { setBusy(false); }
  }

  if (existing === null) return null;

  if (existing || done) {
    const r = existing || {};
    return (
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Your Rating</p>
        <div className="space-y-3">
          {r.vendor_rating && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Vendor</p>
              <StarPicker value={r.vendor_rating} readonly />
              {r.vendor_review && <p className="text-xs text-slate-500 mt-1 italic">"{r.vendor_review}"</p>}
            </div>
          )}
          {r.delivery_rating && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Delivery Agent</p>
              <StarPicker value={r.delivery_rating} readonly />
              {r.delivery_review && <p className="text-xs text-slate-500 mt-1 italic">"{r.delivery_review}"</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rate Your Experience</p>
      <p className="text-xs text-slate-400 mb-4">Your feedback helps us improve.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-600 mb-1.5">Vendor / Ironing Quality</p>
          <StarPicker value={vRating} onChange={setVRating} />
          <textarea
            value={vReview}
            onChange={e => setVReview(e.target.value)}
            placeholder="Write a review (optional)"
            rows={2}
            className="mt-2 w-full text-xs rounded-xl border border-slate-200 p-2.5 resize-none text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-300"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-600 mb-1.5">Delivery Agent</p>
          <StarPicker value={dRating} onChange={setDRating} />
          <textarea
            value={dReview}
            onChange={e => setDReview(e.target.value)}
            placeholder="Write a review (optional)"
            rows={2}
            className="mt-2 w-full text-xs rounded-xl border border-slate-200 p-2.5 resize-none text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-300"
          />
        </div>
        {err && <p className="text-xs text-rose-600 font-medium">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-white text-sm font-bold shadow-sm hover:from-amber-600 hover:to-amber-500 transition-all disabled:opacity-60"
        >
          {busy ? 'Submitting…' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function TrackPage() {
  const { orders, otpNotification, dismissOtp, liveLocation, agentInfo,
          cancelOrder, rejectedNotification, dismissRejected } = useOrder();
  const [selectedId, setSelectedId] = useState(
    () => orders.find((o) => !['delivered', 'cancelled'].includes(o.status))?.id ?? orders[0]?.id
  );
  const [showCancel, setShowCancel]   = useState(false);
  const [cancelBusy, setCancelBusy]   = useState(false);
  const [cancelErr,  setCancelErr]    = useState('');

  async function handleCancelConfirm() {
    if (!order) return;
    setCancelBusy(true);
    setCancelErr('');
    try {
      await cancelOrder(order.id);
      setShowCancel(false);
    } catch (e) {
      setCancelErr(e.response?.data?.message || 'Could not cancel. Try again.');
    } finally {
      setCancelBusy(false);
    }
  }

  const order = orders.find((o) => o.id === selectedId);
  const cfg = order ? (STATUS_CONFIG[order.status] ?? { label: order.status, bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' }) : null;
  const items = order ? parseItems(order.items) : [];
  const total = items.reduce((s, i) => s + parseFloat(i.subtotal || (i.unit_price * i.quantity) || 0), 0) || parseFloat(order?.total || 0);
  const showLocation = order && ['delivery_assigned', 'picked_up', 'out_for_delivery'].includes(order.status);

  return (
    <div className="min-h-screen pb-28 lg:pb-0">
      {/* OTP popup */}
      <OtpPopup notification={otpNotification} onDismiss={dismissOtp} />

      {/* Cancel confirmation */}
      {showCancel && (
        <CancelModal
          onConfirm={handleCancelConfirm}
          onClose={() => { setShowCancel(false); setCancelErr(''); }}
          busy={cancelBusy}
        />
      )}

      {/* Vendor rejected notification */}
      {rejectedNotification && (
        <div
          className="fixed top-4 left-1/2 z-[1050] -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm"
          style={{ animation: 'slideDown 0.3s ease' }}
        >
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-lg flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-rose-800">Order Rejected by Vendor</p>
              {rejectedNotification.reason && (
                <p className="text-xs text-rose-600 mt-0.5">Reason: {rejectedNotification.reason}</p>
              )}
            </div>
            <button onClick={dismissRejected} className="text-rose-400 hover:text-rose-600 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="bg-white border-b border-slate-100 px-4 pb-4 lg:pt-6 sticky top-0 z-30 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
        style={{ paddingTop: 'max(2.75rem, env(safe-area-inset-top, 2.75rem))' }}
      >
        <div className="max-w-7xl mx-auto lg:px-4">
          <h1 className="text-base font-bold text-slate-900">Track Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status updates</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 lg:pt-8">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">No orders yet</p>
            <p className="text-xs text-slate-400 mt-1">Place an order to see tracking here</p>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-10 lg:items-start">

            {/* Left: order list */}
            <div>
              {/* Mobile: pill tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4 lg:hidden">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      selectedId === o.id ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {o.order_code || `#${o.id}`}
                  </button>
                ))}
              </div>

              {/* Desktop: vertical cards */}
              <div className="hidden lg:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Your Orders</p>
                <div className="space-y-2.5">
                  {orders.map((o) => (
                    <OrderCard key={o.id} order={o} active={selectedId === o.id} onClick={() => setSelectedId(o.id)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: order details */}
            {order && (
              <div className="space-y-3">

                {/* Status card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 lg:p-5">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">{order.order_code || `#${order.id}`}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <OrderStatusBar status={order.status} />

                  {/* Cancel button — only when pending */}
                  {order.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { setShowCancel(true); setCancelErr(''); }}
                        className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-bold hover:bg-rose-100 transition-colors active:scale-[0.98]"
                      >
                        Cancel Order
                      </button>
                      {cancelErr && (
                        <p className="text-xs text-rose-600 font-medium text-center mt-2">{cancelErr}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Live location */}
                {showLocation && (
                  <LiveLocationCard location={liveLocation} orderId={order.id} />
                )}

                {/* Delivery agent info */}
                {agentInfo?.orderId === order.id && (
                  <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Delivery Agent</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <span className="text-base font-bold text-violet-600">
                          {agentInfo.agentName?.[0]?.toUpperCase() ?? 'D'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{agentInfo.agentName}</p>
                        {agentInfo.agentPhone && (
                          <a href={`tel:${agentInfo.agentPhone}`} className="text-xs text-violet-600 font-semibold">
                            {agentInfo.agentPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Garments + pickup info */}
                <div className="lg:grid lg:grid-cols-2 lg:gap-3">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3 lg:mb-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Garments</p>
                    {items.length > 0 ? (
                      <div className="space-y-2.5">
                        {items.map((g, i) => (
                          <div key={g.id ?? i} className="flex justify-between items-center">
                            <p className="text-sm text-slate-700">{g.garment_name} <span className="text-slate-400">× {g.quantity}</span></p>
                            <p className="text-sm font-semibold text-slate-800">₹{parseFloat(g.subtotal || 0).toFixed(0)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No items</p>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <span className="text-sm font-bold text-slate-800">Total</span>
                      <span className="text-base font-bold text-red-600">₹{total.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pickup Info</p>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                        <ClockIcon size={15} className="text-red-600" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{order.slot || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <CalendarIcon size={15} className="text-slate-500" />
                      </div>
                      <span className="text-sm text-slate-500">{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Rating — only when delivered */}
                {order.status === 'delivered' && (
                  <RatingSection orderId={order.id} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
