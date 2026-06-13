import { useOrder } from '../context/OrderContext';
import { ClockIcon } from './Icons';

const TIME_SLOTS = [
  { label: '7:00 – 9:00 AM',     period: 'Morning'   },
  { label: '9:00 – 11:00 AM',    period: 'Morning'   },
  { label: '11:00 AM – 1:00 PM', period: 'Afternoon' },
  { label: '2:00 – 4:00 PM',     period: 'Afternoon' },
  { label: '4:00 – 6:00 PM',     period: 'Evening'   },
  { label: '6:00 – 8:00 PM',     period: 'Evening'   },
];

export default function SlotPicker() {
  const { selectedSlot, setSelectedSlot } = useOrder();

  return (
    <div className="grid grid-cols-2 gap-3">
      {TIME_SLOTS.map((slot) => {
        const active = selectedSlot === slot.label;
        return (
          <button
            key={slot.label}
            onClick={() => setSelectedSlot(slot.label)}
            className={`relative flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
              active
                ? 'border-indigo-500 bg-indigo-50 shadow-[0_2px_8px_rgba(99,102,241,0.18)]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {active && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                  <polyline points="1.5 4 3.5 6 6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
              {slot.period}
            </span>
            <div className="flex items-center gap-1.5">
              <ClockIcon size={14} className={active ? 'text-indigo-600' : 'text-slate-400'} />
              <span className={`text-xs font-semibold leading-tight ${active ? 'text-indigo-700' : 'text-slate-700'}`}>
                {slot.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
