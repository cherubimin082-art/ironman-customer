import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const { login } = useAuth();

  // If someone lands here without state (e.g., direct URL), send them back
  const mobile  = state?.mobile  || '';
  const demoOtp = state?.demoOtp || '';
  const flow    = state?.flow    || 'login';

  const [digits, setDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  useEffect(() => {
    if (!mobile) navigate('/', { replace: true });
  }, [mobile, navigate]);

  const handleDigit = (idx, val) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError('');
    if (d && idx < 3) inputRefs[idx + 1].current?.focus();
    if (next.every(x => x) && idx === 3) {
      submitOtp(next.join(''));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const next = pasted.split('');
      setDigits(next);
      inputRefs[3].current?.focus();
      submitOtp(pasted);
    }
  };

  const submitOtp = async (otp) => {
    setLoading(true); setError('');
    try {
      await login(mobile, otp);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect OTP. Please try again.');
      setDigits(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const otp = digits.join('');
    if (otp.length < 4) { setError('Enter all 4 digits'); return; }
    submitOtp(otp);
  };

  const maskedPhone = mobile ? `+91 ${mobile.slice(0, 2)}XXXXXXX${mobile.slice(-1)}` : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo1.png" alt="Iron Man" className="h-16 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify OTP</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Enter the 4-digit code sent to{' '}
            <span className="font-semibold text-slate-700">{maskedPhone}</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-7">

          {/* Demo OTP box */}
          {demoOtp && (
            <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Demo OTP</p>
                <p className="text-amber-900 text-xl font-bold tracking-widest mt-0.5">{demoOtp}</p>
              </div>
            </div>
          )}

          {/* OTP digit inputs */}
          <div className="flex justify-center gap-3 mb-5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="tel"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 transition-all outline-none
                  ${d ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-900'}
                  focus:border-red-500 focus:ring-2 focus:ring-red-100`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-rose-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || digits.some(d => !d)}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.35)]"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</span>
              : 'Verify & Continue'}
          </button>

          <p className="text-center text-sm text-slate-500 mt-5">
            <Link
              to={flow === 'signup' ? '/signup' : '/'}
              className="text-red-600 font-semibold hover:underline"
            >
              ← Go back
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
