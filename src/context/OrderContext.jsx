import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { fetchCatalogue, fetchTimeSlots } from '../services/orderService';
import { useAuth } from './AuthContext';

const OrderContext = createContext(null);
let socket = null;

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders]               = useState([]);
  const [cart, setCart]                   = useState([]);
  const [selectedSlot, setSelectedSlot]   = useState(null);
  const [garments, setGarments]           = useState([]);
  const [timeSlots, setTimeSlots]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [otpNotification, setOtpNotification]       = useState(null);
  const [liveLocation, setLiveLocation]             = useState(null);
  const [agentInfo, setAgentInfo]                   = useState(null);
  const [rejectedNotification, setRejectedNotif]    = useState(null); // { orderId, reason }

  useEffect(() => {
    fetchCatalogue().then(setGarments).catch(console.error);
    fetchTimeSlots().then(setTimeSlots).catch(console.error);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/my-orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('loadOrders error:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) { socket.disconnect(); socket = null; }
      setOrders([]);
      setOtpNotification(null);
      setLiveLocation(null);
      setAgentInfo(null);
      return;
    }
    loadOrders();
    if (!socket) {
      socket = io('http://localhost:5001');
      socket.on('connect', () => socket.emit('join_customer', user.id));

      // Status updates — patch local state immediately, then refresh
      socket.on('order_status_update', ({ orderId, status }) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        loadOrders();
        // Clear location when delivered
        if (status === 'delivered') setLiveLocation(null);
      });
      // Legacy event name kept for backward compat
      socket.on('order_update', ({ orderId, status }) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      });

      // Delivery agent live location
      socket.on('location_update', ({ orderId, latitude, longitude }) => {
        setLiveLocation({ orderId, latitude, longitude });
      });

      // Delivery agent accepted — store agent info to display on TrackPage
      socket.on('delivery_accepted', ({ orderId, agentName, agentPhone, status }) => {
        setAgentInfo({ orderId, agentName, agentPhone });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        loadOrders();
      });

      // OTP events
      socket.on('show_pickup_otp', ({ orderId, otp }) => {
        setOtpNotification({ orderId, type: 'pickup', otp });
      });
      socket.on('show_delivery_otp', ({ orderId, otp }) => {
        setOtpNotification({ orderId, type: 'delivery', otp });
      });
      socket.on('delivery_otp', ({ orderId, otp }) => {
        // legacy fallback
        setOtpNotification({ orderId, type: 'delivery', otp });
      });

      // Dismiss location on delivered
      socket.on('order_delivered', () => setLiveLocation(null));

      // Vendor rejected the order
      socket.on('order_rejected', ({ orderId, reason }) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
        setRejectedNotif({ orderId, reason });
      });
    }
  }, [user, loadOrders]);

  const dismissOtp      = () => setOtpNotification(null);
  const dismissRejected = () => setRejectedNotif(null);

  const cancelOrder = async (orderId) => {
    await api.put(`/customer/cancel-order/${orderId}`);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
  };

  const addToCart = (garment) => {
    setCart((prev) => {
      const existing = prev.find((g) => g.id === garment.id);
      if (existing) return prev.map((g) => g.id === garment.id ? { ...g, qty: g.qty + 1 } : g);
      return [...prev, { ...garment, qty: 1 }];
    });
  };

  const removeFromCart = (garmentId) => {
    setCart((prev) => {
      const existing = prev.find((g) => g.id === garmentId);
      if (existing && existing.qty > 1) return prev.map((g) => g.id === garmentId ? { ...g, qty: g.qty - 1 } : g);
      return prev.filter((g) => g.id !== garmentId);
    });
  };

  const placeOrder = async (apartment, pickupDate, coords = null) => {
    if (!cart.length) return null;
    setLoading(true);
    try {
      const items = cart.map((g) => ({
        garment_id:   g.id,
        garment_name: g.name,
        quantity:     g.qty,
        unit_price:   g.price,
      }));
      const payload = { items, apartment, pickup_date: pickupDate };
      if (coords?.latitude != null && coords?.longitude != null) {
        payload.latitude  = coords.latitude;
        payload.longitude = coords.longitude;
      }
      const { data } = await api.post('/place-order', payload);
      setOrders((prev) => [data.order, ...prev]);
      setCart([]);
      setSelectedSlot(null);
      return data.order;
    } catch (err) {
      console.error('placeOrder error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, g) => sum + g.price * g.qty, 0);
  const cartCount = cart.reduce((sum, g) => sum + g.qty, 0);

  return (
    <OrderContext.Provider value={{
      orders, cart, selectedSlot, setSelectedSlot,
      addToCart, removeFromCart, placeOrder, cancelOrder,
      cartTotal, cartCount, garments, timeSlots, loading,
      loadOrders,
      otpNotification, dismissOtp,
      rejectedNotification, dismissRejected,
      liveLocation,
      agentInfo,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => useContext(OrderContext);
