import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import heroImg       from '../assets/hero.png';
import iconPickup    from '../assets/icon_pickup.svg';
import iconSecure    from '../assets/icon_secure.svg';
import iconQuality   from '../assets/icon_quality.svg';
import iconDelivery  from '../assets/icon_delivery.svg';

const STATUS_LABEL = {
  pending:              'Order Placed',
  vendor_accepted:      'Vendor Confirmed',
  delivery_assigned:    'Agent Assigned',
  picked_up:            'Picked Up',
  at_vendor:            'At Iron Shop',
  ironing_in_progress:  'Processing',
  in_progress:          'Processing',
  ready_for_delivery:   'Ready',
  picked_from_vendor:   'On the Way',
  out_for_delivery:     'In Transit',
  delivery_rescheduled: 'Rescheduled',
  delivered:            'Delivered',
  cancelled:            'Cancelled',
};

const STATUS_PROGRESS = {
  pending: 10, vendor_accepted: 22, delivery_assigned: 32,
  picked_up: 45, at_vendor: 55, ironing_in_progress: 65, in_progress: 65,
  ready_for_delivery: 78, picked_from_vendor: 85, out_for_delivery: 92,
  delivery_rescheduled: 88, delivered: 100, cancelled: 0,
};

const FEATURES = [
  { label: 'Fast Pickup',      sub: "We'll pickup at your doorstep", icon: iconPickup   },
  { label: 'Secure Service',   sub: 'Your clothes are in safe hands', icon: iconSecure   },
  { label: 'Quality Care',     sub: 'Best care for your clothes',     icon: iconQuality  },
  { label: 'On Time Delivery', sub: 'Timely delivery always',         icon: iconDelivery },
];

function getActivityText(status) {
  if (status === 'out_for_delivery')     return 'Your clothes are being delivered';
  if (status === 'picked_up')            return 'Clothes picked up from you';
  if (['ironing_in_progress', 'in_progress'].includes(status)) return 'Your clothes are being ironed';
  if (status === 'delivery_rescheduled') return 'Delivery rescheduled by you';
  if (status === 'delivered')            return 'Order delivered successfully';
  return 'Your order is being processed';
}

export default function HomePage() {
  const { orders, loadOrders } = useOrder();
  const navigate = useNavigate();

  useEffect(() => { loadOrders(); }, []);

  const activeOrder = orders.find(o => !['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F8' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))', paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}
      >
        <span style={{ color: '#B91C1C', fontSize: 18, fontWeight: 900, letterSpacing: '0.04em' }}>IRON MAN</span>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5"
          style={{ color: '#B91C1C', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" fill="#B91C1C" width="14" height="14">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
          </svg>
          Home
          <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" width="11" height="11">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      <div className="px-4 pt-4" style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* ── Hero banner ── */}
        <div
          className="rounded-3xl overflow-hidden mb-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #fff0f3 0%, #ffe4ec 60%, #ffd6e7 100%)', minHeight: 150, padding: '20px 0 20px 22px', position: 'relative' }}
        >
          <div style={{ flex: 1, zIndex: 1 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', lineHeight: 1.2, margin: 0 }}>
              What do you<br />need today?
            </h1>
            <div style={{ width: 36, height: 3, background: '#B91C1C', borderRadius: 2, marginTop: 10 }} />
          </div>
          <img
            src={heroImg}
            alt=""
            style={{ width: 160, height: 150, objectFit: 'cover', flexShrink: 0, borderRadius: '0 1.5rem 1.5rem 0' }}
          />
        </div>

        {/* ── Ironing Service card ── */}
        <div
          className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 mb-3"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 32 32" fill="none" width="24" height="24">
                <path d="M6 22h14l3-6H9c-1.66 0-3 1.34-3 3v3z" fill="#FECACA"/>
                <path d="M6 22h14l3-6H9c-1.66 0-3 1.34-3 3v3z" stroke="#B91C1C" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M20 16h4a1.5 1.5 0 011.5 1.5v2H20" stroke="#B91C1C" strokeWidth="1.4" strokeLinejoin="round"/>
                <line x1="11" y1="26" x2="15" y2="26" stroke="#B91C1C" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Ironing Service</p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>Pickup &amp; Delivery available</p>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
        </div>

        {/* ── Book Pickup button ── */}
        <button
          onClick={() => navigate('/order')}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl mb-3 font-bold text-white"
          style={{ background: '#B91C1C', padding: '15px 20px', fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(185,28,28,0.35)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Book Pickup
        </button>

        {/* ── Track / View Orders ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => navigate('/track')}
            className="flex items-center justify-between bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                  <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0 }}>Track Orders</p>
                <p style={{ fontSize: 10.5, color: '#94A3B8', margin: '2px 0 0' }}>Track in real-time</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="flex items-center justify-between bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0 }}>View Orders</p>
                <p style={{ fontSize: 10.5, color: '#94A3B8', margin: '2px 0 0' }}>View order history</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* ── Current Activity ── */}
        {orders.length > 0 && (
          <div className="mb-4">
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Current Activity
            </p>
            {activeOrder ? (
              <button
                onClick={() => navigate('/track')}
                className="w-full text-left bg-white rounded-2xl p-4"
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer' }}
              >
                <div className="flex items-start gap-3">
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/>
                      <rect x="9" y="11" width="14" height="10" rx="2"/>
                      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ORDER #{activeOrder.order_code || activeOrder.id}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: 99 }}>
                        {STATUS_LABEL[activeOrder.status] || activeOrder.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
                      {getActivityText(activeOrder.status)}
                    </p>
                    <div style={{ height: 4, background: '#F0F0F5', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${STATUS_PROGRESS[activeOrder.status] || 10}%`, height: '100%', background: '#B91C1C', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, margin: '0 0 4px' }}>No active orders right now</p>
                <button
                  onClick={() => navigate('/orders')}
                  style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  View order history →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Features ── */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {FEATURES.map(f => (
            <div key={f.label} className="flex flex-col items-center text-center gap-2">
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={f.icon} alt={f.label} width={22} height={22} />
              </div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{f.label}</p>
              <p style={{ fontSize: 9.5, color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>{f.sub}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
