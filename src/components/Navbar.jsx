import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_W = 240;

const NAV = [
  {
    to: '/home',
    label: 'Home',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'rgba(255,255,255,0.45)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <path d="M3 10.5L12 3l9 7.5V20.25a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75V15h-6v5.25a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V10.5z" />
      </svg>
    ),
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.45)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Account',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'rgba(255,255,255,0.45)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
        <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function SideContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{
      width: SIDEBAR_W,
      height: '100%',
      background: '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '4px 8px', display: 'inline-flex', flexShrink: 0 }}>
            <img src="/logo1.png" alt="Iron Man" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'white', margin: 0 }}>Iron Man</p>
            <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', margin: 0, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Iron Service</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '14px 10px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 10px', margin: '0 0 8px' }}>MENU</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 10px', borderRadius: 10,
                  background: isActive ? '#B91C1C' : 'transparent',
                  cursor: 'pointer',
                }}>
                  {icon(isActive)}
                  <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? 'white' : 'rgba(255,255,255,0.55)' }}>
                    {label}
                  </span>
                  {isActive && (
                    <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#B91C1C',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{initials(user?.name)}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Customer'}
            </p>
            <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{user?.phone}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '10px 12px',
            borderRadius: 10, border: '1px solid rgba(185,28,28,0.3)',
            background: 'rgba(185,28,28,0.1)',
            color: '#FCA5A5', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

// ── Mobile bottom tab bar ──────────────────────────────────────────────
function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
      background: '#0F172A',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.2)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {NAV.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} style={{ textDecoration: 'none', flex: 1 }}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '10px 0 8px',
            }}>
              {icon(isActive)}
              <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 600, color: isActive ? 'white' : 'rgba(255,255,255,0.45)' }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        boxShadow: '2px 0 16px rgba(0,0,0,0.15)',
      }}>
        <SideContent />
      </div>
    );
  }

  return <BottomNav />;
}
