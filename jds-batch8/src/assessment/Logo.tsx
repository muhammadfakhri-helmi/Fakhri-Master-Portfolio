// Placeholder marks only — NOT the official JDS logo. Replace with the official
// logo supplied by JDS when available (see README → "Logo").

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Logo sementara (placeholder)">
      <rect width="64" height="64" rx="16" fill="#a8794a" />
      <rect x="3" y="3" width="58" height="58" rx="13" fill="none" stroke="#d7b98c" strokeWidth="2" />
      <path d="M32 13 22 50h5.5l4.5-17 4.5 17H42L32 13Z" fill="none" stroke="#fffcf5" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M25.5 39h13" stroke="#fffcf5" strokeWidth="3.5" />
    </svg>
  );
}

/** Wooden sign at the top of the sidebar. */
export function WoodSign() {
  return (
    <div className="relative mx-auto w-full max-w-[13.5rem] pt-3" aria-label="JDS Batch 8 Recruitment Assessment">
      <svg className="absolute -top-1 left-1/2 w-16 -translate-x-1/2" viewBox="0 0 64 24" aria-hidden="true">
        <path d="M32 22 C22 22 14 16 10 6 C20 6 28 12 32 22 Z" fill="#7aa34f" />
        <path d="M32 22 C42 22 50 14 54 4 C44 4 36 10 32 22 Z" fill="#9cbd70" />
      </svg>
      <div className="relative rounded-2xl border-2 border-[#5b3d22] bg-linear-to-b from-[#b88752] to-[#94683d] px-4 pt-3 pb-3.5 text-center shadow-[0_8px_18px_-8px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.25)]">
        <span className="absolute top-2 left-2.5 size-1.5 rounded-full bg-[#5b3d22]" />
        <span className="absolute top-2 right-2.5 size-1.5 rounded-full bg-[#5b3d22]" />
        <p className="text-[10.5px] font-semibold tracking-[0.2em] text-[#f7e6c4] uppercase">JDS Batch 8</p>
        <p className="font-display text-[1.6rem] leading-tight font-semibold text-cream-50 [text-shadow:0_2px_0_rgb(91_61_34/0.6)]">Recruitment</p>
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#f7e6c4] uppercase">Assessment</p>
      </div>
    </div>
  );
}
