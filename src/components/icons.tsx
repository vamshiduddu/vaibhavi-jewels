type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} width="18" height="18">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 7h12l1.2 13H4.8L6 7Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20.5C7 16.6 3.5 13.4 3.5 9.7A4.5 4.5 0 0 1 8 5.2c1.6 0 3.1.8 4 2.1a4.9 4.9 0 0 1 4-2.1 4.5 4.5 0 0 1 4.5 4.5c0 3.7-3.5 6.9-8.5 10.8Z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function PackageIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 8.2 12 3 3 8.2v7.6L12 21l9-5.2V8.2Z" />
      <path d="M3.3 8.3 12 13l8.7-4.7" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 12a8 8 0 1 0-3.1 6.3L21 20l-1.3-3.5A8 8 0 0 0 20 12Z" />
    </svg>
  );
}
