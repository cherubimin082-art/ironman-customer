import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F0F0F5' }}>
      <Navbar />
      <main
        className="lg:ml-[240px]"
        style={{ minHeight: '100vh' }}
      >
        {/* Mobile: top padding so content clears the hamburger button */}
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
