import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('si_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // New user flow: POST /auth/signup
  // Returns { otp } for demo display. Throws if mobile already exists.
  const signup = async (name, address, apartment, mobileNumber) => {
    const { data } = await api.post('/auth/signup', {
      name,
      address,
      apartment,
      mobile_number: mobileNumber,
    });
    return data;
  };

  // Existing user flow: POST /auth/login
  // Returns { otp } for demo display. Throws if mobile not found.
  const requestLoginOtp = async (mobileNumber) => {
    const { data } = await api.post('/auth/login', {
      mobile_number: mobileNumber,
    });
    return data;
  };

  // Shared verify step: POST /auth/verify-otp
  // On success saves token + user to localStorage and updates state.
  const login = async (mobileNumber, otp) => {
    const { data } = await api.post('/auth/verify-otp', {
      mobile_number: mobileNumber,
      otp,
    });
    localStorage.setItem('si_token', data.token);
    localStorage.setItem('si_user', JSON.stringify(data.user));
    setUser(data.user);
    return true;
  };

  const updateProfile = async (name, address, apartment) => {
    const { data } = await api.put('/customer/profile', { name, address, apartment });
    const updated = { ...user, name: data.user.name, address: data.user.address, apartment: data.user.apartment };
    localStorage.setItem('si_user', JSON.stringify(updated));
    setUser(updated);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('si_token');
    localStorage.removeItem('si_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, requestLoginOtp, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
