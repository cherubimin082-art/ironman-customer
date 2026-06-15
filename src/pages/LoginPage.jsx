import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SteamIronLogo, CheckIcon } from '../components/Icons';

const FEATURES = [
  { text: 'Same-day pickup & delivery'    },
  { text: 'Hyperlocal agents near you'    },
  { text: 'Trusted by 10,000+ households' },
  { text: 'Track every step in real time' },
];

export default function LoginPage() {
  const [phone, setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const { requestLoginOtp } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try {
      const data = await requestLoginOtp(clean);
      navigate('/verify-otp', { state: { mobile: clean, demoOtp: data.otp, flow: 'login' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        Mobile Number
      </label>
      <div className="flex gap-2 mb-2">
        <div className="flex items-center px-3.5 bg-slate-100 rounded-xl text-slate-600 text-sm font-medium border border-slate-200 shrink-0">
          +91
        </div>
        <input
          type="tel"
          maxLength={10}
          value={phone}
          onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="98765 43210"
          autoFocus
          className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
        />
      </div>

      {error && <p className="text-rose-500 text-xs mb-3">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all mt-2 shadow-[0_4px_12px_rgba(99,102,241,0.35)]"
      >
        {loading
          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending OTP…</span>
          : 'Login'}
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <Link
        to="/signup"
        className="block w-full text-center border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 font-semibold py-3.5 rounded-xl transition-all"
      >
        New User? Sign Up
      </Link>

      <p className="text-center text-[11px] text-slate-400 mt-5 leading-relaxed">
        By continuing, you agree to our{' '}
        <span className="text-red-500 font-medium cursor-pointer">Terms</span>
        {' '}&amp;{' '}
        <span className="text-red-500 font-medium cursor-pointer">Privacy Policy</span>
      </p>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Brand panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-900
                      px-6 pt-14 pb-16
                      lg:w-[460px] lg:shrink-0 lg:min-h-screen lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-0">
        <div className="flex flex-col items-center lg:hidden">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
            <SteamIronLogo size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Iron</h1>
          <p className="text-slate-400 text-sm mt-1">Professional ironing at your doorstep</p>
        </div>
        <div className="hidden lg:block">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
            <SteamIronLogo size={38} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight mb-3">Smart Iron</h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Professional ironing, delivered to your doorstep across Chennai.
          </p>
          <div className="space-y-4">
            {FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-red-500/30 border border-red-400/40 flex items-center justify-center shrink-0">
                  <CheckIcon size={10} className="text-red-300" />
                </div>
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-slate-500 text-xs">Trusted by households across Koramangala, Indiranagar &amp; HSR Layout</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 bg-slate-50 lg:bg-white lg:flex lg:items-center lg:justify-center">
        <div className="lg:hidden px-4 -mt-10 pb-10">
          <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your mobile number to receive an OTP</p>
            {formContent}
          </div>
        </div>
        <div className="hidden lg:block w-full max-w-md px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
          <p className="text-slate-500 mb-8">Enter your mobile number to receive a one-time code.</p>
          {formContent}
        </div>
      </div>

    </div>
  );
}
