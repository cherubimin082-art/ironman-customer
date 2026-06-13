import { useState } from 'react';
import { useOrder } from '../context/OrderContext';
import OrderStatusBar from '../components/OrderStatusBar';
import { CalendarIcon, ClockIcon } from '../components/Icons';

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
  out_for_delivery:     { label: 'Out for Delivery',     bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
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
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_4px_14px_rgba(99,102,241,0.4)]'
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
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4">
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
        className="block w-full text-center py-2.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
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
        active ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-bold ${active ? 'text-indigo-700' : 'text-slate-800'}`}>{displayId}</p>
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

// ── Main ──────────────────────────────────────────────────────
export default function TrackPage() {
  const { orders, otpNotification, dismissOtp, liveLocation, agentInfo } = useOrder();
  const [selectedId, setSelectedId] = useState(
    () => orders.find((o) => !['delivered', 'cancelled'].includes(o.status))?.id ?? orders[0]?.id
  );

  const order = orders.find((o) => o.id === selectedId);
  const cfg = order ? (STATUS_CONFIG[order.status] ?? { label: order.status, bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' }) : null;
  const items = order ? parseItems(order.items) : [];
  const total = items.reduce((s, i) => s + parseFloat(i.subtotal || (i.unit_price * i.quantity) || 0), 0) || parseFloat(order?.total || 0);
  const showLocation = order && ['delivery_assigned', 'picked_up', 'out_for_delivery'].includes(order.status);

  return (
    <div className="min-h-screen pb-28 lg:pb-0">
      {/* OTP popup */}
      <OtpPopup notification={otpNotification} onDismiss={dismissOtp} />

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
                      selectedId === o.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
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
                      <span className="text-base font-bold text-indigo-600">₹{total.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pickup Info</p>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                        <ClockIcon size={15} className="text-indigo-600" />
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
