import api from './api';

export const sendOtp = async (phone) => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length !== 10) throw new Error('Enter a valid 10-digit mobile number');
  return { success: true };
};

export const verifyOtp = async (phone, otp) => {
  const clean = phone.replace(/\D/g, '');
  try {
    const { data } = await api.post('/login', { phone: clean, otp });
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      await api.post('/register', { name: 'Customer', phone: clean });
      const { data } = await api.post('/login', { phone: clean, otp });
      return data;
    }
    throw err;
  }
};
