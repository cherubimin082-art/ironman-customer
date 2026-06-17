import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Status → timeline step mapping ────────────────────────────
function statusToStep(status) {
  if (status === 'delivered') return 4;
  if (['out_for_delivery', 'picked_from_vendor'].includes(status)) return 3;
  if (['ironing_in_progress', 'in_progress', 'at_vendor', 'ready_for_delivery'].includes(status)) return 2;
  if (['picked_up', 'delivery_assigned'].includes(status)) return 1;
  if (['pending', 'vendor_accepted'].includes(status)) return 0;
  if (status === 'cancelled') return -1;
  return 0;
}

const TIMELINE_STEPS = [
  { label: 'Order Confirmed', icon: 'check' },
  { label: 'Picked Up',       icon: 'check' },
  { label: 'Ironing',         icon: 'iron'  },
  { label: 'Out for Delivery',icon: 'truck' },
  { label: 'Delivered',       icon: 'check' },
];

const STATUS_ALERT = {
  pending:             { title: 'Order placed — awaiting confirmation',    sub: 'Your order is queued. A vendor will confirm shortly.' },
  vendor_accepted:     { title: 'Vendor confirmed your order',             sub: 'A delivery agent will be assigned soon.' },
  delivery_assigned:   { title: 'Delivery agent assigned',                 sub: 'Your agent is on their way to pick up.' },
  picked_up:           { title: 'Clothes picked up from you',              sub: 'Your clothes are on the way to the iron shop.' },
  at_vendor:           { title: 'Clothes arrived at iron shop',            sub: 'Our team is preparing your garments.' },
  ironing_in_progress: { title: 'Ironing in progress',                     sub: 'Your clothes are being carefully pressed.' },
  in_progress:         { title: 'Ironing in progress',                     sub: 'Your clothes are being carefully pressed.' },
  ready_for_delivery:  { title: 'Ironing complete — ready for delivery',   sub: 'Your clothes are crisp and ready to go.' },
  picked_from_vendor:  { title: 'Clothes picked up from shop',             sub: 'Your agent is heading back to you.' },
  out_for_delivery:    { title: 'Out for delivery — arriving soon',        sub: 'Your freshly pressed clothes are on their way back.' },
  delivered:           { title: 'Order delivered successfully',            sub: 'Thank you for choosing Iron Man!' },
  cancelled:           { title: 'Order cancelled',                         sub: 'This order has been cancelled.' },
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

// ── OTP popup ──────────────────────────────────────────────────
function OtpPopup({ notification, onDismiss }) {
  if (!notification) return null;
  const isPickup = notification.type === 'pickup';
  const accent   = isPickup ? '#3b82f6' : '#10b981';
  const bgLight  = isPickup ? '#eff6ff' : '#f0fdf4';
  const border   = isPickup ? '#bfdbfe' : '#bbf7d0';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center"
      style={{ background: 'rgba(15,23,42,0.7)' }}
      onClick={onDismiss}
    >
      <div
        className="bg-white w-full rounded-t-[2rem] px-6 pt-8 shadow-2xl text-center"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))', maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

        {/* WhatsApp icon */}
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" fill="#16a34a" style={{ width: 34, height: 34 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          {isPickup ? 'Pickup OTP Sent' : 'Delivery OTP Sent'}
        </h2>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px', lineHeight: 1.6 }}>
          {isPickup
            ? 'A 4-digit OTP has been sent to your WhatsApp. Share it with the agent to hand over your clothes.'
            : 'A 4-digit OTP has been sent to your WhatsApp. Share it with the agent to receive your clothes.'}
        </p>

        {/* WhatsApp info banner */}
        <div style={{ background: bgLight, border: `1.5px solid ${border}`, borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>Check your WhatsApp</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0' }}>Tell the agent your 4-digit OTP to confirm</p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: accent, border: 'none', cursor: 'pointer' }}
        >
          OK, Got It
        </button>
      </div>
    </div>
  );
}

