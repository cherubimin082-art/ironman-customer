import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { APARTMENTS } from './SignUp';
import api from '../services/api';
import {
  BellIcon, ShieldIcon, HelpCircleIcon,
  StarIcon, LogOutIcon, ChevronRightIcon, CalendarIcon,
} from '../components/Icons';

const STATUS_PILL = {
  delivered:   'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-orange-100 text-orange-700',
  scheduled:   'bg-amber-100 text-amber-700',
};

const MENU_ITEMS = [
  { icon: BellIcon,       label: 'Notifications',      desc: 'Manage push alerts'    },
  { icon: ShieldIcon,     label: 'Privacy & Security', desc: 'Account protection'    },
  { icon: HelpCircleIcon, label: 'Help & Support',     desc: 'Chat with our team'    },
  { icon: StarIcon,       label: 'Rate the App',       desc: 'Share your experience' },
];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const { orders } = useOrder();
  const navigate = useNavigate();

  const [memberSince, setMemberSince] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: '', address: '', apartment: '' });
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  useEffect(() => {
    api.get('/customer/profile')
      .then(({ data }) => {
        if (data.user?.created_at) setMemberSince(fmtDate(data.user.created_at));
      })
      .catch(console.error);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleEdit = () => {
    setForm({
      name:      user?.name      || '',
      address:   user?.address   || '',
      apartment: user?.apartment || '',
    });
    setSaveMsg('');
    setSaveErr('');
    setEditing(true);
  };

  const handleCancel = () => { setEditing(false); setSaveErr(''); };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveErr('Name is required'); return; }
    if (!form.apartment)   { setSaveErr('Please select your apartment'); return; }
    setSaveErr('');
    setSaving(true);
    try {
      await updateProfile(form.name, form.address, form.apartment);
      setEditing(false);
      setSaveMsg('Profile updated successfully');
      setTimeout(() => setSaveMsg(''), 3500);
    } catch (err) {
      setSaveErr(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const totalSpent      = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const firstName       = user?.name?.split(' ')[0] ?? '';

  const inputCls  = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';
  const labelCls  = 'block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5';
  const sectionCls = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider';

  return (
    <div className="min-h-screen pb-28 lg:pb-8">

      {/* ── Gradient header ── */}
      <div
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-5 pb-8 lg:pt-8 lg:pb-8 lg:rounded-none rounded-b-[32px]"
        style={{ paddingTop: 'max(3rem, env(safe-area-inset-top, 3rem))' }}
      >
        <div className="max-w-7xl mx-auto lg:px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-white">{firstName[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-white text-lg lg:text-xl leading-tight truncate">{user?.name}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{user?.phone}</p>
            </div>
            {/* Desktop stats */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {[
                { label: 'Total Orders', value: orders.length           },
                { label: 'Completed',    value: completedOrders.length  },
                { label: 'Total Spent',  value: `₹${totalSpent}`        },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[80px]">
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile stats */}
          <div className="grid grid-cols-3 gap-2 mt-5 lg:hidden">
            {[
              { label: 'Orders',    value: orders.length           },
              { label: 'Completed', value: completedOrders.length  },
              { label: 'Spent',     value: `₹${totalSpent}`        },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-white leading-tight">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-10 lg:items-start">

          {/* ── Left column ── */}
          <div className="space-y-3">

            {/* Account Details card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              {/* Card header row */}
              <div className="flex items-center justify-between mb-4">
                <p className={sectionCls}>Account Details</p>
                {!editing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {/* Pencil icon */}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {saving && (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">

                {/* Name */}
                <div>
                  <label className={labelCls}>Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={inputCls}
                      placeholder="Your full name"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-800">{user?.name || '—'}</p>
                  )}
                </div>

                {/* Mobile — always read-only */}
                <div>
                  <label className={labelCls}>Mobile Number</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{user?.phone}</p>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md leading-5">
                      cannot change
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={labelCls}>Address</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      className={inputCls}
                      placeholder="Your address"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{user?.address || '—'}</p>
                  )}
                </div>

                {/* Apartment */}
                <div>
                  <label className={labelCls}>Apartment</label>
                  {editing ? (
                    <div className="relative">
                      <select
                        value={form.apartment}
                        onChange={e => setForm(f => ({ ...f, apartment: e.target.value }))}
                        className={`${inputCls} appearance-none pr-9 ${!form.apartment ? 'text-slate-400' : 'text-slate-800'}`}
                      >
                        <option value="" disabled>Choose apartment…</option>
                        {APARTMENTS.map(apt => (
                          <option key={apt} value={apt}>{apt}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">{user?.apartment || '—'}</p>
                  )}
                </div>

                {/* Member Since — always read-only */}
                <div>
                  <label className={labelCls}>Member Since</label>
                  <p className="text-sm font-medium text-slate-800">{memberSince || '—'}</p>
                </div>

              </div>

              {/* Inline error */}
              {saveErr && (
                <div className="mt-4 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-xs text-rose-600">{saveErr}</p>
                </div>
              )}
            </div>

            {/* Success toast */}
            {saveMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p className="text-xs font-semibold text-emerald-700">{saveMsg}</p>
              </div>
            )}

            {/* Settings menu */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {MENU_ITEMS.map((item, idx) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left ${
                    idx < MENU_ITEMS.length - 1 ? 'border-b border-slate-50' : ''
                  }`}
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={16} className="text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <ChevronRightIcon size={15} className="text-slate-300 shrink-0" />
                </button>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 border border-rose-200 text-rose-500 hover:bg-rose-50 active:scale-[0.99] font-semibold py-4 rounded-2xl transition-all"
            >
              <LogOutIcon size={16} />
              Sign Out
            </button>
          </div>

          {/* ── Right column: order history ── */}
          <div className="mt-3 lg:mt-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 lg:p-5">
              <p className={`${sectionCls} mb-3`}>Order History</p>
              {orders.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => navigate('/track')}
                      className="w-full flex justify-between items-center py-3 px-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                          <CalendarIcon size={15} className="text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {order.order_code || `#${order.id}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {order.pickup_date || order.date}
                            {(order.time_slot || order.slot) ? ` · ${order.time_slot || order.slot}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                        <p className="text-sm font-bold text-indigo-600">₹{order.total}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          STATUS_PILL[order.status] ?? 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
