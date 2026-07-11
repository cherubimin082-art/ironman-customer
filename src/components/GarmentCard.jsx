import { useOrder } from '../context/OrderContext';

export default function GarmentCard({ garment }) {
  const { cart, addToCart, removeFromCart } = useOrder();
  const cartItem = cart.find((g) => g.id === garment.id);
  const qty = cartItem?.qty || 0;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 p-4 flex flex-col items-center gap-2 ${
      qty > 0
        ? 'border-red-200 shadow-[0_2px_12px_rgba(99,102,241,0.12)]'
        : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98]'
    }`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${qty > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
        {garment.image_url
          ? <img src={garment.image_url} alt={garment.name} className="w-9 h-9 object-contain" />
          : garment.icon
            ? <span className="text-3xl">{garment.icon}</span>
            : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-slate-300">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
      </div>
      <p className="font-semibold text-slate-800 text-sm text-center leading-tight">{garment.name}</p>
      <p className={`text-xs font-bold ${qty > 0 ? 'text-red-600' : 'text-slate-500'}`}>₹{garment.price}</p>

      {qty === 0 ? (
        <button
          onClick={() => addToCart(garment)}
          className="mt-0.5 w-full min-h-[40px] bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
        >
          Add
        </button>
      ) : (
        <div className="mt-0.5 flex items-center justify-between w-full bg-red-600 rounded-xl px-1 py-1">
          <button
            onClick={() => removeFromCart(garment.id)}
            className="w-8 h-8 flex items-center justify-center text-white font-bold text-lg hover:bg-white/20 rounded-lg transition-colors"
          >
            −
          </button>
          <span className="font-bold text-white text-sm w-5 text-center">{qty}</span>
          <button
            onClick={() => addToCart(garment)}
            className="w-8 h-8 flex items-center justify-center text-white font-bold text-lg hover:bg-white/20 rounded-lg transition-colors"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
