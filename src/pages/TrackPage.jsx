import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function useIsDesktop() {
  const [v, setV] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const h = (e) => setV(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return v;
}

function statusToStep(status) {
  if (status === 'delivered') return 4;
  if (['out_for_delivery', 'picked_from_vendor', 'delivery_rescheduled'].includes(status)) return 3;
  if (['ironing_in_progress', 'in_progress', 'at_vendor', 'ready_for_delivery'].includes(status)) return 2;
  if (['picked_up', 'delivery_assigned'].includes(status)) return 1;
  if (['pending', 'vendor_accepted'].includes(status)) return 0;
  if (status === 'cancelled') return -1;
  return 0;
}

const TIMELINE_STEPS = [
  {
    label: 'Order Placed',
    sub: 'Waiting for vendor confirmation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    ),
  },
  {
    label: 'Picked Up',
    sub: 'Agent collected your clothes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
      </svg>
    ),
  },
  {
    label: 'Ironing',
    sub: 'Garments being pressed',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M3 17l7-7 4 4 4-4 3 3M3 21h18"/>
      </svg>
    ),
  },
  {
    label: 'Out for Delivery',
    sub: 'On the way to you',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/>
        <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      </svg>
    ),
  },
  {
    label: 'Delivered',
    sub: 'Clothes returned to you',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
];

