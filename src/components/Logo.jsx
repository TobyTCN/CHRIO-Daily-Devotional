export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <path d="M17 6v22M10 13h14" stroke="#D8AE55" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 24c3-2 6-2.6 9-2.6s6 .6 9 2.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity=".7" />
    </svg>
  );
}
