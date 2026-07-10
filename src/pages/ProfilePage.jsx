import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import api from '../services/api';

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

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const MENU_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    ),
    label: 'My Orders', sub: 'View all past & active orders',
    bg: '#FEE2E2', color: '#B91C1C', action: '/orders',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
      </svg>
    ),
    label: 'Manage Address', sub: 'Update your pickup location',
    bg: '#FEF3C7', color: '#D97706', section: 'address',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    label: 'Payment Methods', sub: 'Cards, UPI, Wallets',
    bg: '#DBEAFE', color: '#2563EB', section: 'payment',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8 19.79 19.79 0 0110 2.18 2 2 0 0114 3.87c.15.6.35 1.19.59 1.76a2 2 0 01-.45 2.11L13 8.91a16 16 0 006.08 6.08l1.17-1.17a2 2 0 012.11-.45c.57.24 1.16.44 1.76.59a2 2 0 011.88 2.04z"/>
      </svg>
    ),
    label: 'Help & Support', sub: 'Call or email us',
    bg: '#D1FAE5', color: '#059669', section: 'help',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    label: 'About Iron Man', sub: 'Version & app info',
    bg: '#EDE9FE', color: '#7C3AED', section: 'about',
  },
];

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const { apartments, orders } = useOrder();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [memberSince, setMemberSince] = useState('');
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({ name: '', address: '', apartment: '' });
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const [saveErr, setSaveErr]         = useState('');
  const [section, setSection]         = useState(null);

  useEffect(() => {
    api.get('/customer/profile')
      .then(({ data }) => { if (data.user?.created_at) setMemberSince(fmtDate(data.user.created_at)); })
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleEdit = () => {
    setForm({ name: user?.name || '', address: user?.address || '', apartment: user?.apartment || '' });
    setSaveMsg(''); setSaveErr(''); setEditing(true); setSection(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveErr('Name is required'); return; }
    if (!form.apartment)   { setSaveErr('Please select your apartment'); return; }
    setSaveErr(''); setSaving(true);
    try {
      await updateProfile(form.name, form.address, form.apartment);
      setEditing(false); setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 3500);
    } catch (err) {
      setSaveErr(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const totalOrders  = orders.length;

  const inputStyle = {
    width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '11px 14px',
    fontSize: 14, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 };

  /* ── section bottom sheet ── */
  const SectionSheet = () => !section ? null : (
    <div onClick={() => setSection(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '22px 22px 0 0', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '0 0 40px' }}>
        <div style={{ width: 36, height: 4, background: '#E2E8F0', borderRadius: 99, margin: '14px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 4px' }}>
          <p style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>
            {section === 'payment' ? 'Payment Methods' : section === 'help' ? 'Help & Support' : 'About Iron Man'}
          </p>
          <button onClick={() => setSection(null)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {section === 'payment' && (
          <div style={{ padding: '12px 20px 0' }}>
            <div style={{ background: '#0F172A', borderRadius: 18, padding: '20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 26, borderRadius: 6, background: '#3395FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Razorpay</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Cards · UPI · Net Banking · Wallets</p>
            </div>
            {['Credit / Debit Card', 'UPI (GPay, PhonePe, Paytm)', 'Net Banking', 'Wallets'].map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3395FF', flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: '#0F172A', fontWeight: 600 }}>{m}</span>
              </div>
            ))}
            <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '16px 0 0', textAlign: 'center' }}>Payments processed securely via Razorpay</p>
          </div>
        )}

        {section === 'help' && (
          <div style={{ padding: '12px 20px 0' }}>
            <a href="tel:+918031339999" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '16px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8 19.79 19.79 0 011 2.18 2 2 0 013 0h3a2 2 0 012 1.72c.13.98.36 1.94.67 2.87a2 2 0 01-.45 2.11L7 8.91a16 16 0 006.08 6.08l2.21-2.21a2 2 0 012.11-.45c.93.31 1.89.54 2.87.67A2 2 0 0122 16.92z"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#065F46', margin: '0 0 2px' }}>Call Support</p>
                  <p style={{ fontSize: 12, color: '#16A34A', margin: 0 }}>+91 80313 39999 · Tap to call</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginLeft: 'auto', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </a>
            <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '16px 18px', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Email</p>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: '#3395FF', margin: 0 }}>support@ironman.today</p>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Support Hours</p>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>Mon – Sat · 8 AM – 8 PM</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Typically reply within 2 hours</p>
            </div>
          </div>
        )}

        {section === 'about' && (
          <div style={{ padding: '12px 20px 0' }}>
            <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg viewBox="0 0 24 24" fill="#B91C1C" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>IRON MAN</p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 10px' }}>Hyperlocal Ironing Service</p>
              <span style={{ fontSize: 10, fontWeight: 700, background: '#FEE2E2', color: '#B91C1C', padding: '4px 12px', borderRadius: 99, letterSpacing: '0.06em' }}>VERSION 1.0</span>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.7, textAlign: 'center' }}>
                Professional ironing at your doorstep. Book a pickup, we collect, iron and deliver — fresh clothes every time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Profile card (left on desktop) ── */
  const ProfileCard = () => (
    <div style={{ background: 'white', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 16 }}>
      {/* Gradient header */}
      <div style={{ background: 'linear-gradient(135deg,#7F1D1D,#B91C1C)', padding: '28px 20px 52px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -10, left: 30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        {/* Edit btn */}
        <button onClick={handleEdit} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {/* Avatar (overlap) */}
      <div style={{ position: 'relative', padding: '0 20px 20px', marginTop: -36 }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', marginBottom: 12 }}>
          <span style={{ color: 'white', fontSize: 26, fontWeight: 900 }}>{initials}</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 3px' }}>{user?.name || '—'}</p>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 10px', fontWeight: 500 }}>{user?.phone}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, background: '#FEE2E2', color: '#B91C1C', padding: '4px 10px', borderRadius: 99, letterSpacing: '0.06em' }}>ELITE MEMBER</span>
          {memberSince && <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>Since {memberSince}</span>}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderTop: '1px solid #F8FAFC' }}>
        <div style={{ padding: '14px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '0 0 2px' }}>{totalOrders}</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Total Orders</p>
        </div>
        <div style={{ padding: '14px 0', textAlign: 'center', borderLeft: '1px solid #F8FAFC' }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: activeOrders > 0 ? '#B91C1C' : '#0F172A', margin: '0 0 2px' }}>{activeOrders}</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Active</p>
        </div>
      </div>
    </div>
  );

  /* ── Address card ── */
  const AddressCard = () => (
    <div style={{ background: 'white', borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="#B91C1C" width="18" height="18"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 3px' }}>Primary Address</p>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 3px' }}>{user?.apartment || 'Not set'}</p>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{user?.address || 'No address added yet'}</p>
        </div>
        <button onClick={handleEdit} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
    </div>
  );

  /* ── Edit form ── */
  const EditForm = () => !editing ? null : (
    <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px solid #FEE2E2' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Edit Profile</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(false)} style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 12, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: '#B91C1C', fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
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
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>
      {saveErr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '10px 14px', marginTop: 14 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ fontSize: 12, color: '#E11D48', margin: 0 }}>{saveErr}</p>
        </div>
      )}
    </div>
  );

  /* ── Menu list ── */
  const MenuList = () => (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: 12 }}>
      {MENU_ITEMS.map((item, idx) => (
        <button
          key={item.label}
          onClick={() => {
            if (item.action) navigate(item.action);
            else if (item.section === 'address') handleEdit();
            else setSection(item.section);
          }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px', background: 'white', border: 'none',
            borderBottom: idx < MENU_ITEMS.length - 1 ? '1px solid #F8FAFC' : 'none',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 13, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.color }}>
            {item.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 1px' }}>{item.label}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontWeight: 500 }}>{item.sub}</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C8D0DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F8' }}>

      {/* Top bar (mobile only) */}
      {!isDesktop && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'max(1rem,env(safe-area-inset-top,1rem)) 20px 14px', background: 'white', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg viewBox="0 0 24 24" fill="#B91C1C" width="13" height="13"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
            <span style={{ color: '#B91C1C', fontSize: 18, fontWeight: 900 }}>IRON MAN</span>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{initials}</span>
          </div>
        </div>
      )}

      {/* Success toast */}
      {saveMsg && (
        <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 14, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: 0 }}>{saveMsg}</p>
        </div>
      )}

      {/* ── DESKTOP ── */}
      {isDesktop ? (
        <div style={{ padding: '32px 40px 40px' }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>My Account</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0 }}>Profile</h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
            {/* Left */}
            <div>
              <ProfileCard />
              <AddressCard />
              {/* Dark payment card */}
              <div style={{ background: '#0F172A', borderRadius: 20, padding: '18px 20px', boxShadow: '0 4px 16px rgba(15,23,42,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 26, borderRadius: 6, background: '#3395FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>Razorpay</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px' }}>Cards · UPI · Net Banking · Wallets</p>
                <button onClick={() => setSection('payment')} style={{ fontSize: 11, fontWeight: 800, color: '#3395FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  VIEW DETAILS <svg viewBox="0 0 24 24" fill="none" stroke="#3395FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
            {/* Right */}
            <div>
              <EditForm />
              <MenuList />
              <button onClick={handleLogout} style={{ width: '100%', padding: '15px', borderRadius: 16, background: '#FFF1F2', border: '1.5px solid #FECDD3', color: '#B91C1C', fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer', marginBottom: 12 }}>
                LOGOUT ACCOUNT
              </button>
              <p style={{ textAlign: 'center', fontSize: 10.5, color: '#CBD5E1', fontWeight: 600, letterSpacing: '0.1em' }}>VERSION 1.0-IRONMAN</p>
            </div>
          </div>
        </div>
      ) : (
        /* ── MOBILE ── */
        <div style={{ padding: '16px 16px 32px' }}>
          <ProfileCard />
          <EditForm />
          {!editing && <AddressCard />}

          {/* Dark payment card */}
          {!editing && (
            <div style={{ background: '#0F172A', borderRadius: 20, padding: '18px 20px', marginBottom: 16, boxShadow: '0 4px 16px rgba(15,23,42,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 26, borderRadius: 6, background: '#3395FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>Razorpay</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Payment</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px' }}>Cards · UPI · Net Banking · Wallets</p>
              <button onClick={() => setSection('payment')} style={{ fontSize: 11, fontWeight: 800, color: '#3395FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                VIEW DETAILS <svg viewBox="0 0 24 24" fill="none" stroke="#3395FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}

          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px 2px' }}>Account Settings</p>
          <MenuList />

          <button onClick={handleLogout} style={{ width: '100%', padding: '15px', borderRadius: 16, background: '#FFF1F2', border: '1.5px solid #FECDD3', color: '#B91C1C', fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer', marginBottom: 12 }}>
            LOGOUT ACCOUNT
          </button>
          <p style={{ textAlign: 'center', fontSize: 10.5, color: '#CBD5E1', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 4 }}>VERSION 1.0-IRONMAN</p>
        </div>
      )}

      <SectionSheet />
    </div>
  );
}
