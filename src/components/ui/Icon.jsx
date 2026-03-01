const icons = {
  film: (
    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5M2 2h20v20H2z" />
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  lightning: (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ),
  delorean: (
    <>
      <path d="M5 17h14M3 12l2-5h14l2 5M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      <path d="M3 12h18v5H3z" />
      <path d="M10 7h4v5h-4z" />
    </>
  ),
  cyberbike: (
    <>
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M5 17L9 6h4l3 5h3M12 11l-3 6M19 17l-3-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  maple: (
    <path d="M12 2L9.5 7.5 4 7l3 4.5L5 16h4l3 6 3-6h4l-2-4.5L20 7l-5.5.5z" />
  ),
  dove: (
    <>
      <path d="M18 8c2 0 4-1 4-3s-2-3-4-3c-1 0-2 .5-3 1.5C14 2.5 13 2 12 2c-2 0-4 1-4 3s2 3 4 3" />
      <path d="M12 8c-3 0-8 2-8 7 0 3 2 7 8 7s8-4 8-7c0-5-5-7-8-7z" />
      <path d="M12 8v14" />
    </>
  ),
  chat: (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  ),
  cityscape: (
    <>
      <rect x="1" y="10" width="6" height="12" />
      <rect x="9" y="4" width="6" height="18" />
      <rect x="17" y="8" width="6" height="14" />
      <line x1="4" y1="13" x2="4" y2="13.01" />
      <line x1="4" y1="16" x2="4" y2="16.01" />
      <line x1="12" y1="7" x2="12" y2="7.01" />
      <line x1="12" y1="10" x2="12" y2="10.01" />
      <line x1="12" y1="13" x2="12" y2="13.01" />
      <line x1="12" y1="16" x2="12" y2="16.01" />
      <line x1="20" y1="11" x2="20" y2="11.01" />
      <line x1="20" y1="14" x2="20" y2="14.01" />
    </>
  ),
};

export default function Icon({ name, size = 20, className = "" }) {
  const path = icons[name];
  if (!path) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon icon-${name} ${className}`}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
