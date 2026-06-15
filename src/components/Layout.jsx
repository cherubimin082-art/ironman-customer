import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#F0F0F5' }}>
      <main style={{ paddingBottom: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </main>
      <Navbar />
    </div>
  );
}
