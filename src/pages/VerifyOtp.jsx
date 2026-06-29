import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const { login } = useAuth();

  const mobile     = state?.mobile     || '';
  const flow       = state?.flow       || 'login';
  const signupForm = state?.signupForm || null;

  const [digits, setDigits]     = useState(['', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const timerRef  = useRef(null);

  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  useEffect(() => {
    if (!mobile) navigate('/', { replace: true });
  }, [mobile, navigate]);

  // countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true); setError('');
    try {
      if (flow === 'signup' && signupForm) {
        await api.post('/auth/signup', {
          name: signupForm.name,
          address: signupForm.address,
          apartment: signupForm.apartment,
          mobile_number: mobile,
        });
      } else {
        await api.post('/auth/login', { mobile_number: mobile });
      }
      setDigits(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleDigit = (idx, val) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError('');
    if (d && idx < 3) inputRefs[idx + 1].current?.focus();
    if (next.every(x => x) && idx === 3) submitOtp(next.join(''));
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0)
      inputRefs[idx - 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(''));
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
          <img src="/logo1.png" alt="Iron Man" className="h-16 w-auto object-contain mb-3" style={{ mixBlendMode: 'multiply', filter: 'brightness(1.1)' }} />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify OTP</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Enter the 4-digit code sent to your WhatsApp{' '}
            <span className="font-semibold text-slate-700">{maskedPhone}</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-7">

          {/* WhatsApp info banner */}
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-green-700 text-xs font-semibold uppercase tracking-wide">WhatsApp OTP</p>
              <p className="text-green-800 text-sm font-medium mt-0.5">Check your WhatsApp for the code</p>
            </div>
          </div>

          {/* OTP digit inputs */}
          <div className="flex justify-center gap-2 mb-5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="tel"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-11 h-12 text-center text-xl font-bold rounded-2xl border-2 transition-all outline-none
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

          {/* Resend OTP */}
          <div className="flex items-center justify-center mt-5 gap-1 text-sm">
            <span className="text-slate-500">Didn't receive it?</span>
            {countdown > 0 ? (
              <span className="text-slate-400 font-medium">Resend in {countdown}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-red-600 font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
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
