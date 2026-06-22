import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import VerifyOtp from './pages/VerifyOtp';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage';
import OrdersListPage from './pages/OrdersListPage';
import TrackPage from './pages/TrackPage';
import ProfilePage from './pages/ProfilePage';
import UpdateModal from './components/UpdateModal';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const APP_BUILD = parseInt(import.meta.env.VITE_APP_BUILD || '0', 10);
const API_BASE  = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const APK_URL   = 'https://dev.ironman.today/downloads/ironman-customer.apk';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/home" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup"     element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="/verify-otp" element={<GuestRoute><VerifyOtp /></GuestRoute>} />
      <Route path="/home"    element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/order"   element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
      <Route path="/orders"  element={<ProtectedRoute><OrdersListPage /></ProtectedRoute>} />
      <Route path="/track"   element={<ProtectedRoute><TrackPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Patch window.open so Razorpay net-banking popups open in Chrome Custom Tab
    // instead of being silently blocked by the Android WebView.
    const _orig = window.open;
    window.open = (url) => {
      if (url) Browser.open({ url }).catch(() => {});
      return null;
    };

    // Version check — show update prompt when a newer APK is published
    if (APP_BUILD !== 0) {
      fetch(`${API_BASE}/version`)
        .then(r => r.json())
        .then(({ version }) => { if (version > APP_BUILD) setUpdateAvailable(true); })
        .catch(() => {});
    }

    return () => { window.open = _orig; };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          {updateAvailable && (
            <UpdateModal onUpdate={() => Browser.open({ url: APK_URL })} />
          )}
          <AppRoutes />
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
