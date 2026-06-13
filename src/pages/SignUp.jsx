import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SteamIronLogo } from '../components/Icons';

export const APARTMENTS = [
  'Green Valley Apartments',
  'Sunrise Residency',
  'Lake View Towers',
  'Palm Grove Apartments',
  'Maple Heights',
];

export default function SignUp() {
  const [form, setForm] = useState({ name: '', address: '', apartment: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const { signup } = useAuth();
  const navigate   = useNavigate();

  const set = (key) => (e) => {
    const val = key === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.name.trim())       { setError('Please enter your name'); return; }
    if (!form.address.trim())    { setError('Please enter your pickup address'); return; }
    if (!form.apartment)         { setError('Please select your apartment'); return; }
    if (form.phone.length < 10)  { setError('Enter a valid 10-digit mobile number'); return; }

    setLoading(true); setError('');
    try {
      const data = await signup(form.name, form.address, form.apartment, form.phone);
      navigate('/verify-otp', { state: { mobile: form.phone, demoOtp: data.otp, flow: 'signup' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white';
  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-[0_6px_18px_rgba(99,102,241,0.35)]">
            <SteamIronLogo size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Get professional ironing at your doorstep</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-7">

          {/* Full Name */}
          <div className="mb-4">
            <label className={labelClass}>Full Name</label>
            <input
              type="text" maxLength={80} value={form.name}
              onChange={set('name')} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Ravi Kumar"
              className={inputClass}
            />
          </div>

          {/* Pickup Address */}
          <div className="mb-4">
            <label className={labelClass}>Flat / Door No.</label>
            <input
              type="text" maxLength={200} value={form.address}
              onChange={set('address')} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Flat 4B, Block C"
              className={inputClass}
            />
          </div>

          {/* Apartment Dropdown */}
          <div className="mb-4">
            <label className={labelClass}>Select Apartment</label>
            <div className="relative">
              <select
                value={form.apartment}
                onChange={set('apartment')}
                className={`${inputClass} appearance-none pr-10 ${!form.apartment ? 'text-slate-400' : 'text-slate-900'}`}
              >
                <option value="" disabled>Choose your apartment…</option>
                {APARTMENTS.map(apt => (
                  <option key={apt} value={apt}>{apt}</option>
                ))}
              </select>
              {/* chevron icon */}
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Mobile */}
          <div className="mb-5">
            <label className={labelClass}>Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center px-3.5 bg-slate-100 rounded-xl text-slate-600 text-sm font-medium border border-slate-200 shrink-0">
                +91
              </div>
              <input
                type="tel" maxLength={10} value={form.phone}
                onChange={set('phone')} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="98765 43210"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-rose-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.35)]"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</span>
              : 'Sign Up & Get OTP'}
          </button>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/" className="text-indigo-600 font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