const STATUS_ALERT = {
  pending:             { title: 'Order placed — awaiting confirmation',  sub: 'Your order is queued. A vendor will confirm shortly.' },
  vendor_accepted:     { title: 'Vendor confirmed your order',           sub: 'A delivery agent will be assigned soon.' },
  delivery_assigned:   { title: 'Delivery agent assigned',               sub: 'Your agent is on their way to pick up.' },
  picked_up:           { title: 'Clothes picked up from you',            sub: 'Your clothes are heading to the iron shop.' },
  at_vendor:           { title: 'Clothes arrived at iron shop',          sub: 'Our team is preparing your garments.' },
  ironing_in_progress: { title: 'Ironing in progress',                   sub: 'Your clothes are being carefully pressed.' },
  in_progress:         { title: 'Ironing in progress',                   sub: 'Your clothes are being carefully pressed.' },
  ready_for_delivery:  { title: 'Ironing complete — ready for delivery', sub: 'Your clothes are crisp and ready to go.' },
  picked_from_vendor:  { title: 'Clothes picked up from shop',           sub: 'Your agent is heading back to you.' },
  out_for_delivery:    { title: 'Out for delivery — arriving soon',      sub: 'Your freshly pressed clothes are on their way back.' },
  delivery_rescheduled:{ title: 'Delivery rescheduled',                  sub: 'Your order will be re-delivered on the new date.' },
  delivered:           { title: 'Order delivered!',                      sub: 'Thank you for choosing Iron Man!' },
  cancelled:           { title: 'Order cancelled',                       sub: 'This order has been cancelled.' },
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

/* ── OTP popup ── */
function OtpPopup({ notification, onDismiss }) {
  if (!notification) return null;
  const isPickup = notification.type === 'pickup';
  const accent   = isPickup ? '#3b82f6' : '#10b981';
  const bgLight  = isPickup ? '#eff6ff' : '#f0fdf4';
  const border   = isPickup ? '#bfdbfe' : '#bbf7d0';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(15,23,42,0.7)' }} onClick={onDismiss}>
      <div style={{ background: 'white', width: '100%', maxWidth: 480, borderRadius: '2rem 2rem 0 0', padding: '32px 24px', paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 99, margin: '0 auto 24px' }} />
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" fill="#16a34a" style={{ width: 34, height: 34 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', textAlign: 'center', margin: '0 0 8px' }}>{isPickup ? 'Pickup OTP Sent' : 'Delivery OTP Sent'}</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6 }}>
          {isPickup ? 'A 4-digit OTP has been sent to your WhatsApp. Share it with the agent to hand over your clothes.' : 'A 4-digit OTP has been sent to your WhatsApp. Share it with the agent to receive your clothes.'}
        </p>
        <div style={{ background: bgLight, border: `1.5px solid ${border}`, borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <button onClick={onDismiss} style={{ width: '100%', padding: '14px', borderRadius: 16, background: accent, border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          OK, Got It
        </button>
      </div>
    </div>
  );
}

/* ── Cancel modal ── */
function CancelModal({ onConfirm, onClose, busy, reason, onReasonChange }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.65)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 360, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 26, height: 26 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', textAlign: 'center', margin: '0 0 6px' }}>Cancel Order?</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', margin: '0 0 16px', lineHeight: 1.5 }}>Are you sure? This cannot be undone.</p>
        <textarea
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
          placeholder="Reason for cancellation (optional)"
          rows={3}
          style={{ width: '100%', fontSize: 13, borderRadius: 12, border: '1.5px solid #E2E8F0', padding: '10px 12px', resize: 'none', color: '#374151', boxSizing: 'border-box', outline: 'none', marginBottom: 16, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} disabled={busy} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Keep Order</button>
          <button onClick={onConfirm} disabled={busy || !reason.trim()} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: !reason.trim() ? '#FCA5A5' : '#EF4444', fontSize: 13, fontWeight: 700, color: 'white', cursor: !reason.trim() ? 'not-allowed' : 'pointer' }}>{busy ? 'Cancelling…' : 'Yes, Cancel'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Reschedule modal ── */
function RescheduleModal({ onConfirm, onClose, busy, date, onDateChange, err }) {
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const minStr = minDate.toISOString().split('T')[0];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.65)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 360, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ width: 26, height: 26 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', textAlign: 'center', margin: '0 0 6px' }}>Reschedule Delivery</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>Choose a new date. The delivery agent will be notified.</p>
        <input type="date" min={minStr} value={date} onChange={e => onDateChange(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A', marginBottom: 16, boxSizing: 'border-box' }} />
        {err && <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} disabled={busy} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy || !date} style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: '#3B82F6', fontSize: 13, fontWeight: 700, color: 'white', cursor: busy || !date ? 'not-allowed' : 'pointer', opacity: busy || !date ? 0.7 : 1 }}>{busy ? 'Saving…' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Star picker ── */
function StarPicker({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" disabled={readonly}
          onClick={() => !readonly && onChange(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{ fontSize: 26, lineHeight: 1, background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer', color: i <= (hovered || value) ? '#F59E0B' : '#E5E7EB', transition: 'color 0.1s', padding: 0 }}>
          ★
        </button>
      ))}
    </div>
  );
}

/* ── Rating section ── */
function RatingSection({ orderId }) {
  const [existing, setExisting] = useState(null);
  const [vRating,  setVRating]  = useState(0);
  const [dRating,  setDRating]  = useState(0);
  const [vReview,  setVReview]  = useState('');
  const [dReview,  setDReview]  = useState('');
  const [busy,     setBusy]     = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState('');

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
      <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>Your Rating</p>
        {r.vendor_rating && <div style={{ marginBottom: 12 }}><p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>Ironing Quality</p><StarPicker value={r.vendor_rating} readonly />{r.vendor_review && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, fontStyle: 'italic' }}>"{r.vendor_review}"</p>}</div>}
        {r.delivery_rating && <div><p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>Delivery Agent</p><StarPicker value={r.delivery_rating} readonly />{r.delivery_review && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, fontStyle: 'italic' }}>"{r.delivery_review}"</p>}</div>}
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 16 }}>⭐</span>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0 }}>Rate Your Experience</p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Your feedback helps us improve</p>
        </div>
      </div>
      <div style={{ height: 1, background: '#F1F5F9', margin: '14px 0' }} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Ironing Quality</p>
          <StarPicker value={vRating} onChange={setVRating} />
          <textarea value={vReview} onChange={e => setVReview(e.target.value)} placeholder="Write a review (optional)" rows={2}
            style={{ marginTop: 10, width: '100%', fontSize: 12, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '8px 10px', resize: 'none', color: '#374151', boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Delivery Agent</p>
          <StarPicker value={dRating} onChange={setDRating} />
          <textarea value={dReview} onChange={e => setDReview(e.target.value)} placeholder="Write a review (optional)" rows={2}
            style={{ marginTop: 10, width: '100%', fontSize: 12, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '8px 10px', resize: 'none', color: '#374151', boxSizing: 'border-box', outline: 'none' }} />
        </div>
        {err && <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{err}</p>}
        <button type="submit" disabled={busy} style={{ padding: '13px 0', borderRadius: 14, background: '#F59E0B', border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          {busy ? 'Submitting…' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}

/* ── Timeline component ── */
function Timeline({ currentStep, isCancelled, isDelivered }) {
  return (
    <div style={{ padding: '4px 0' }}>
      {TIMELINE_STEPS.map((step, i) => {
        // Once delivered, the final step is a completed state, not an
        // "in progress" one - it was being marked active (i === currentStep)
        // same as every other in-flight step, so its sub-label always said
        // "In progress now" even though the order was already delivered.
        const done   = isDelivered ? i <= currentStep : i < currentStep;
        const active = i === currentStep && !isCancelled && !isDelivered;
        const future = i > currentStep || isCancelled;
        const isLast = i === TIMELINE_STEPS.length - 1;

        return (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Circle + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: done ? '#22C55E' : active ? '#B91C1C' : 'white',
                border: future ? '2px solid #E2E8F0' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 0 0 6px rgba(185,28,28,0.12)' : done ? '0 0 0 4px rgba(34,197,94,0.12)' : 'none',
                color: done || active ? 'white' : '#CBD5E1',
                transition: 'all 0.3s',
              }}>
                {step.icon}
              </div>
              {!isLast && (
                <div style={{
                  width: 2, height: 36, marginTop: 3,
                  background: done ? '#22C55E' : '#E2E8F0',
                  borderRadius: 99,
                }} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingTop: 8, paddingBottom: isLast ? 0 : 20, flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: active ? 800 : done ? 600 : 500, color: active ? '#B91C1C' : done ? '#0F172A' : '#94A3B8', margin: '0 0 2px', transition: 'color 0.3s' }}>
                {step.label}
              </p>
              <p style={{ fontSize: 11.5, color: active ? '#DC2626' : done ? '#94A3B8' : '#CBD5E1', margin: 0, transition: 'color 0.3s' }}>
                {active ? 'In progress now' : done ? 'Completed' : step.sub}
              </p>
            </div>

            {/* Active pulse dot */}
            {active && (
              <div style={{ marginTop: 14, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B91C1C', animation: 'pulse 1.5s infinite' }} />
              </div>
            )}
          </div>
        );
      })}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }`}</style>
    </div>
  );
}

/* ── Main ── */
export default function TrackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { orders, otpNotification, dismissOtp, liveLocation, agentInfo,
          cancelOrder, rejectedNotification, dismissRejected, apartments,
          loadOrders } = useOrder();
  const isDesktop = useIsDesktop();

  const urlId = parseInt(searchParams.get('id'));
  const [selectedId, setSelectedId] = useState(
    () => urlId || orders.find(o => !['delivered', 'cancelled'].includes(o.status))?.id || orders[0]?.id
  );
  const [showCancel,     setShowCancel]     = useState(false);
  const [cancelBusy,     setCancelBusy]     = useState(false);
  const [cancelErr,      setCancelErr]      = useState('');
  const [cancelReason,   setCancelReason]   = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [rescheduleErr,  setRescheduleErr]  = useState('');

  useEffect(() => { if (urlId) setSelectedId(urlId); }, [urlId]);
  useEffect(() => {
    if (!selectedId && orders.length > 0)
      setSelectedId(orders.find(o => !['delivered', 'cancelled'].includes(o.status))?.id || orders[0]?.id);
  }, [orders, selectedId]);

  async function handleCancelConfirm() {
    if (!order) return;
    setCancelBusy(true); setCancelErr('');
    try { await cancelOrder(order.id, cancelReason); setShowCancel(false); setCancelReason(''); }
    catch (e) { setCancelErr(e.response?.data?.message || 'Could not cancel. Try again.'); }
    finally { setCancelBusy(false); }
  }

  async function handleRescheduleConfirm() {
    if (!order || !rescheduleDate) return;
    setRescheduleBusy(true); setRescheduleErr('');
    try {
      await api.put(`/customer/reschedule-delivery/${order.id}`, { new_delivery_date: rescheduleDate });
      setShowReschedule(false); setRescheduleDate(''); await loadOrders();
    } catch (e) { setRescheduleErr(e.response?.data?.message || 'Could not reschedule. Try again.'); }
    finally { setRescheduleBusy(false); }
  }

  const order = orders.find(o => o.id === selectedId);
  const aptDeliveryTime = order?.apartment ? (apartments.find(a => a.name === order.apartment)?.delivery_time ?? null) : null;
  const items = order ? parseItems(order.items) : [];
  const total = items.reduce((s, i) => s + parseFloat(i.subtotal || (i.unit_price * i.quantity) || 0), 0) || parseFloat(order?.total || 0);
  const currentStep = order ? statusToStep(order.status) : 0;
  const alert = order ? (STATUS_ALERT[order.status] ?? { title: order.status, sub: '' }) : null;
  const firstName = user?.name?.split(' ')[0] ?? '';
  const isCancelled = order?.status === 'cancelled';
  const isDelivered = order?.status === 'delivered';

  const detailRows = order ? [
    { label: 'Order ID',      value: order.order_code || `#${order.id}` },
    { label: 'Clothes',       value: items.length > 0 ? `${items.reduce((s,i) => s+(i.quantity||1),0)} items` : '—' },
    { label: 'Pickup Date',   value: order.pickup_date ? formatDate(order.pickup_date) : '—' },
    { label: 'Pickup Slot',   value: order.time_slot || order.slot || '—' },
    ...(aptDeliveryTime ? [{ label: 'Delivery Time', value: aptDeliveryTime }] : []),
    ...(order.status === 'delivery_rescheduled' && order.delivery_date
      ? [{ label: 'Rescheduled Date', value: formatDate(order.delivery_date), highlight: true }]
      : order.delivery_date && order.delivery_date !== order.pickup_date
      ? [{ label: 'Expected Delivery', value: formatDate(order.delivery_date) }]
      : []),
    ...((order.bag_numbers || order.bag_number) ? [{ label: 'Bag No.', value: (order.bag_numbers || String(order.bag_number)).split(',').map(n => `#${n.trim()}`).join(', ') }] : []),
    { label: 'Placed On',     value: formatDate(order.created_at) },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F8' }}>

      {/* Overlays */}
      <OtpPopup notification={otpNotification} onDismiss={dismissOtp} />
      {showCancel && <CancelModal onConfirm={handleCancelConfirm} onClose={() => { setShowCancel(false); setCancelErr(''); setCancelReason(''); }} busy={cancelBusy} reason={cancelReason} onReasonChange={setCancelReason} />}
      {showReschedule && <RescheduleModal onConfirm={handleRescheduleConfirm} onClose={() => { setShowReschedule(false); setRescheduleDate(''); setRescheduleErr(''); }} busy={rescheduleBusy} date={rescheduleDate} onDateChange={setRescheduleDate} err={rescheduleErr} />}

      {/* Vendor rejected banner */}
      {rejectedNotification && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1050, width: 'calc(100% - 32px)', maxWidth: 400 }}>
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 16, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9F1239', margin: 0 }}>Order Rejected by Vendor</p>
              {rejectedNotification.reason && <p style={{ fontSize: 12, color: '#BE185D', margin: '2px 0 0' }}>Reason: {rejectedNotification.reason}</p>}
            </div>
            <button onClick={dismissRejected} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'max(1rem, env(safe-area-inset-top,1rem)) 20px 14px', background: 'white', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/orders')} style={{ width: 36, height: 36, borderRadius: 11, background: '#F4F4F8', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#B91C1C' }}>Track Order</span>
        </div>
        {firstName && (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{firstName[0]}</span>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {orders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>No orders to track</p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px' }}>Place your first order to track it here</p>
          <button onClick={() => navigate('/order')} style={{ background: '#B91C1C', border: 'none', color: 'white', fontWeight: 800, fontSize: 14, borderRadius: 14, padding: '13px 28px', cursor: 'pointer' }}>Book Pickup</button>
        </div>
      ) : !order ? null : (
        <div style={{ padding: isDesktop ? '28px 40px 40px' : '0', maxWidth: isDesktop ? 1100 : 'none' }}>

          {/* Order selector */}
          {orders.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: isDesktop ? '0 0 16px' : '12px 16px', marginBottom: isDesktop ? 0 : 0, scrollbarWidth: 'none' }}>
              {orders.map(o => (
                <button key={o.id} onClick={() => setSelectedId(o.id)} style={{
                  flexShrink: 0, padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: selectedId === o.id ? '#B91C1C' : 'white',
                  color: selectedId === o.id ? 'white' : '#374151',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                }}>
                  {o.order_code || `#${o.id}`}
                </button>
              ))}
            </div>
          )}

          {/* ── Main layout ── */}
          <div style={{ display: isDesktop ? 'grid' : 'block', gridTemplateColumns: isDesktop ? '1fr 360px' : undefined, gap: isDesktop ? 24 : undefined, alignItems: 'start' }}>

            {/* ── LEFT / MAIN ── */}
            <div style={{ padding: isDesktop ? 0 : '0 16px 32px' }}>

              {/* Status hero card */}
              <div style={{
                borderRadius: 22, overflow: 'hidden', marginBottom: 16,
                background: isCancelled ? 'linear-gradient(135deg,#1F2937,#374151)' : isDelivered ? 'linear-gradient(135deg,#065F46,#059669)' : 'linear-gradient(135deg,#7F1D1D,#B91C1C)',
                boxShadow: isCancelled ? '0 8px 30px rgba(31,41,55,0.3)' : isDelivered ? '0 8px 30px rgba(6,95,70,0.3)' : '0 8px 30px rgba(185,28,28,0.3)',
              }}>
                {/* Decorative circles */}
                <div style={{ position: 'relative', padding: '24px 24px 20px', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                  <div style={{ position: 'absolute', bottom: -20, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                      {order.order_code || `Order #${order.id}`}
                    </p>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: '0 0 6px', lineHeight: 1.2 }}>
                      {alert?.title}
                    </h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                      {alert?.sub}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                {!isCancelled && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${(currentStep / (TIMELINE_STEPS.length - 1)) * 100}%`, background: 'white', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Step {currentStep + 1} of {TIMELINE_STEPS.length}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{Math.round((currentStep / (TIMELINE_STEPS.length - 1)) * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live location */}
              {liveLocation?.orderId === order.id && ['delivery_assigned','picked_up','out_for_delivery'].includes(order.status) && (
                <div style={{ background: 'white', borderRadius: 18, padding: 18, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderLeft: '3px solid #22C55E' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)', animation: 'pulse 1.5s infinite' }} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Live Location</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '0 0 10px' }}>Delivery agent is on the way</p>
                  <a href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 12, background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" fill="#B91C1C" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
                    Open in Maps →
                  </a>
                </div>
              )}

              {/* Agent info */}
              {agentInfo?.orderId === order.id && ['delivery_assigned', 'picked_up', 'picked_from_vendor', 'out_for_delivery', 'delivery_rescheduled'].includes(order.status) && (
                <div style={{ background: 'white', borderRadius: 18, padding: 18, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Delivery Agent</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 15, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{agentInfo.agentName?.[0]?.toUpperCase() ?? 'D'}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>{agentInfo.agentName}</p>
                      {agentInfo.agentPhone && (
                        <a href={`tel:${agentInfo.agentPhone}`} style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, textDecoration: 'none' }}>{agentInfo.agentPhone}</a>
                      )}
                    </div>
                    {agentInfo.agentPhone && (
                      <a href={`tel:${agentInfo.agentPhone}`} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 11, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8 19.79 19.79 0 0110 2.18C10.51 2 11.06 2 11.62 2A2 2 0 0114 3.87c.15.6.35 1.19.59 1.76a2 2 0 01-.45 2.11L13 8.91a16 16 0 006.08 6.08l1.17-1.17a2 2 0 012.11-.45c.57.24 1.16.44 1.76.59a2 2 0 011.88 2.04z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Order details */}
              <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>Order Details</p>
                {detailRows.map((row, idx) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx < detailRows.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                    <span style={{ fontSize: 13, color: row.highlight ? '#D97706' : '#64748B', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: row.highlight ? '#D97706' : '#0F172A' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Garments */}
              {items.length > 0 && (
                <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Garments</p>
                  {items.map((g, i) => (
                    <div key={g.id ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < items.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {g.garment_name} <span style={{ color: '#94A3B8', fontWeight: 400 }}>× {g.quantity}</span>
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>₹{parseFloat(g.subtotal || 0).toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4, borderTop: '1.5px dashed #E2E8F0' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Total Paid</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#B91C1C' }}>₹{total.toFixed(0)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: 99 }}>PAID</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel button */}
              {order.status === 'pending' && (
                <div style={{ marginBottom: 12 }}>
                  <button onClick={() => { setShowCancel(true); setCancelErr(''); }}
                    style={{ width: '100%', padding: '14px', borderRadius: 16, background: '#FFF1F2', border: '1.5px solid #FECDD3', color: '#E11D48', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Cancel Order
                  </button>
                  {cancelErr && <p style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>{cancelErr}</p>}
                </div>
              )}

              {/* Reschedule button */}
              {order.status === 'out_for_delivery' && (
                <div style={{ marginBottom: 12 }}>
                  <button onClick={() => { setShowReschedule(true); setRescheduleErr(''); }}
                    style={{ width: '100%', padding: '14px', borderRadius: 16, background: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#1D4ED8', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Reschedule Delivery
                  </button>
                </div>
              )}

              {/* Rating */}
              {isDelivered && <RatingSection orderId={order.id} />}

              {/* Support */}
              <button
                onClick={() => { window.location.href = 'tel:+918031339999'; }}
                style={{ width: '100%', padding: '15px 20px', borderRadius: 18, background: '#B91C1C', border: 'none', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8 19.79 19.79 0 0110 2.18C10.51 2 11.06 2 11.62 2A2 2 0 0114 3.87c.15.6.35 1.19.59 1.76a2 2 0 01-.45 2.11L13 8.91a16 16 0 006.08 6.08l1.17-1.17a2 2 0 012.11-.45c.57.24 1.16.44 1.76.59a2 2 0 011.88 2.04z" />
                </svg>
                Contact Support
              </button>
            </div>

            {/* ── RIGHT / TIMELINE sidebar ── */}
            <div style={{
              background: 'white', borderRadius: 22, padding: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              position: isDesktop ? 'sticky' : 'static',
              top: isDesktop ? 24 : 'auto',
              margin: isDesktop ? 0 : '0 16px 16px',
              order: isDesktop ? 0 : -1,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 20px' }}>
                {isCancelled ? 'Order Cancelled' : 'Order Progress'}
              </p>
              {isCancelled ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', margin: 0 }}>Order Cancelled</p>
                </div>
              ) : (
                <Timeline currentStep={currentStep} isCancelled={isCancelled} isDelivered={isDelivered} />
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
