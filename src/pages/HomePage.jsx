import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';

const STATUS_LABEL = {
  pending:             'Order Placed',
  vendor_accepted:     'Vendor Confirmed',
  delivery_assigned:   'Agent Assigned',
  picked_up:           'Picked Up',
  at_vendor:           'At Iron Shop',
  ironing_in_progress: 'Processing',
  in_progress:         'Processing',
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

function IronSvg() {
  return (
    <div style={{ width: 46, height: 46, borderRadius: 12, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg viewBox="0 0 32 32" fill="none" width="26" height="26">
        <path d="M6 22h14l3-6H9c-1.66 0-3 1.34-3 3v3z" fill="#FECACA" />
        <path d="M6 22h14l3-6H9c-1.66 0-3 1.34-3 3v3z" stroke="#B91C1C" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M20 16h4a1.5 1.5 0 011.5 1.5v2H20" stroke="#B91C1C" strokeWidth="1.4" strokeLinejoin="round" />
        <line x1="11" y1="26" x2="15" y2="26" stroke="#B91C1C" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    </svg>
  );
}

export default function HomePage() {
  const { orders } = useOrder();
  const navigate = useNavigate();

  const activeOrder = orders.find(o => !['delivered', 'cancelled'].includes(o.status));

  const getActivityText = (status) => {
    if (status === 'out_for_delivery') return 'Your clothes are being delivered';
    if (status === 'picked_up') return 'Clothes picked up from you';
    if (status === 'ironing_in_progress' || status === 'in_progress') return 'Your clothes are being ironed';
    if (status === 'delivered') return 'Order delivered';
    return 'Your order is being processed';
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0F0F5' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))', paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}
      >
        <span style={{ color: '#B91C1C', fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em' }}>IRON MAN</span>
        <button onClick={() => navigate('/profile')} className="flex items-center gap-1" style={{ color: '#B91C1C', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="#B91C1C" width="13" height="13">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
          </svg>
          Home
          <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" width="11" height="11">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <div className="px-5 pt-7">

        {/* ── Hero heading ── */}
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', lineHeight: 1.15, margin: 0 }}>
          What do you<br />need today?
        </h1>
        <div style={{ width: 38, height: 3, background: '#B91C1C', borderRadius: 2, marginTop: 10, marginBottom: 22 }} />

        {/* ── Service card ── */}
        <div
          className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 mb-3"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Ironing Service</p>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '3px 0 0', fontWeight: 500 }}>Pickup &amp; Delivery available</p>
          </div>
          <IronSvg />
        </div>

        {/* ── Book Pickup button ── */}
        <button
          onClick={() => navigate('/order')}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl mb-3 font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: '#B91C1C', padding: '15px 20px', fontSize: 16, border: 'none', cursor: 'pointer' }}
        >
          Book Pickup
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        {/* ── Two quick action buttons ── */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          <button
            onClick={() => navigate('/track')}
            className="flex items-center justify-center gap-2 bg-white rounded-2xl py-3.5 font-semibold transition-all active:scale-[0.97]"
            style={{ color: '#374151', fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
            </svg>
            Track Orders
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center justify-center gap-2 bg-white rounded-2xl py-3.5 font-semibold transition-all active:scale-[0.97]"
            style={{ color: '#374151', fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 9 15" />
            </svg>
            View Orders
          </button>
        </div>

        {/* ── Current activity ── */}
        {orders.length > 0 && (
          <>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Current Activity
            </p>

            {activeOrder ? (
              <button
                onClick={() => navigate('/track')}
                className="w-full text-left bg-white rounded-2xl p-4 transition-all active:scale-[0.98]"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: '#B91C1C' }}
                  >
                    <TruckIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                        ORDER #{activeOrder.order_code || activeOrder.id}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#FEE2E2', color: '#B91C1C' }}
                      >
                        {STATUS_LABEL[activeOrder.status] || activeOrder.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '3px 0 10px' }}>
                      {getActivityText(activeOrder.status)}
                    </p>
                    <div className="rounded-full overflow-hidden" style={{ height: 4, background: '#F0F0F5' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${STATUS_PROGRESS[activeOrder.status] || 10}%`, background: '#B91C1C' }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div
                className="bg-white rounded-2xl p-4 text-center"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              >
                <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>No active orders right now</p>
                <button
                  onClick={() => navigate('/orders')}
                  style={{ fontSize: 13, color: '#B91C1C', fontWeight: 700, marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  View order history →
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
