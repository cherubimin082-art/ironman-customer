import { useState } from 'react';

export default function UpdateModal({ onUpdate }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header strip */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">New Update Available</p>
            <p className="text-white/70 text-xs">Iron Man · Latest version ready</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            A newer version of the app is available with improvements and bug fixes. Update now for the best experience.
          </p>

          <button
            onClick={onUpdate}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all mb-2.5 flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Update
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="w-full py-3 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
