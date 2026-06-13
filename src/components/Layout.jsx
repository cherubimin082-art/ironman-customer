import { NavLink, useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { HomeIcon, BagIcon, MapPinIcon, UserIcon, LogOutIcon, SteamIronLogo } from './Icons';
import Navbar from './Navbar';

const NAV_ITEMS = [
  { path: '/home',    label: 'Home',    Icon: HomeIcon   },
  { path: '/order',   label: 'Order',   Icon: BagIcon    },
  { path: '/track',   label: 'Track',   Icon: MapPinIcon },
  { path: '/profile', label: 'Profile', Icon: UserIcon   },
];

export default function Layout({ children }) {
  const { cartCount } = useOrder();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-40">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <SteamIronLogo size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm tracking-tight">Smart Iron</p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5 truncate">Ironing at your doorstep</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ path, label, Icon }) => (
              <NavLink key={path} to={path}>
                {({ isActive }) => (
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                    <Icon
                      size={18}
                      className={isActive ? 'text-indigo-600 shrink-0' : 'text-slate-500 shrink-0'}
                    />
                    <span className={`text-sm flex-1 ${isActive ? 'font-semibold text-indigo-700' : 'font-medium'}`}>
                      {label}
                    </span>
                    {label === 'Order' && cartCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {cartCount}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-indigo-700 text-sm font-bold">{firstName[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOutIcon size={16} className="shrink-0" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="lg:pl-64 min-h-screen">
        {children}
      </main>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <div className="lg:hidden">
        <Navbar />
      </div>
    </div>
  );
}
