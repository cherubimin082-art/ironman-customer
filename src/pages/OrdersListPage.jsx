import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';

const STATUS_LABEL = {
  pending:             'Placed',
  vendor_accepted:     'Confirmed',
  delivery_assigned:   'Agent Assigned',
  picked_up:           'Picked Up',
  at_vendor:           'At Shop',
  ironing_in_progress: 'Ironing',
  in_progress:         'Ironing',
  ready_for_delivery:  'Ready',
  picked_from_vendor:  'On the Way',
  out_for_delivery:    'In Transit',
  delivered:           'Delivered',
  cancelled:           'Cancelled',
};

const STATUS_PROGRESS = {
  pending: 10, vendor_accepted: 22, delivery_assigned: 32,
  picked_up: 45, at_vendor: 55, ironing_in_progress: 65, in_progress: 65,
  ready_for_delivery: 78, picked_from_vendor: 85, out_for_delivery: 92,
  delivered: 100, cancelled: 0,
};

function parseItems(raw) {
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); }
  catch { return []; }
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
}

function IronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <path d="M4 17h11l2.5-5H6a2 2 0 00-2 2v3z" fill="#FECACA" stroke="#B91C1C" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M15.5 12h3.5a1 1 0 011 1v2h-4.5" stroke="#B91C1C" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="7" y1="20" x2="10" y2="20" stroke="#B91C1C" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ScooterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <circle cx="6" cy="18" r="2" stroke="#94A3B8" strokeWidth="1.2" />
      <circle cx="18" cy="18" r="2" stroke="#94A3B8" strokeWidth="1.2" />
      <path d="M4 18h-2M8 18h6l2-4h-4l-2-4h-2l1 4H8" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14h2a2 2 0 012 2v2" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 9 15" />
    </svg>
  );
}

function OngoingCard({ order, onTrack, aptDeliveryTime }) {
  const items = parseItems(order.items);
  const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0) || items.length;
  const progress = STATUS_PROGRESS[order.status] || 10;
  const displayId = order.order_code || `#${order.id}`;
  const statusLabel = STATUS_LABEL[order.status] || order.status;

  const getProgressLabel = () => {
    if (order.status === 'out_for_delivery') return 'IN TRANSIT';
    if (['ironing_in_progress', 'in_progress', 'at_vendor'].includes(order.status)) return 'PROCESSING';
    if (order.status === 'picked_up') return 'PICKED UP';
    if (order.status === 'ready_for_delivery') return 'READY';
    return statusLabel.toUpperCase();
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 mb-3"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: '3px solid #B91C1C' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', margin: 0 }}>ORDER ID</p>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{displayId}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IronIcon />
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScooterIcon />
          </div>
        </div>
      </div>

      {/* Items + Delivery row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div style={{ background: '#F4F4F8', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', margin: '0 0 2px' }}>ITEMS</p>
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{itemCount > 0 ? `${String(itemCount).padStart(2,'0')} Clothes` : 'Items'}</span>
          </div>
        </div>
        <div style={{ background: aptDeliveryTime ? '#eff6ff' : '#F4F4F8', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ fontSize: 9.5, fontWeight: 700, color: aptDeliveryTime ? '#2563eb' : '#94A3B8', letterSpacing: '0.06em', margin: '0 0 2px' }}>DELIVERY TIME</p>
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke={aptDeliveryTime ? '#2563eb' : '#374151'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: aptDeliveryTime ? '#1d4ed8' : '#0F172A' }}>{aptDeliveryTime || 'TBD'}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-1.5">
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em' }}>{getProgressLabel()}</p>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#374151' }}>{progress}%</p>
      </div>
      <div style={{ height: 5, background: '#F0F0F5', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#B91C1C', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>

      {/* Track button */}
      <button
        onClick={() => onTrack(order.id)}
        className="w-full font-bold text-white rounded-xl py-3 transition-all active:scale-[0.98]"
        style={{ background: '#B91C1C', border: 'none', cursor: 'pointer', fontSize: 14 }}
      >
        Track Order
      </button>
    </div>
  );
}

