import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import OrderStatusBar from '../components/OrderStatusBar';
import { MapPinIcon, BagIcon, GridIcon, ArrowRightIcon, TagIcon } from '../components/Icons';

const PROMOS = [
  { id: 1, label: 'Limited offer', title: '20% off your first order',  subtitle: 'Use code IRON20',      from: 'from-red-500', to: 'to-violet-600'  },
  { id: 2, label: 'Free pickup',   title: 'Free pickup above ₹150',    subtitle: 'No minimum distance',  from: 'from-emerald-400', to: 'to-teal-600'   },
  { id: 3, label: 'Same day',      title: 'Same-day delivery',          subtitle: 'Order before 12 PM',   from: 'from-amber-400',  to: 'to-orange-500' },
];

const QUICK_ACTIONS = [
  { label: 'New Order',     desc: 'Place an ironing order',  path: '/order',   bg: 'bg-red-50',  text: 'text-red-600',  Icon: BagIcon    },
  { label: 'Track Order',   desc: 'Check your order status', path: '/track',   bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: MapPinIcon  },
  { label: 'Order History', desc: 'View all past orders',    path: '/profile', bg: 'bg-amber-50',   text: 'text-amber-600',   Icon: GridIcon   },
  { label: 'Support',       desc: 'Get help or contact us',  path: null,       bg: 'bg-rose-50',    text: 'text-rose-500',    Icon: TagIcon    },
];

export default function HomePage() {
  const { user } = useAuth();
  const { orders } = useOrder();
  const navigate = useNavigate();

  const activeOrder = orders.find((o) => !['delivered', 'cancelled'].includes(o.status));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen pb-28 lg:pb-0">
      {/* ── Header ── */}
      <div
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 px-5 pb-8 lg:pt-10 lg:pb-10 lg:rounded-none rounded-b-[32px]"
        style={{ paddingTop: 'max(3rem, env(safe-area-inset-top, 3rem))' }}
      >
        <div className="max-w-7xl mx-auto lg:px-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">{greeting()},</p>
              <h2 className="text-xl lg:text-2xl font-bold text-white mt-0.5 tracking-tight">{firstName}</h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPinIcon size={13} className="text-red-400 shrink-0" />
                <p className="text-slate-400 text-xs truncate max-w-[240px] lg:max-w-sm">{user?.address}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/30 flex items-center justify-center shrink-0 lg:hidden">
              <span className="text-white font-bold text-base">{firstName[0]}</span>
            </div>
            {/* Desktop: stat chips */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-bold text-white">{orders.length}</p>
                <p className="text-[10px] text-slate-400">Total Orders</p>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center">
                <p className="text-lg font-bold text-white">{orders.filter(o => o.status === 'delivered').length}</p>
                <p className="text-[10px] text-slate-400">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 lg:pt-8">

        {/* Active order – full width */}
        {activeOrder && (
          <button
            className="w-full mb-5 lg:mb-8 bg-white rounded-2xl px-4 pt-3.5 pb-4 shadow-sm border border-slate-100 text-left hover:shadow-md active:scale-[0.99] transition-all"
            onClick={() => navigate('/track')}
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Order</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{activeOrder.id}</p>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <span className="text-xs font-medium">Track</span>
                <ArrowRightIcon size={13} />
              </div>
            </div>
            <OrderStatusBar status={activeOrder.status} />
          </button>
        )}

        {/* ── Two-column grid on desktop ── */}
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:items-start">

          {/* Left: Promos */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Offers for you</p>

            {/* Mobile: horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-4 px-4 lg:hidden">
              {PROMOS.map((promo) => (
                <div key={promo.id} className={`flex-shrink-0 w-56 bg-gradient-to-br ${promo.from} ${promo.to} rounded-2xl p-4`}>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full mb-2">{promo.label}</span>
                  <p className="font-bold text-sm text-white leading-snug">{promo.title}</p>
                  <p className="text-xs text-white/75 mt-0.5">{promo.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Desktop: 3-column grid */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 mb-8">
              {PROMOS.map((promo) => (
                <div key={promo.id} className={`bg-gradient-to-br ${promo.from} ${promo.to} rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform`}>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full mb-3">{promo.label}</span>
                  <p className="font-bold text-base text-white leading-snug">{promo.title}</p>
                  <p className="text-sm text-white/75 mt-1">{promo.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Desktop: recent orders preview */}
            {orders.length > 0 && (
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Orders</p>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {orders.slice(0, 3).map((order, idx) => (
                    <button
                      key={order.id}
                      onClick={() => navigate('/track')}
                      className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left ${idx < Math.min(orders.length, 3) - 1 ? 'border-b border-slate-50' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{order.id}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-red-600">₹{order.total}</span>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                          order.status === 'delivered'   ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'in_progress' ? 'bg-orange-100 text-orange-700'  :
                          'bg-blue-100 text-blue-700'
                        }`}>{order.status.replace(/_/g, ' ')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Quick actions */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => action.path && navigate(action.path)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-start gap-3 hover:shadow-md active:scale-[0.97] transition-all text-left"
                >
                  <div className={`w-11 h-11 rounded-xl ${action.bg} flex items-center justify-center`}>
                    <action.Icon size={21} className={action.text} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
