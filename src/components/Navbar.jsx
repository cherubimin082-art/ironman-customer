import { NavLink } from 'react-router-dom';

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? '#B91C1C' : 'none'} stroke={active ? '#B91C1C' : '#9CA3AF'} strokeWidth="1.8" width="23" height="23">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20.25a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75V15h-6v5.25a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V10.5z" />
    </svg>
  );
}

function OrdersIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? '#B91C1C' : 'none'} stroke={active ? '#B91C1C' : '#9CA3AF'} strokeWidth="1.8" width="23" height="23">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" />
    </svg>
  );
}

function AccountIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? '#B91C1C' : 'none'} stroke={active ? '#B91C1C' : '#9CA3AF'} strokeWidth="1.8" width="23" height="23">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

const TABS = [
  { to: '/home',    label: 'HOME',    Icon: HomeIcon    },
  { to: '/orders',  label: 'ORDERS',  Icon: OrdersIcon  },
  { to: '/profile', label: 'ACCOUNT', Icon: AccountIcon },
];

export default function Navbar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-3 h-[3.75rem]">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className="flex flex-col items-center justify-center gap-0.5 select-none">
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span
                  className="text-[9px] font-bold tracking-widest leading-none mt-0.5"
                  style={{ color: isActive ? '#B91C1C' : '#9CA3AF' }}
                >
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
