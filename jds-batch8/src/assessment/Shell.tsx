import { Check, ClipboardCheck, Compass, Flag, House, Lock, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Sprout } from "./Illustration.tsx";
import { LogoMark, WoodSign } from "./Logo.tsx";

export type SectionId = "A" | "B" | "C" | "D" | "Review";
export type NavState = "done" | "current" | "open" | "locked";

export const SECTIONS: { id: SectionId; label: string; sub: string; icon: LucideIcon }[] = [
  { id: "A", label: "Personal", sub: "Latar belakang & waktu", icon: UserRound },
  { id: "B", label: "Pilihan Tim", sub: "Internal · External · Flexible", icon: UsersRound },
  { id: "C", label: "Studi Kasus", sub: "Strategi & target nyata", icon: Compass },
  { id: "D", label: "Komitmen", sub: "Reward, peran, akuntabilitas", icon: Flag },
  { id: "Review", label: "Review & Unduh", sub: "Periksa lalu enkripsi", icon: ClipboardCheck },
];

interface ShellProps {
  home: boolean;
  nav: Record<SectionId, NavState>;
  onHome: () => void;
  onSection: (id: SectionId) => void;
  stepLabel?: string;
  children: ReactNode;
}

export function Shell({ home, nav, onHome, onSection, stepLabel, children }: ShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <div className="forest-texture hidden lg:block">
      <aside className="sticky top-0 flex h-screen flex-col gap-6 overflow-y-auto px-4 py-6 text-cream-50">
        <WoodSign />
        <nav aria-label="Bagian asesmen">
          <ul className="space-y-1.5">
            <li>
              <NavButton icon={House} label="Beranda" sub="Tujuan & pilihan tim" state={home ? "current" : "open"} onClick={onHome} />
            </li>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <NavButton icon={s.icon} label={s.label} sub={s.sub} badge={s.id === "Review" ? "R" : s.id} state={nav[s.id]} onClick={() => onSection(s.id)} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-cream-50/95 p-4 text-ink shadow-lg">
          <div className="flex items-center gap-2">
            <Sprout className="size-8" />
            <p className="font-display text-base font-semibold text-forest-900">Tips menjawab</p>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b6450]">
            Tulis langkah nyata, angka, dan prioritas — bukan sekadar kesediaan. Jawaban hanya tersimpan di tab ini sampai kamu mengunduh file.
          </p>
        </div>
      </aside>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="forest-texture sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 text-cream-50 shadow-md lg:hidden">
          <LogoMark size={34} />
          <div className="min-w-0 leading-tight">
            <p className="font-display text-[15px] font-semibold">JDS Batch 8</p>
            <p className="truncate text-[11.5px] text-cream-200/80">Recruitment Committee Assessment</p>
          </div>
          {stepLabel && <span className="ml-auto shrink-0 rounded-full bg-cream-50/15 px-3 py-1 text-xs font-semibold tabular-nums">{stepLabel}</span>}
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-10 border-t border-cream-300/70">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs leading-relaxed text-[#857d68] sm:px-8">
            <p className="font-semibold text-forest-800">JDS Batch 8 · Recruitment Committee Assessment</p>
            <p>Logo pada halaman ini adalah placeholder sementara, bukan logo resmi Jakarta Drilling Society. Website ini tidak mengirim data ke server mana pun.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, sub, badge, state, onClick }: { icon: LucideIcon; label: string; sub: string; badge?: string; state: NavState; onClick: () => void }) {
  const current = state === "current";
  const locked = state === "locked";
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      aria-current={current ? "step" : undefined}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
        current ? "bg-cream-50 text-forest-900 shadow-[0_6px_16px_-8px_rgb(0_0_0/0.5)]" : locked ? "cursor-not-allowed text-cream-50/45" : "text-cream-50/90 hover:bg-white/10"
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${
          current ? "bg-forest-700 text-cream-50" : state === "done" ? "bg-leaf-500/90 text-white" : "bg-white/10 text-cream-100"
        }`}
      >
        {state === "done" ? <Check className="size-4.5" strokeWidth={3} /> : <Icon className="size-4.5" strokeWidth={2.2} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14.5px] font-semibold">
          {badge && <span className={`text-[11px] font-bold ${current ? "text-leaf-700" : "text-leaf-300"}`}>{badge}</span>}
          {label}
        </span>
        <span className={`block truncate text-[12px] ${current ? "text-[#7d7562]" : "text-cream-50/55"}`}>{sub}</span>
      </span>
      {locked && <Lock className="size-3.5 shrink-0 opacity-60" aria-label="Terkunci" />}
    </button>
  );
}
