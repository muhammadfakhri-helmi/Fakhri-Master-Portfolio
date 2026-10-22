// Placeholder mark only — NOT the official JDS logo. Replace with the official
// logo file supplied by JDS when available (see README → "Logo").
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Logo sementara (placeholder)">
      <rect width="64" height="64" rx="14" fill="#102544" stroke="#22d3ee" strokeOpacity="0.4" />
      <path d="M32 12 20 52h6l6-22 6 22h6L32 12Z" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 40h16" stroke="#22d3ee" strokeWidth="4" />
    </svg>
  );
}