function PastOrderRow({ order, aptDeliveryTime }) {
  const [expanded, setExpanded] = useState(false);
  const displayId = order.order_code || `#${order.id}`;
  const items = parseItems(order.items);
  const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0) || items.length;
  const total = parseFloat(order.total || 0).toFixed(0);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-white rounded-2xl mb-2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {/* Summary row */}
      <div className="flex items-center gap-3 p-4">
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClockIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 10, fontWeight: 700, color: isCancelled ? '#EF4444' : '#94A3B8', letterSpacing: '0.06em', margin: 0 }}>
            {isCancelled ? 'CANCELLED' : 'COMPLETED'}{order.created_at ? ` · ${formatDate(order.created_at)}` : ''}
          </p>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '2px 0 1px' }}>{displayId}</p>
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, margin: 0 }}>
            {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : 'Items'} · ₹{total}
          </p>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            border: '1.5px solid #B91C1C', color: '#B91C1C', background: 'white',
            borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          View Order
          <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '14px 16px 16px' }}>
          {/* Pickup info */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {order.pickup_date && (
              <div style={{ background: '#F4F4F8', borderRadius: 10, padding: '8px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', margin: '0 0 2px' }}>PICKUP DATE</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {new Date(order.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
            {(order.time_slot || order.slot) && (
              <div style={{ background: '#F4F4F8', borderRadius: 10, padding: '8px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', margin: '0 0 2px' }}>PICKUP TIME</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', margin: 0 }}>{order.time_slot || order.slot}</p>
              </div>
            )}
            {aptDeliveryTime && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', letterSpacing: '0.06em', margin: '0 0 2px' }}>DELIVERY TIME</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', margin: 0 }}>{aptDeliveryTime}</p>
              </div>
            )}
            {order.status === 'delivered' && order.updated_at && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', letterSpacing: '0.06em', margin: '0 0 2px' }}>DELIVERED ON</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: 0 }}>
                  {new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', margin: '0 0 8px' }}>ITEMS</p>
              {items.map((g, i) => (
                <div key={i} className="flex justify-between items-center py-1.5" style={{ borderBottom: i < items.length - 1 ? '1px solid #F4F4F8' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>
                    {g.garment_name} <span style={{ color: '#94A3B8' }}>× {g.quantity}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>₹{parseFloat(g.subtotal || (g.unit_price * g.quantity) || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Total Paid</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#B91C1C' }}>₹{total}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersListPage() {
  const { user } = useAuth();
  const { orders, apartments, loadOrders } = useOrder();
  const navigate = useNavigate();

  useEffect(() => { loadOrders(); }, []);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders   = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const getDeliveryTime = (order) =>
    order.apartment ? (apartments.find(a => a.name === order.apartment)?.delivery_time ?? null) : null;
  const firstName    = user?.name?.split(' ')[0] ?? '';

  const handleTrack = (orderId) => {
    navigate(`/track?id=${orderId}`);
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0F0F5' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))', paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="#B91C1C" width="14" height="14">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
          </svg>
          <span style={{ color: '#B91C1C', fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em' }}>IRON MAN</span>
        </div>
        {firstName && (
          <div style={{ width: 34, height: 34, borderRadius: 99, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{firstName[0]}</span>
          </div>
        )}
      </div>

      <div className="px-4 pt-5">

        {/* ── Section header ── */}
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
          Active Service
        </p>
        <div className="flex items-center justify-between mb-5">
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0 }}>Ongoing Orders</h1>
          {activeOrders.length > 0 && (
            <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>
              {activeOrders.length} ACTIVE
            </span>
          )}
        </div>

        {/* ── Active orders ── */}
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center mb-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, margin: 0 }}>No active orders</p>
            <button
              onClick={() => navigate('/order')}
              className="mt-3 font-bold rounded-xl py-2.5 px-6 text-white"
              style={{ background: '#B91C1C', border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Book a Pickup
            </button>
          </div>
        ) : (
          activeOrders.map(order => (
            <OngoingCard key={order.id} order={order} onTrack={handleTrack} aptDeliveryTime={getDeliveryTime(order)} />
          ))
        )}

        {/* ── Past orders ── */}
        {pastOrders.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '8px 0 14px' }}>Past Orders</h2>
            {pastOrders.slice(0, 5).map(order => (
              <PastOrderRow key={order.id} order={order} aptDeliveryTime={getDeliveryTime(order)} />
            ))}
            {pastOrders.length > 5 && (
              <button
                className="w-full text-center py-3 font-bold"
                style={{ color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
              >
                View All Orders →
              </button>
            )}
          </>
        )}

        {orders.length === 0 && (
          <div className="text-center py-16">
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>No orders yet</p>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 16px' }}>Place your first ironing order</p>
            <button
              onClick={() => navigate('/order')}
              className="font-bold rounded-2xl py-3 px-8 text-white"
              style={{ background: '#B91C1C', border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Book Pickup
            </button>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
