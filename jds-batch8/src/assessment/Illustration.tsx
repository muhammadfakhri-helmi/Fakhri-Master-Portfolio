import type { ReactNode } from "react";

// Hand-built SVG scenery (no external images): hills, pines, a lake and a
// drilling derrick — a calm "field" mood for the assessment.

function Pine({ x, y, s = 1, dark = "#46613d", light = "#5f7f4f", sway = false }: { x: number; y: number; s?: number; dark?: string; light?: string; sway?: boolean }) {
  const tree = (
    <>
      <rect x="-3" y="-6" width="6" height="14" rx="1.5" fill="#6f4c2c" />
      <path d="M0 -78 L-22 -38 H-10 L-28 -8 H28 L10 -38 H22 Z" fill={dark} />
      <path d="M0 -78 L-22 -38 H-10 L-28 -8 H0 Z" fill={light} />
    </>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {sway ? <g className="sway">{tree}</g> : tree}
    </g>
  );
}

function Derrick({ x, y }: { x: number; y: number }) {
  const legs = "M-26 0 L-6 -118 M26 0 L6 -118";
  const braces = "M-22 -22 L22 -22 M-18 -46 L18 -46 M-14 -70 L14 -70 M-10 -94 L10 -94 M-22 -22 L18 -46 M-18 -46 L14 -70 M-14 -70 L10 -94 M22 -22 L-18 -46 M18 -46 L-14 -70 M14 -70 L-10 -94";
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-44" y="-4" width="88" height="10" rx="2" fill="#8a643e" />
      <rect x="-40" y="6" width="6" height="12" fill="#6f4c2c" />
      <rect x="34" y="6" width="6" height="12" fill="#6f4c2c" />
      <path d={legs} stroke="#6f4c2c" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d={braces} stroke="#8a643e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <rect x="-12" y="-128" width="24" height="10" rx="2" fill="#6f4c2c" />
      <path d="M0 -128 V-150" stroke="#6f4c2c" strokeWidth="2.5" />
      <path d="M0 -150 L18 -144 L0 -138 Z" fill="#e8b84a" />
      {/* doghouse */}
      <rect x="52" y="-26" width="40" height="28" rx="3" fill="#e9dcbc" stroke="#8a643e" strokeWidth="2" />
      <path d="M48 -26 L72 -42 L96 -26 Z" fill="#a8794a" />
      <rect x="66" y="-16" width="12" height="18" rx="2" fill="#8a643e" />
    </g>
  );
}

const FLOWERS = [
  [70, 300, "#fff8e6"], [130, 292, "#f3c1a8"], [205, 304, "#fff8e6"], [320, 298, "#e8b84a"], [455, 306, "#fff8e6"],
  [610, 300, "#f3c1a8"], [700, 296, "#fff8e6"], [880, 304, "#e8b84a"], [1010, 300, "#fff8e6"], [1120, 296, "#f3c1a8"],
] as const;

export function Landscape({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="jds-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe7cf" />
          <stop offset="1" stopColor="#f6f0df" />
        </linearGradient>
        <linearGradient id="jds-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd6cd" />
          <stop offset="1" stopColor="#9dc0b4" />
        </linearGradient>
      </defs>
      <rect width="1200" height="320" fill="url(#jds-sky)" />
      <circle cx="1010" cy="70" r="46" fill="#f8ebbd" opacity="0.85" />
      <g fill="#fffaf0" opacity="0.8">
        <ellipse cx="760" cy="62" rx="58" ry="14" />
        <ellipse cx="800" cy="52" rx="34" ry="14" />
        <ellipse cx="420" cy="44" rx="46" ry="11" />
      </g>
      <path d="M0 200 L120 140 L210 175 L330 110 L450 170 L560 120 L690 180 L820 115 L950 165 L1070 120 L1200 160 V320 H0 Z" fill="#cbd6b6" />
      <path d="M0 225 C140 190 260 210 380 195 C520 178 640 214 780 196 C920 178 1060 200 1200 186 V320 H0 Z" fill="#b1c595" />
      {[540, 575, 610, 645, 680, 715].map((px, i) => (
        <Pine key={px} x={px} y={214 + (i % 2) * 4} s={0.42} dark="#7f9b66" light="#94af7a" />
      ))}
      <path d="M820 266 C930 244 1060 244 1200 252 V294 C1060 300 930 298 820 288 Z" fill="url(#jds-lake)" />
      <path d="M880 272 H930 M970 264 H1040 M1080 276 H1150" stroke="#e7f1ec" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M0 262 C180 236 360 252 520 246 C640 242 760 244 880 262 C840 282 800 300 760 320 H0 Z" fill="#9db67f" />
      <Derrick x={720} y={252} />
      <Pine x={960} y={246} s={1.05} sway />
      <Pine x={1020} y={240} s={1.35} dark="#3f5837" light="#55744a" />
      <Pine x={1085} y={250} s={1.1} sway />
      <Pine x={1150} y={244} s={1.45} dark="#3f5837" light="#55744a" />
      <Pine x={560} y={250} s={0.8} />
      <Pine x={605} y={256} s={0.65} sway />
      <Pine x={860} y={258} s={0.75} sway />
      {/* small boat */}
      <g transform="translate(1000 272)">
        <path d="M-22 0 H22 L14 9 H-14 Z" fill="#8a643e" />
        <path d="M0 0 V-24 L14 -4 Z" fill="#fff8e6" />
      </g>
      <path d="M0 290 C200 276 420 300 640 290 C840 281 1020 296 1200 286 V320 H0 Z" fill="#87a466" />
      {FLOWERS.map(([fx, fy, color]) => (
        <g key={fx} transform={`translate(${fx} ${fy})`}>
          <circle r="4" fill={color} />
          <circle r="1.6" fill="#e8b84a" />
        </g>
      ))}
    </svg>
  );
}

/** Rounded scenery card with readable text on the left. */
export function SceneBanner({ children, size = "lg" }: { children: ReactNode; size?: "lg" | "md" }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] border border-cream-300/70 shadow-[var(--shadow-card)] ${size === "lg" ? "min-h-[22rem]" : "min-h-[12.5rem]"}`}>
      <Landscape className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-linear-to-r from-cream-50/95 from-25% via-cream-50/70 via-45% to-transparent to-70% max-md:from-cream-50/95 max-md:via-cream-50/85 max-md:to-cream-50/55" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function Sprout({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 58 V30" stroke="#6f4c2c" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 34 C18 34 12 24 12 14 C24 14 32 22 32 34 Z" fill="#7aa34f" />
      <path d="M32 30 C46 30 52 20 52 10 C40 10 32 18 32 30 Z" fill="#587650" />
      <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#a8794a" opacity="0.5" />
    </svg>
  );
}
