import { CalendarIcon, PackageIcon, ClockIcon, TruckIcon, CheckIcon } from './Icons';

const STEPS = [
  { key: 'scheduled',        label: 'Scheduled', Icon: CalendarIcon },
  { key: 'picked_up',        label: 'Picked Up', Icon: PackageIcon  },
  { key: 'in_progress',      label: 'Ironing',   Icon: ClockIcon    },
  { key: 'out_for_delivery', label: 'On the Way',Icon: TruckIcon    },
  { key: 'delivered',        label: 'Delivered', Icon: CheckIcon    },
];

const ORDER_IDX = {
  pending:            0,
  scheduled:          0,
  vendor_accepted:    0,
  delivery_assigned:  0,
  picked_up:          1,
  at_vendor:          2,
  in_progress:        2,
  ready_for_delivery: 2,
  out_for_delivery:   3,
  delivered:          4,
};

export default function OrderStatusBar({ status }) {
  const currentIdx = ORDER_IDX[status] ?? 0;

  return (
    <div className="flex items-start w-full">
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        const { Icon } = step;

        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {idx < STEPS.length - 1 && (
              <div className="absolute top-[15px] left-1/2 w-full h-0.5 z-0">
                <div className={`h-full transition-all duration-500 ${idx < currentIdx ? 'bg-indigo-500' : 'bg-slate-200'}`} />
              </div>
            )}
            <div className={`z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-300 ${
              active
                ? 'bg-indigo-600 shadow-[0_0_0_4px_rgba(99,102,241,0.15)]'
                : done
                ? 'bg-indigo-500'
                : 'bg-slate-100 border border-slate-200'
            }`}>
              {done ? (
                <CheckIcon size={13} className="text-white" />
              ) : (
                <Icon size={14} className={active ? 'text-white' : 'text-slate-400'} />
              )}
            </div>
            <span className={`mt-1.5 text-[10px] font-medium text-center leading-tight w-full px-1 ${
              active ? 'text-indigo-600' : done ? 'text-indigo-400' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
