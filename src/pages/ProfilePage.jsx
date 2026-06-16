import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import api from '../services/api';

const MENU_ITEMS = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" /></svg>,
    label: 'Manage Addresses',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
    label: 'Payment Methods',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    label: 'My Orders',
    action: '/orders',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8 19.79 19.79 0 0110 2.18C10.51 2 11.06 2 11.62 2A2 2 0 0114 3.87c.15.6.35 1.19.59 1.76a2 2 0 01-.45 2.11L13 8.91a16 16 0 006.08 6.08l1.17-1.17a2 2 0 012.11-.45c.57.24 1.16.44 1.76.59a2 2 0 011.88 2.04z" /></svg>,
    label: 'Help & Support',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    label: 'About Iron Man',
  },
];

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const { apartments } = useOrder();
  const navigate = useNavigate();

  const [memberSince, setMemberSince] = useState('');
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({ name: '', address: '', apartment: '' });
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const [saveErr, setSaveErr]         = useState('');

  useEffect(() => {
    api.get('/customer/profile')
      .then(({ data }) => { if (data.user?.created_at) setMemberSince(fmtDate(data.user.created_at)); })
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleEdit = () => {
    setForm({ name: user?.name || '', address: user?.address || '', apartment: user?.apartment || '' });
    setSaveMsg(''); setSaveErr(''); setEditing(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveErr('Name is required'); return; }
    if (!form.apartment)   { setSaveErr('Please select your apartment'); return; }
    setSaveErr(''); setSaving(true);
    try {
      await updateProfile(form.name, form.address, form.apartment);
      setEditing(false); setSaveMsg('Profile updated');
      setTimeout(() => setSaveMsg(''), 3500);
    } catch (err) {
      setSaveErr(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  const inputStyle = {
    width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '10px 14px',
    fontSize: 14, color: '#0F172A', background: 'white', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 };

  return (
    <div className="min-h-screen" style={{ background: '#F0F0F5' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))', paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="#B91C1C" width="13" height="13">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
          </svg>
          <span style={{ color: '#B91C1C', fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em' }}>IRON MAN</span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 99, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{initials}</span>
        </div>
      </div>

      <div className="px-4 pt-5">

        {/* ── Profile header ── */}
        <div className="flex items-center gap-4 mb-5">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 26, fontWeight: 900 }}>{initials}</span>
            </div>
            <button
              onClick={handleEdit}
              style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 24, height: 24, borderRadius: 8,
                background: '#B91C1C', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>{user?.name || '—'}</p>
            <p style={{ fontSize: 14, color: '#64748B', margin: '3px 0 6px' }}>{user?.phone}</p>
            <span style={{ fontSize: 10, fontWeight: 800, background: '#FEE2E2', color: '#B91C1C', padding: '3px 10px', borderRadius: 99, letterSpacing: '0.06em' }}>
              ELITE MEMBER
            </span>
          </div>
        </div>

        {/* Success toast */}
        {saveMsg && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-3" style={{ background: '#D1FAE5', border: '1px solid #6EE7B7' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#065F46', margin: 0 }}>{saveMsg}</p>
          </div>
        )}

        {/* ── Edit form (when editing) ── */}
        {editing && (
          <div className="bg-white rounded-2xl p-4 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0 }}>Edit Profile</p>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 12, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#B91C1C', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Your full name" />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputStyle} placeholder="Your address" />
              </div>
              <div>
                <label style={labelStyle}>Apartment</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.apartment} onChange={e => setForm(f => ({ ...f, apartment: e.target.value }))} style={{ ...inputStyle, appearance: 'none', paddingRight: 36, color: form.apartment ? '#0F172A' : '#94A3B8' }}>
                    <option value="" disabled>Choose apartment…</option>
                    {apartments.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                  <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" width="14" height="14"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
            </div>
            {saveErr && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mt-3" style={{ background: '#FFF1F2', border: '1px solid #FECDD3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p style={{ fontSize: 12, color: '#E11D48', margin: 0 }}>{saveErr}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Primary address card ── */}
        <div className="bg-white rounded-2xl p-5 mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="#B91C1C" width="18" height="18">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Primary Address</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 3px' }}>{user?.apartment || 'Not set'}</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{user?.address || 'No address added yet'}</p>
              </div>
            </div>
          </div>
          <button onClick={handleEdit} style={{ marginTop: 14, fontSize: 12, fontWeight: 800, color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            MANAGE
            <svg viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* ── Payment card (dark) ── */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: '#0F172A', boxShadow: '0 4px 16px rgba(15,23,42,0.25)' }}>
          <div className="flex items-start justify-between mb-5">
            <div style={{ width: 40, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Default Card</span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: '0 0 5px' }}>Cash on Delivery</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', letterSpacing: '0.1em' }}>● ● ● ● ● ● ● ● ● ● ● ●</p>
          <button style={{ fontSize: 11, fontWeight: 800, color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
            CHANGE METHOD
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* ── Account settings label ── */}
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px 2px' }}>
          Account Settings
        </p>

        {/* ── Settings list ── */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {MENU_ITEMS.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => item.action ? navigate(item.action) : undefined}
              className="w-full flex items-center gap-3 text-left transition-colors"
              style={{
                padding: '14px 16px',
                borderBottom: idx < MENU_ITEMS.length - 1 ? '1px solid #F4F4F8' : 'none',
                background: 'white', border: idx < MENU_ITEMS.length - 1 ? '0 0 1px 0 solid #F4F4F8' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F4F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#374151' }}>
                {item.icon}
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{item.label}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C8D0DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        {/* ── Profile info (read-only) ── */}
        {memberSince && !editing && (
          <div className="bg-white rounded-2xl px-4 py-3 mb-3 flex items-center justify-between" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Member since</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{memberSince}</span>
          </div>
        )}

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl py-4 font-bold mb-4"
          style={{ background: '#FEF2F2', border: 'none', color: '#B91C1C', fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer' }}
        >
          LOGOUT ACCOUNT
        </button>

        {/* ── Version ── */}
        <p style={{ textAlign: 'center', fontSize: 10.5, color: '#C8D0DC', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 12 }}>
          VERSION 1.0-IRONMAN
        </p>

      </div>
    </div>
  );
}
