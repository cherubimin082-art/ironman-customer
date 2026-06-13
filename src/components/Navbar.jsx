import { NavLink } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { HomeIcon, BagIcon, MapPinIcon, UserIcon } from './Icons';

const TABS = [
  { to: '/home',    label: 'Home',    Icon: HomeIcon    },
  { to: '/order',   label: 'Order',   Icon: BagIcon,   badge: true },
  { to: '/track',   label: 'Track',   Icon: MapPinIcon  },
  { to: '/profile', label: 'Profile', Icon: UserIcon    },
];

export default function Navbar() {
  const { cartCount } = useOrder();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-100 shadow-[0_-1px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 h-[3.75rem]">
        {TABS.map(({ to, label, Icon, badge }) => (
          <NavLink key={to} to={to} className="flex flex-col items-center justify-center gap-0.5">
            {({ isActive }) => (
              <>
                <span className="relative flex items-center justify-center w-[2.625rem] h-[2.625rem] rounded-2xl transition-all duration-200
                  active:scale-90"
                  style={{ background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                  <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  {badge && cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-semibold tracking-wide leading-none ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