// ── Cancel modal ──────────────────────────────────────────────
function CancelModal({ onConfirm, onClose, busy }) {
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.65)' }}
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', textAlign: 'center', margin: '0 0 6px' }}>Cancel Order?</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
          Are you sure? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>
            Keep Order
          </button>
          <button onClick={onConfirm} disabled={busy} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: '#EF4444', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
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
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" disabled={readonly}
          onClick={() => !readonly && onChange(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{ fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer', color: i <= (hovered || value) ? '#F59E0B' : '#E5E7EB', transition: 'color 0.1s' }}
        >★</button>
      ))}
    </div>
  );
}

// ── Rating section ─────────────────────────────────────────────
function RatingSection({ orderId }) {
  const [existing,  setExisting]  = useState(null);
  const [vRating,   setVRating]   = useState(0);
  const [dRating,   setDRating]   = useState(0);
  const [vReview,   setVReview]   = useState('');
  const [dReview,   setDReview]   = useState('');
  const [busy,      setBusy]      = useState(false);
  const [done,      setDone]      = useState(false);
  const [err,       setErr]       = useState('');

  const load = useCallback(async () => {
    try { const { data } = await api.get(`/customer/order-rating/${orderId}`); setExisting(data.rating || false); }
    catch { setExisting(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vRating && !dRating) { setErr('Please give at least one rating.'); return; }
    setBusy(true); setErr('');
    try {
      await api.post(`/customer/rate-order/${orderId}`, { vendor_rating: vRating || null, delivery_rating: dRating || null, vendor_review: vReview || null, delivery_review: dReview || null });
      setDone(true); load();
    } catch (e) { setErr(e.response?.data?.message || 'Could not submit rating.'); }
    finally { setBusy(false); }
  }

  if (existing === null) return null;

  if (existing || done) {
    const r = existing || {};
    return (
      <div className="bg-white rounded-2xl p-4 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Your Rating</p>
        {r.vendor_rating && <div className="mb-2"><p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>Vendor</p><StarPicker value={r.vendor_rating} readonly />{r.vendor_review && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>"{r.vendor_review}"</p>}</div>}
        {r.delivery_rating && <div><p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>Delivery Agent</p><StarPicker value={r.delivery_rating} readonly />{r.delivery_review && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>"{r.delivery_review}"</p>}</div>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Rate Your Experience</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 14px' }}>Your feedback helps us improve.</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>Ironing Quality</p><StarPicker value={vRating} onChange={setVRating} /><textarea value={vReview} onChange={e => setVReview(e.target.value)} placeholder="Write a review (optional)" rows={2} style={{ marginTop: 8, width: '100%', fontSize: 12, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '8px 10px', resize: 'none', color: '#374151', boxSizing: 'border-box' }} /></div>
        <div><p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>Delivery Agent</p><StarPicker value={dRating} onChange={setDRating} /><textarea value={dReview} onChange={e => setDReview(e.target.value)} placeholder="Write a review (optional)" rows={2} style={{ marginTop: 8, width: '100%', fontSize: 12, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '8px 10px', resize: 'none', color: '#374151', boxSizing: 'border-box' }} /></div>
        {err && <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{err}</p>}
        <button type="submit" disabled={busy} style={{ padding: '11px 0', borderRadius: 12, background: '#F59E0B', border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {busy ? 'Submitting…' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function TrackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { orders, otpNotification, dismissOtp, liveLocation, agentInfo,
          cancelOrder, rejectedNotification, dismissRejected } = useOrder();

  const urlId = parseInt(searchParams.get('id'));
  const [selectedId, setSelectedId] = useState(
    () => urlId || orders.find(o => !['delivered', 'cancelled'].includes(o.status))?.id || orders[0]?.id
  );
  const [showCancel, setShowCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelErr,  setCancelErr]  = useState('');

  useEffect(() => { if (urlId) setSelectedId(urlId); }, [urlId]);

  async function handleCancelConfirm() {
    if (!order) return;
    setCancelBusy(true); setCancelErr('');
    try { await cancelOrder(order.id); setShowCancel(false); }
    catch (e) { setCancelErr(e.response?.data?.message || 'Could not cancel. Try again.'); }
    finally { setCancelBusy(false); }
  }

  const order = orders.find(o => o.id === selectedId);
  const items = order ? parseItems(order.items) : [];
  const total = items.reduce((s, i) => s + parseFloat(i.subtotal || (i.unit_price * i.quantity) || 0), 0) || parseFloat(order?.total || 0);
  const currentStep = order ? statusToStep(order.status) : 0;
  const alert = order ? (STATUS_ALERT[order.status] ?? { title: order.status, sub: '' }) : null;
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen" style={{ background: '#F0F0F5' }}>

      {/* OTP popup */}
      <OtpPopup notification={otpNotification} onDismiss={dismissOtp} />

      {/* Cancel modal */}
      {showCancel && <CancelModal onConfirm={handleCancelConfirm} onClose={() => { setShowCancel(false); setCancelErr(''); }} busy={cancelBusy} />}

      {/* Vendor rejected banner */}
      {rejectedNotification && (
        <div className="fixed top-4 left-1/2 z-[1050] -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-lg flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9F1239', margin: 0 }}>Order Rejected by Vendor</p>
              {rejectedNotification.reason && <p style={{ fontSize: 12, color: '#BE185D', margin: '2px 0 0' }}>Reason: {rejectedNotification.reason}</p>}
            </div>
            <button onClick={dismissRejected} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-4 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))', paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            style={{ background: '#F4F4F8', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#B91C1C' }}>Track Order</span>
        </div>
        {firstName && (
          <div style={{ width: 34, height: 34, borderRadius: 99, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{firstName[0]}</span>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>No orders to track</p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 16px' }}>Place your first order to track it here</p>
          <button onClick={() => navigate('/order')} style={{ background: '#B91C1C', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 14, padding: '12px 24px', cursor: 'pointer' }}>
            Book Pickup
          </button>
        </div>
      ) : !order ? null : (
        <div className="px-4 pt-4">

          {/* Order selector (when multiple orders) */}
          {orders.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
              {orders.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: selectedId === o.id ? '#B91C1C' : 'white',
                    color: selectedId === o.id ? 'white' : '#374151',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {o.order_code || `#${o.id}`}
                </button>
              ))}
            </div>
          )}

          {/* ── Alert banner ── */}
          {alert && order.status !== 'cancelled' && (
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ background: '#FEF2F2', borderLeft: '4px solid #B91C1C' }}
            >
              <p style={{ fontSize: 15, fontWeight: 800, color: '#B91C1C', margin: '0 0 4px' }}>{alert.title}</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{alert.sub}</p>
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: '#FFF1F2', borderLeft: '4px solid #EF4444' }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', margin: '0 0 4px' }}>Order Cancelled</p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>This order has been cancelled.</p>
            </div>
          )}

          {/* ── Status Timeline ── */}
          <div className="bg-white rounded-2xl p-5 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 18px' }}>Status Timeline</p>
            <div>
              {TIMELINE_STEPS.map((step, i) => {
                const done   = i < currentStep;
                const active = i === currentStep && order.status !== 'cancelled';
                const future = i > currentStep || order.status === 'cancelled';
                const isLast = i === TIMELINE_STEPS.length - 1;

                return (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    {/* Circle + connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: done ? '#22C55E' : active ? '#B91C1C' : 'transparent',
                        border: future ? '2px solid #E2E8F0' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {active && step.icon === 'truck' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                            <rect x="9" y="11" width="14" height="10" rx="2" />
                            <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                          </svg>
                        )}
                        {active && step.icon !== 'truck' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {future && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E2E8F0' }} />}
                      </div>
                      {!isLast && <div style={{ width: 2, height: 32, background: done ? '#22C55E' : '#E2E8F0', marginTop: 2 }} />}
                    </div>

                    {/* Text */}
                    <div style={{ paddingBottom: isLast ? 0 : 10 }}>
                      <p style={{ fontSize: 14, fontWeight: active ? 700 : done ? 600 : 500, color: active ? '#B91C1C' : done ? '#0F172A' : '#94A3B8', margin: '4px 0 2px' }}>
                        {step.label}
                      </p>
                      <p style={{ fontSize: 11.5, color: active ? '#B91C1C' : done ? '#94A3B8' : '#C8D0DC', margin: 0 }}>
                        {active ? 'Active now' : done ? formatDate(order.created_at) : isLast && order.time_slot ? `Expected by ${order.time_slot}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Live location ── */}
          {liveLocation?.orderId === order.id && ['delivery_assigned', 'picked_up', 'out_for_delivery'].includes(order.status) && (
            <div className="bg-white rounded-2xl p-4 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderLeft: '3px solid #22C55E' }}>
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} className="animate-pulse" />
                <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Live Location</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>Delivery agent is on the way</p>
              <a
                href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 10, background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: 12, textDecoration: 'none', marginTop: 8 }}
              >
                Open in Maps →
              </a>
            </div>
          )}

          {/* ── Agent info ── */}
          {agentInfo?.orderId === order.id && (
            <div className="bg-white rounded-2xl p-4 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Delivery Agent</p>
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>{agentInfo.agentName?.[0]?.toUpperCase() ?? 'D'}</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>{agentInfo.agentName}</p>
                  {agentInfo.agentPhone && <a href={`tel:${agentInfo.agentPhone}`} style={{ fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>{agentInfo.agentPhone}</a>}
                </div>
              </div>
            </div>
          )}

          {/* ── Order details ── */}
          <div className="bg-white rounded-2xl p-5 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" fill="#B91C1C" width="14" height="14">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Order Details</p>
            </div>
            {[
              { label: 'Order ID',      value: order.order_code || `#${order.id}` },
              { label: 'Clothes Count', value: `${items.length > 0 ? items.reduce((s,i) => s+(i.quantity||1),0) : '—'} Items` },
              { label: 'Pickup Date',   value: order.pickup_date ? formatDate(order.pickup_date) : '—' },
              { label: 'Pickup Time',   value: order.time_slot || order.slot || '—' },
              ...(order.bag_number ? [{ label: 'Bag No.', value: `#${order.bag_number}` }] : []),
              { label: 'Placed on',     value: formatDate(order.created_at) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F4F4F8' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* ── Garments list ── */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl p-5 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Garments</p>
              {items.map((g, i) => (
                <div key={g.id ?? i} className="flex justify-between items-center py-2" style={{ borderBottom: i < items.length - 1 ? '1px solid #F4F4F8' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{g.garment_name} <span style={{ color: '#94A3B8' }}>× {g.quantity}</span></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>₹{parseFloat(g.subtotal || 0).toFixed(0)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Total Amount</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>₹{total.toFixed(0)}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 99 }}>PAID</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Cancel button ── */}
          {order.status === 'pending' && (
            <div className="mb-3">
              <button
                onClick={() => { setShowCancel(true); setCancelErr(''); }}
                className="w-full rounded-2xl py-3 font-bold"
                style={{ background: '#FFF1F2', border: '1.5px solid #FECDD3', color: '#E11D48', fontSize: 14, cursor: 'pointer' }}
              >
                Cancel Order
              </button>
              {cancelErr && <p style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>{cancelErr}</p>}
            </div>
          )}

          {/* ── Rating ── */}
          {order.status === 'delivered' && <RatingSection orderId={order.id} />}

          {/* ── Contact Support button ── */}
          <button
            className="w-full rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-4"
            style={{ background: '#B91C1C', border: 'none', padding: '15px 20px', fontSize: 15, cursor: 'pointer' }}
            onClick={() => window.open('https://wa.me/917869729829', '_blank')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8 19.79 19.79 0 0110 2.18C10.51 2 11.06 2 11.62 2A2 2 0 0114 3.87c.15.6.35 1.19.59 1.76a2 2 0 01-.45 2.11L13 8.91a16 16 0 006.08 6.08l1.17-1.17a2 2 0 012.11-.45c.57.24 1.16.44 1.76.59a2 2 0 011.88 2.04z" />
            </svg>
            Contact Support
          </button>

        </div>
      )}
    </div>
  );
}
