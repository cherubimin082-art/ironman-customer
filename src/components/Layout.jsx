import { useEffect, useState } from 'react';
import Navbar from './Navbar';

const SIDEBAR_W = 240;

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

export default function Layout({ children }) {
  const isDesktop = useIsDesktop();

  return (
    <div style={{ minHeight: '100vh', background: '#F0F0F5' }}>
      <Navbar />
      <main style={{
        minHeight: '100vh',
        marginLeft: isDesktop ? SIDEBAR_W : 0,
      }}>
        {/* Mobile: pad bottom so content clears the fixed bottom nav bar */}
        {!isDesktop && (
          <div style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))' }}>{children}</div>
        )}
        {isDesktop && children}
      </main>
    </div>
  );
}
