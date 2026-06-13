import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import VerifyOtp from './pages/VerifyOtp';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage';
import TrackPage from './pages/TrackPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup"     element={<SignUp />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/home"    element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/order"   element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
      <Route path="/track"   element={<ProtectedRoute><TrackPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <AppRoutes />
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
