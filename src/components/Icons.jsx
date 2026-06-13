function Ico({ size = 20, className, children, strokeWidth = 1.75, fill = 'none' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </Ico>
  );
}

export function BagIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </Ico>
  );
}

export function MapPinIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </Ico>
  );
}

export function UserIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Ico>
  );
}

export function PhoneIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8 19.79 19.79 0 012 2.18 2 2 0 014 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </Ico>
  );
}

export function ChevronRightIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <polyline points="9 18 15 12 9 6" />
    </Ico>
  );
}

export function ChevronLeftIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <polyline points="15 18 9 12 15 6" />
    </Ico>
  );
}

export function BellIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </Ico>
  );
}

export function ShieldIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Ico>
  );
}

export function HelpCircleIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Ico>
  );
}

export function StarIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Ico>
  );
}

export function LogOutIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Ico>
  );
}

export function CalendarIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Ico>
  );
}

export function ClockIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Ico>
  );
}

export function CheckIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </Ico>
  );
}

export function PackageIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </Ico>
  );
}

export function TruckIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </Ico>
  );
}

export function ZapIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Ico>
  );
}

export function TagIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Ico>
  );
}

export function ArrowRightIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Ico>
  );
}

export function GridIcon({ size, className }) {
  return (
    <Ico size={size} className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </Ico>
  );
}

export function SteamIronLogo({ size = 40, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M8 26l3-10h18l3 10H8z" fill="currentColor" />
      <path d="M15 16v-3a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="16" cy="22" r="1.5" fill="white" opacity="0.7" />
      <circle cx="20" cy="22" r="1.5" fill="white" opacity="0.7" />
      <circle cx="24" cy="22" r="1.5" fill="white" opacity="0.7" />
      <path d="M13 10c0-1.5 1.5-1.5 1.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M20 9c0-1.5 1.5-1.5 1.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
