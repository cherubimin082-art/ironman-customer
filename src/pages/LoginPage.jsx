import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { label: 'Same-day pickup & delivery',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg> },
  { label: 'Hyperlocal agents near you',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg> },
  { label: 'Trusted by 10,000+ households', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { label: 'Track every step in real time',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
];

function useIsDesktop() {
  const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)') : null;
  const [ok, setOk] = useState(mq ? mq.matches : false);
  useEffect(() => {
    if (!mq) return;
    const h = e => setOk(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return ok;
}

export default function LoginPage() {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef              = useRef(null);
  const isDesktop             = useIsDesktop();

  const { requestLoginOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  async function handleLogin() {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try {
      await requestLoginOtp(clean);
      navigate('/verify-otp', { state: { mobile: clean, flow: 'login' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  }

  const formCard = (
    <div style={{ width: '100%', maxWidth: 420 }}>
      {/* Mobile logo */}
      {!isDesktop && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '4px 10px', display: 'inline-flex' }}>
            <img src="/logo1.png" alt="Iron Man" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>
      )}

      {/* Heading */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: isDesktop ? 30 : 26, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>Welcome back</h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0, fontWeight: 500 }}>Enter your mobile number to receive an OTP</p>
      </div>

      {/* Phone input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Mobile Number
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* +91 prefix */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#F1F5F9', border: '1.5px solid #E2E8F0', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#475569', flexShrink: 0 }}>
            +91
          </div>
          {/* Number field */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = '#B91C1C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(185,28,28,0.08)'; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <input
              ref={inputRef}
              type="tel"
              maxLength={10}
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="98765 43210"
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: '14px 14px', fontSize: 15, color: '#0F172A', fontFamily: 'inherit', boxSizing: 'border-box', letterSpacing: '0.03em' }}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{error}</span>
        </div>
      )}

      {/* Send OTP button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: '100%', padding: '15px 24px',
          background: loading ? 'rgba(185,28,28,0.65)' : 'linear-gradient(135deg, #B91C1C, #DC2626)',
          border: 'none', borderRadius: 14, color: 'white', fontSize: 15, fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 6px 24px rgba(185,28,28,0.3)',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg style={{ animation: 'spin 0.8s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Sending OTP…
          </>
        ) : (
          <>
            Send OTP via WhatsApp
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </>
        )}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.06em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
      </div>

      {/* Sign up */}
      <Link to="/signup" style={{ display: 'block', textAlign: 'center', padding: '14px 24px', border: '1.5px solid #FECACA', borderRadius: 14, color: '#B91C1C', fontSize: 14, fontWeight: 700, textDecoration: 'none', background: '#FEF2F2', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#B91C1C'; e.currentTarget.style.background = '#FEE2E2'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.background = '#FEF2F2'; }}
      >
        New user? Create an account
      </Link>

      {/* Terms */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#CBD5E1', fontWeight: 500, margin: '20px 0 0', lineHeight: 1.6 }}>
        By continuing, you agree to our{' '}
        <span style={{ color: '#B91C1C', cursor: 'pointer', fontWeight: 600 }}>Terms</span>
        {' '}&amp;{' '}
        <span style={{ color: '#B91C1C', cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</span>
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: isDesktop ? 'row' : 'column', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Left branding panel */}
      <div style={{
        width: isDesktop ? 460 : '100%',
        flexShrink: 0,
        background: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isDesktop ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isDesktop ? '52px 52px' : '40px 24px 48px',
      }}>
        {/* Glow accents */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,28,28,0.22) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,28,28,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: isDesktop ? 'flex-start' : 'center', gap: isDesktop ? 40 : 24, maxWidth: 420, width: '100%' }}>

          {/* Logo */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: isDesktop ? '10px 18px' : '8px 14px', display: 'inline-flex' }}>
            <img src="/logo1.png" alt="Iron Man" style={{ height: isDesktop ? 72 : 52, width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Hero text */}
          <div style={{ textAlign: isDesktop ? 'left' : 'center' }}>
            <h1 style={{ fontSize: isDesktop ? 38 : 28, fontWeight: 900, lineHeight: 1.2, color: 'white', margin: '0 0 12px' }}>
              Professional ironing,{' '}
              <span style={{ background: 'linear-gradient(90deg, #F87171, #FCA5A5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                delivered fast.
              </span>
            </h1>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Schedule a pickup, track your order, and get fresh clothes — all from your phone.
            </p>
          </div>

          {/* Features — desktop only */}
          {isDesktop && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(185,28,28,0.2)', border: '1px solid rgba(185,28,28,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#FCA5A5' }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: isDesktop ? 'flex-start' : 'center' }}>
            <div style={{ display: 'flex' }}>
              {['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'].map((c, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: '2px solid #0F172A', marginLeft: i === 0 ? 0 : -7, zIndex: 4 - i, position: 'relative' }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Trusted by 10,000+ households</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isDesktop ? '48px 24px' : '32px 20px 48px', background: '#F8FAFC', overflowY: 'auto' }}>
        {formCard}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
