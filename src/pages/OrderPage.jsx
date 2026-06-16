import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import GarmentCard from '../components/GarmentCard';
import { APARTMENTS } from './SignUp';
import { APARTMENT_DEFAULT_TIME } from '../constants/apartmentSlots';
import { ChevronLeftIcon, ArrowRightIcon, CheckIcon } from '../components/Icons';

const STEPS = ['Garments', 'Confirm'];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Parse end time from slot string like "9:00 AM - 10:00 AM" → minutes since midnight
const parseSlotEndMinutes = (slotStr) => {
  if (!slotStr) return null;
  const parts = slotStr.split(/\s[–\-]\s/);
  if (parts.length < 2) return null;
  const end = parts[parts.length - 1].trim();
  const m = end.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

export default function OrderPage() {
  const { cart, cartTotal, cartCount, placeOrder, garments } = useOrder();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState('All');
  const [step, setStep]       = useState('garments');
  const [placing, setPlacing] = useState(false);
  const [apartment, setApartment] = useState(user?.apartment || '');
  const [pickupDate, setPickupDate] = useState('');
  const [slotTimeOver, setSlotTimeOver] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const navigate = useNavigate();

  const categories = ['All', ...new Set(garments.map((g) => g.category))];
  const stepIdx    = step === 'garments' ? 0 : 1;
  const filtered   = activeCategory === 'All' ? garments : garments.filter((g) => g.category === activeCategory);
  const today      = todayStr();
  const fixedTime  = apartment ? APARTMENT_DEFAULT_TIME[apartment] : null;

  // Recalculated every render — if slot has passed right now, min date is tomorrow
  const minPickupDate = (() => {
    if (!fixedTime) return today;
    const end = parseSlotEndMinutes(fixedTime);
    if (end === null) return today;
    const now = new Date();
    return (now.getHours() * 60 + now.getMinutes()) >= end ? tomorrowStr() : today;
  })();

  useEffect(() => {
    if (user?.apartment) handleApartmentChange(user.apartment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApartmentChange = (val) => {
    setApartment(val);
    setConfirmError('');
    const slotStr = APARTMENT_DEFAULT_TIME[val];
    if (slotStr) {
      const endMinutes = parseSlotEndMinutes(slotStr);
      if (endMinutes !== null) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (currentMinutes < endMinutes) {
          setPickupDate(todayStr());
          setSlotTimeOver(false);
        } else {
          setPickupDate(tomorrowStr());
          setSlotTimeOver(true);
        }
        return;
      }
    }
    setPickupDate('');
    setSlotTimeOver(false);
  };

  const handlePlaceOrder = async () => {
    if (!apartment)  { setConfirmError('Please select your apartment'); return; }
    if (!pickupDate) { setConfirmError('Please select a pickup date'); return; }
    if (fixedTime && pickupDate === today) {
      const end = parseSlotEndMinutes(fixedTime);
      const now = new Date();
      if (end !== null && (now.getHours() * 60 + now.getMinutes()) >= end) {
        setConfirmError("Today's pickup slot has passed. Please select tomorrow or a later date.");
        setPickupDate(tomorrowStr());
        setSlotTimeOver(true);
        return;
      }
    }
    setConfirmError('');
    setPlacing(true);

    // Try to capture GPS — silently skip if denied or unavailable
    let coords = null;
    if (navigator.geolocation) {
      coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          ()    => resolve(null),
          { timeout: 5000, maximumAge: 60000 }
        );
      });
    }

    const order = await placeOrder(apartment, pickupDate, coords);
    setPlacing(false);
    if (order) navigate(`/track?id=${order.id}`);
  };

  /* ── Sticky cart sidebar (desktop only) ── */
  const CartSidebar = () => (
    <div className="hidden lg:block lg:sticky lg:top-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Cart Summary</p>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">No items yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Select garments from the catalogue</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 mb-4">
              {cart.map((g) => (
                <div key={g.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{g.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{g.name}</p>
                      <p className="text-[10px] text-slate-400">× {g.qty}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">₹{g.price * g.qty}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center py-3 border-t border-slate-100 mb-4">
              <span className="text-sm font-bold text-slate-800">Total</span>
              <span className="text-base font-bold text-red-600">₹{cartTotal}</span>
            </div>

            {step === 'garments' && cartCount > 0 && (
              <button onClick={() => setStep('confirm')} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Review Order <ArrowRightIcon size={14} />
              </button>
            )}
            {step === 'confirm' && (
              <button onClick={handlePlaceOrder} disabled={placing} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                {placing
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing…</>
                  : <><CheckIcon size={15} />Place Order</>}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  const safeBottom  = { bottom: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))' };
  const selectClass = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none';
  const labelClass  = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2';
  const fieldLabel  = 'block text-xs font-semibold text-slate-600 mb-1.5';

  const ChevronDown = () => (
    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  return (
    <div className="min-h-screen pb-28 lg:pb-10">
      {/* ── Sticky header ── */}
      <div
        className="bg-white border-b border-slate-100 px-4 pb-4 lg:pt-6 sticky top-0 z-30 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
        style={{ paddingTop: 'max(2.75rem, env(safe-area-inset-top, 2.75rem))' }}
      >
        <div className="max-w-7xl mx-auto lg:px-4">
          <div className="flex items-center gap-3 mb-4">
            {step !== 'garments' && (
              <button
                onClick={() => setStep('garments')}
                className="p-2 -ml-2 -my-1 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <ChevronLeftIcon size={20} />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-slate-900">
                {step === 'garments' ? 'Select Garments' : 'Review Order'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Step {stepIdx + 1} of {STEPS.length}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${i <= stepIdx ? 'bg-red-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 lg:pt-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10 lg:items-start">

          <div>
            {/* ── Garments ── */}
            {step === 'garments' && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        activeCategory === cat ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map((g) => <GarmentCard key={g.id} garment={g} />)}
                </div>

                {cartCount > 0 && (
                  <div className="fixed left-0 right-0 px-4 z-30 lg:hidden" style={safeBottom}>
                    <button
                      onClick={() => setStep('confirm')}
                      className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold py-4 rounded-2xl shadow-[0_8px_24px_rgba(99,102,241,0.4)] flex justify-between items-center px-5 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-white/20 rounded-lg px-2.5 py-1 text-xs font-bold">{cartCount}</span>
                        <span className="text-sm">item{cartCount !== 1 ? 's' : ''} selected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold">₹{cartTotal}</span>
                        <ArrowRightIcon size={15} />
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Confirm ── */}
            {step === 'confirm' && (
              <>
                {/* Garments summary */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3">
                  <p className={labelClass}>Garments</p>
                  <div className="space-y-2.5">
                    {cart.map((g) => (
                      <div key={g.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{g.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{g.name}</p>
                            <p className="text-xs text-slate-400">× {g.qty} @ ₹{g.price}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">₹{g.price * g.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-800">Total</span>
                    <span className="text-base font-bold text-red-600">₹{cartTotal}</span>
                  </div>
                </div>

                {/* Apartment · Date · Time Slot */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3 space-y-4">
                  <p className={labelClass}>Delivery Details</p>

                  {/* Apartment */}
                  <div>
                    <label className={fieldLabel}>
                      Apartment <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={apartment}
                        onChange={e => handleApartmentChange(e.target.value)}
                        className={`${selectClass} pr-10 ${!apartment ? 'text-slate-400' : 'text-slate-900'}`}
                      >
                        <option value="" disabled>Choose apartment…</option>
                        {APARTMENTS.map(apt => (
                          <option key={apt} value={apt}>{apt}</option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                    {user?.apartment && apartment === user.apartment && (
                      <p className="text-[11px] text-slate-400 mt-1">Pre-filled from your profile. Change if needed.</p>
                    )}
                  </div>

                  {/* Pickup Date */}
                  <div>
                    <label className={fieldLabel}>
                      Pickup Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      min={minPickupDate}
                      onChange={e => {
                        const selected = e.target.value;
                        if (selected < minPickupDate) {
                          // Block selection — snap back to the minimum allowed date
                          setPickupDate(minPickupDate);
                          setSlotTimeOver(minPickupDate > today);
                        } else {
                          setPickupDate(selected);
                          setSlotTimeOver(false);
                          setConfirmError('');
                        }
                      }}
                      className={`${selectClass} ${!pickupDate ? 'text-slate-400' : 'text-slate-900'}`}
                    />
                    {slotTimeOver ? (
                      <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <p className="text-[11.5px] text-amber-700 font-medium leading-snug">
                          Today's pickup slot has passed. Your clothes will be picked up <span className="font-bold">tomorrow</span>.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">{apartment && fixedTime ? 'Auto-set based on pickup slot.' : 'Today or any future date.'}</p>
                    )}
                  </div>

                  {/* Fixed pickup time — auto-set from apartment, read-only */}
                  {fixedTime && (
                    <div>
                      <label className={fieldLabel}>Pickup Time</label>
                      <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span className="text-base font-medium text-slate-800">{fixedTime}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Fixed pickup time for {apartment}.</p>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
                  <p className={labelClass}>Payment</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600">Cash on Delivery</span>
                  </div>
                </div>

                {/* Validation error */}
                {confirmError && (
                  <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-rose-600 text-sm">{confirmError}</p>
                  </div>
                )}

                {/* Mobile Place Order */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full lg:hidden bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(5,150,105,0.35)] flex items-center justify-center gap-2 transition-all"
                >
                  {placing
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order…</>
                    : <><CheckIcon size={17} />Place Order</>}
                </button>
              </>
            )}
          </div>

          {/* Desktop cart sidebar */}
          <CartSidebar />
        </div>
      </div>
    </div>
  );
}
