import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';

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

const STATUS_LABEL = {
  pending:              'Order Placed',
  vendor_accepted:      'Confirmed',
  delivery_assigned:    'Agent Assigned',
  picked_up:            'Picked Up',
  at_vendor:            'At Iron Shop',
  ironing_in_progress:  'Ironing',
  in_progress:          'Ironing',
  ready_for_delivery:   'Ready',
  picked_from_vendor:   'On the Way',
  out_for_delivery:     'In Transit',
  delivery_rescheduled: 'Rescheduled',
  delivered:            'Delivered',
  cancelled:            'Cancelled',
};

const STATUS_COLOR = {
  pending:              { bg: '#FEF9C3', color: '#92400E', dot: '#F59E0B' },
  vendor_accepted:      { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
  delivery_assigned:    { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
  picked_up:            { bg: '#EDE9FE', color: '#6D28D9', dot: '#8B5CF6' },
  at_vendor:            { bg: '#EDE9FE', color: '#6D28D9', dot: '#8B5CF6' },
  ironing_in_progress:  { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  in_progress:          { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  ready_for_delivery:   { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  picked_from_vendor:   { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
  out_for_delivery:     { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  delivery_rescheduled: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  delivered:            { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  cancelled:            { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

const STATUS_PROGRESS = {
  pending: 10, vendor_accepted: 22, delivery_assigned: 32,
  picked_up: 45, at_vendor: 55, ironing_in_progress: 65, in_progress: 65,
  ready_for_delivery: 78, picked_from_vendor: 85, out_for_delivery: 92,
  delivery_rescheduled: 88, delivered: 100, cancelled: 0,
};

function parseItems(raw) {
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); }
  catch { return []; }
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: s.bg, fontSize: 11, fontWeight: 700, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {STATUS_LABEL[status] || status}
    </span>
  );
}

/* ── Ongoing Order Card ── */
function OngoingCard({ order, onTrack, aptDeliveryTime, desktop }) {
  const items     = parseItems(order.items);
  const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0) || items.length;
  const progress  = STATUS_PROGRESS[order.status] || 10;
  const displayId = order.order_code || `#${order.id}`;
  const total     = parseFloat(order.total || 0).toFixed(0);

  return (
    <div style={{
      background: 'white', borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      border: '1px solid #F1F5F9',
    }}>
      {/* Red accent bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #B91C1C 0%, #EF4444 100%)' }} />

      <div style={{ padding: desktop ? 24 : 18 }}>
        {/* Top row: order id + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>ORDER ID</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '3px 0 0' }}>{displayId}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', margin: '0 0 3px' }}>CLOTHES</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{itemCount > 0 ? itemCount : '—'}</p>
          </div>
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', margin: '0 0 3px' }}>AMOUNT</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#B91C1C', margin: 0 }}>₹{total}</p>
          </div>
          <div style={{ background: aptDeliveryTime ? '#EFF6FF' : '#F8FAFC', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: aptDeliveryTime ? '#2563EB' : '#94A3B8', letterSpacing: '0.08em', margin: '0 0 3px' }}>DELIVERY</p>
            <p style={{ fontSize: aptDeliveryTime ? 12 : 15, fontWeight: 800, color: aptDeliveryTime ? '#1D4ED8' : '#94A3B8', margin: 0 }}>{aptDeliveryTime || 'TBD'}</p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', margin: 0 }}>Order Progress</p>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#B91C1C', margin: 0 }}>{progress}%</p>
          </div>
          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #B91C1C 0%, #EF4444 100%)', borderRadius: 99, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Track button */}
        <button
          onClick={() => onTrack(order.id)}
          style={{ width: '100%', padding: '13px', borderRadius: 14, background: '#B91C1C', color: 'white', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
          </svg>
          Track Order
        </button>
      </div>
    </div>
  );
}

/* ── Past Order Row ── */
function PastOrderRow({ order, aptDeliveryTime }) {
  const [expanded, setExpanded] = useState(false);
  const displayId  = order.order_code || `#${order.id}`;
  const items      = parseItems(order.items);
  const itemCount  = items.reduce((s, i) => s + (i.quantity || 1), 0) || items.length;
  const total      = parseFloat(order.total || 0).toFixed(0);
  const isCancelled = order.status === 'cancelled';

  return (
    <div style={{ background: 'white', borderRadius: 16, marginBottom: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
      {/* Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        {/* Status dot icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isCancelled ? '#FEE2E2' : '#D1FAE5',
        }}>
          {isCancelled ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{displayId}</p>
            <span style={{ fontSize: 10, fontWeight: 700, color: isCancelled ? '#EF4444' : '#10B981', background: isCancelled ? '#FEE2E2' : '#D1FAE5', padding: '2px 6px', borderRadius: 99 }}>
              {isCancelled ? 'Cancelled' : 'Delivered'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, fontWeight: 500 }}>
            {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : '—'}
            &nbsp;·&nbsp;
            <span style={{ fontWeight: 700, color: '#475569' }}>₹{total}</span>
            {order.created_at ? `  ·  ${formatDate(order.created_at)}` : ''}
          </p>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F8FAFC', padding: '14px 16px 16px' }}>
          {/* Info chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {order.pickup_date && (
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '7px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', margin: '0 0 2px' }}>PICKUP DATE</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {new Date(order.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
            {(order.time_slot || order.slot) && (
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '7px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', margin: '0 0 2px' }}>PICKUP TIME</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', margin: 0 }}>{order.time_slot || order.slot}</p>
              </div>
            )}
            {aptDeliveryTime && (
              <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '7px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#2563EB', letterSpacing: '0.06em', margin: '0 0 2px' }}>DELIVERY TIME</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', margin: 0 }}>{aptDeliveryTime}</p>
              </div>
            )}
            {order.status === 'delivered' && order.updated_at && (
              <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '7px 12px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#065F46', letterSpacing: '0.06em', margin: '0 0 2px' }}>DELIVERED ON</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#065F46', margin: 0 }}>
                  {new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', margin: '0 0 8px' }}>ITEMS</p>
              {items.map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    {g.garment_name}
                    <span style={{ color: '#94A3B8', fontWeight: 400 }}> × {g.quantity}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>₹{parseFloat(g.subtotal || (g.unit_price * g.quantity) || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1.5px dashed #E2E8F0' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Total Paid</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#B91C1C' }}>₹{total}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ navigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
        </svg>
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>No orders yet</p>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px' }}>Place your first ironing order</p>
      <button
        onClick={() => navigate('/order')}
        style={{ background: '#B91C1C', color: 'white', border: 'none', borderRadius: 14, padding: '13px 32px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
      >
        Book Pickup
      </button>
    </div>
  );
}

/* ── Main Page ── */
export default function OrdersListPage() {
  const { user }                    = useAuth();
  const { orders, apartments, loadOrders } = useOrder();
  const navigate                    = useNavigate();
  const isDesktop                   = useIsDesktop();
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders   = orders.filter(o =>  ['delivered', 'cancelled'].includes(o.status));
  const visiblePast  = showAllPast ? pastOrders : pastOrders.slice(0, 5);

  const getDeliveryTime = (order) =>
    order.apartment ? (apartments.find(a => a.name === order.apartment)?.delivery_time ?? null) : null;

  const handleTrack = (orderId) => navigate(`/track?id=${orderId}`);

  const firstName = user?.name?.split(' ')[0] ?? '';

  /* ── DESKTOP ── */
  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F8', padding: '32px 40px 40px' }}>

        {/* Page heading */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>My Orders</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0 }}>Order History</h1>
          </div>
          <button
            onClick={() => navigate('/order')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#B91C1C', color: 'white', border: 'none', borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Order
          </button>
        </div>

        {orders.length === 0 ? <EmptyState navigate={navigate} /> : (
          <div style={{ display: 'grid', gridTemplateColumns: activeOrders.length > 0 ? '1fr 380px' : '1fr', gap: 28, alignItems: 'start' }}>

            {/* Left: Past Orders */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Past Orders</h2>
                {pastOrders.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '3px 10px', borderRadius: 99 }}>
                    {pastOrders.length} orders
                  </span>
                )}
              </div>
              {pastOrders.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>No past orders</p>
                </div>
              ) : (
                <>
                  {visiblePast.map(order => (
                    <PastOrderRow key={order.id} order={order} aptDeliveryTime={getDeliveryTime(order)} />
                  ))}
                  {!showAllPast && pastOrders.length > 5 && (
                    <button
                      onClick={() => setShowAllPast(true)}
                      style={{ width: '100%', padding: '12px', background: 'white', border: '1.5px dashed #E2E8F0', borderRadius: 14, color: '#B91C1C', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                    >
                      View all {pastOrders.length} orders →
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Right: Active Orders */}
            {activeOrders.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Active Orders</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C', background: '#FEE2E2', padding: '3px 10px', borderRadius: 99 }}>
                    {activeOrders.length} active
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activeOrders.map(order => (
                    <OngoingCard key={order.id} order={order} onTrack={handleTrack} aptDeliveryTime={getDeliveryTime(order)} desktop />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── MOBILE ── */
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F8' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'max(1rem, env(safe-area-inset-top,1rem)) 20px 14px', background: 'white', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" fill="#B91C1C" width="14" height="14">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
          </svg>
          <span style={{ color: '#B91C1C', fontSize: 18, fontWeight: 900, letterSpacing: '0.04em' }}>IRON MAN</span>
        </div>
        {firstName && (
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{firstName[0]}</span>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px 32px' }}>

        {orders.length === 0 ? <EmptyState navigate={navigate} /> : (
          <>
            {/* Active Orders */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>Active Service</p>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Ongoing Orders</h1>
              </div>
              {activeOrders.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C', background: '#FEE2E2', padding: '4px 10px', borderRadius: 99 }}>
                  {activeOrders.length} active
                </span>
              )}
            </div>

            {activeOrders.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 18, padding: '20px', textAlign: 'center', marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, margin: '0 0 12px' }}>No active orders</p>
                <button
                  onClick={() => navigate('/order')}
                  style={{ background: '#B91C1C', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Book a Pickup
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {activeOrders.map(order => (
                  <OngoingCard key={order.id} order={order} onTrack={handleTrack} aptDeliveryTime={getDeliveryTime(order)} desktop={false} />
                ))}
              </div>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Past Orders</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '3px 10px', borderRadius: 99 }}>
                    {pastOrders.length} orders
                  </span>
                </div>
                {visiblePast.map(order => (
                  <PastOrderRow key={order.id} order={order} aptDeliveryTime={getDeliveryTime(order)} />
                ))}
                {!showAllPast && pastOrders.length > 5 && (
                  <button
                    onClick={() => setShowAllPast(true)}
                    style={{ width: '100%', padding: '13px', background: 'white', border: '1.5px dashed #E2E8F0', borderRadius: 14, color: '#B91C1C', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                  >
                    View all {pastOrders.length} orders →
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
