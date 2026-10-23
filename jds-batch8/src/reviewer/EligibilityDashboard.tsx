import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { TARGETS, TEAM_SIZE, TRACK_LABEL } from "../lib/content.ts";
import { averageWords, eligibilityOf, preScreen, type Check, type CheckLevel, type Eligibility, type EligibilityId } from "../lib/eligibility.ts";
import type { Candidate } from "../lib/recap.ts";
import type { Review } from "../lib/scoring.ts";
import { checkKpi } from "../lib/validation.ts";

const COLUMNS: { id: EligibilityId; label: string; hint: string; tone: string; dot: string }[] = [
  { id: "eligible", label: "Layak", hint: "Skor ≥ 75 atau status Terpilih", tone: "border-emerald-200 bg-emerald-50/60", dot: "bg-emerald-500" },
  { id: "interview", label: "Perlu wawancara", hint: "Skor 65–74 atau status Interview", tone: "border-amber-200 bg-amber-50/60", dot: "bg-amber-500" },
  { id: "not_eligible", label: "Belum layak", hint: "Skor < 65 atau Tidak dilanjutkan", tone: "border-red-200 bg-red-50/50", dot: "bg-red-500" },
  { id: "unscored", label: "Belum dinilai", hint: "Skor belum lengkap", tone: "border-stone-200 bg-white/60", dot: "bg-stone-400" },
];

const LEVEL: Record<CheckLevel, { icon: LucideIcon; className: string; text: string }> = {
  ok: { icon: CircleCheck, className: "bg-emerald-50 text-emerald-800 ring-emerald-200", text: "OK" },
  warn: { icon: TriangleAlert, className: "bg-amber-50 text-amber-900 ring-amber-200", text: "Perhatikan" },
  fail: { icon: CircleX, className: "bg-red-50 text-red-800 ring-red-200", text: "Kurang" },
};

export function CheckChip({ check, compact = false }: { check: Check; compact?: boolean }) {
  const level = LEVEL[check.level];
  return (
    <span
      title={`${check.label}: ${check.detail}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ${level.className}`}
    >
      <level.icon className="size-3.5 shrink-0" aria-hidden="true" />
      {compact ? check.label : `${check.label}: ${check.detail}`}
      {compact && <span className="sr-only">: {check.detail}</span>}
    </span>
  );
}

interface Row {
  candidate: Candidate;
  eligibility: Eligibility;
  checks: Check[];
}

type Filter = "all" | "internal" | "external";

export function EligibilityDashboard({
  candidates,
  reviews,
  repeats,
  onOpen,
}: {
  candidates: Candidate[];
  reviews: Record<string, Review>;
  repeats: Record<string, string[]>;
  onOpen: (sid: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const rows: Row[] = useMemo(
    () =>
      candidates.map((candidate) => ({
        candidate,
        eligibility: eligibilityOf(candidate, reviews[candidate.submissionId]),
        checks: preScreen(candidate, repeats[candidate.submissionId]),
      })),
    [candidates, reviews, repeats],
  );
  const visible = rows.filter((r) => filter === "all" || r.candidate.payload.track === filter);
  const count = (id: EligibilityId, list = visible) => list.filter((r) => r.eligibility.id === id).length;

  if (candidates.length === 0) {
    return (
      <section className="card p-6 text-sm text-stone-600">
        <h2 className="card-title">Dashboard kelayakan</h2>
        <p className="mt-2">Muat file jawaban (.md) kandidat di atas. Dashboard akan menampilkan kelayakan, pra-seleksi otomatis, kuota Internal, dan proyeksi peserta External.</p>
      </section>
    );
  }

  const internalRows = rows.filter((r) => r.candidate.payload.track === "internal");
  const internalEligible = internalRows.filter((r) => r.eligibility.id === "eligible");
  const externalRows = rows.filter((r) => r.candidate.payload.track === "external");
  const externalEligible = externalRows.filter((r) => r.eligibility.id === "eligible");
  const projected = (list: Row[]) => list.reduce((sum, r) => sum + (checkKpi(r.candidate.payload.external!.kpi).numbers.total ?? 0), 0);
  const needsAttention = visible.filter((r) => r.checks.some((c) => c.level === "fail")).length;
  const pasteCandidates = visible.filter((r) => (r.candidate.payload.integrity?.pasteBlocked ?? 0) > 0).length;
  const avgWords = visible.length ? Math.round(visible.reduce((s, r) => s + averageWords(r.candidate), 0) / visible.length) : 0;

  return (
    <section className="space-y-5" aria-label="Dashboard kelayakan">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="card-title">Dashboard kelayakan</h2>
          <p className="text-sm text-stone-500">Kelayakan ditentukan oleh skor penilaianmu. Pra-seleksi otomatis hanya penanda — bukan keputusan.</p>
        </div>
        <select aria-label="Filter tim kelayakan" className="input w-auto py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">Semua tim</option>
          <option value="internal">Pertanyaan Internal</option>
          <option value="external">Pertanyaan External</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Total kandidat</p>
          <p className="font-display mt-1 text-3xl font-semibold text-forest-900">{visible.length}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.id} className="card p-4" data-testid={`count-${col.id}`}>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-stone-500 uppercase">
              <span className={`size-2 rounded-full ${col.dot}`} aria-hidden="true" />
              {col.label}
            </p>
            <p className="font-display mt-1 text-3xl font-semibold text-forest-900">{count(col.id)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="font-semibold text-forest-900">Internal Team · kuota {TEAM_SIZE.internal} orang</h3>
          <p className="mt-1 text-sm text-stone-500">
            {internalEligible.length} layak dari {internalRows.length} kandidat Internal
          </p>
          <div className="progress-track mt-3" role="img" aria-label={`Internal layak: ${internalEligible.length} dari kuota ${TEAM_SIZE.internal}`}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (internalEligible.length / TEAM_SIZE.internal) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {internalEligible.length >= TEAM_SIZE.internal
              ? "Kuota terpenuhi — pilih 5 terbaik berdasarkan skor."
              : `Masih butuh ${TEAM_SIZE.internal - internalEligible.length} kandidat layak.`}
          </p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-forest-900">External Team · proyeksi peserta</h3>
          <p className="mt-1 text-sm text-stone-500">
            {externalEligible.length} kandidat layak menargetkan <strong className="text-forest-900">{projected(externalEligible)}</strong> dari {TARGETS.total} peserta
          </p>
          <div className="progress-track mt-3" role="img" aria-label={`Proyeksi External layak: ${projected(externalEligible)} dari ${TARGETS.total}`}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (projected(externalEligible) / TARGETS.total) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-stone-500">Semua kandidat External: {projected(externalRows)} peserta.</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-forest-900">Pra-seleksi otomatis</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
            <li>
              <strong className="text-forest-900">{needsAttention}</strong> kandidat dengan indikator “Kurang”
            </li>
            <li>
              <strong className="text-forest-900">{pasteCandidates}</strong> kandidat mencoba copy-paste
            </li>
            <li>
              Rata-rata <strong className="text-forest-900">{avgWords}</strong> kata per jawaban
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = visible
            .filter((r) => r.eligibility.id === col.id)
            .sort((a, b) => (b.eligibility.score ?? -1) - (a.eligibility.score ?? -1) || a.candidate.payload.personal.fullName.localeCompare(b.candidate.payload.personal.fullName));
          return (
            <section key={col.id} aria-label={`Kolom ${col.label}`} className={`rounded-[var(--radius-card)] border p-3 ${col.tone}`}>
              <header className="flex items-baseline justify-between px-1 pb-2">
                <h3 className="flex items-center gap-2 font-semibold text-forest-900">
                  <span className={`size-2.5 rounded-full ${col.dot}`} aria-hidden="true" />
                  {col.label}
                </h3>
                <span className="text-sm text-stone-500 tabular-nums">{items.length}</span>
              </header>
              <p className="px-1 pb-3 text-xs text-stone-500">{col.hint}</p>
              <ul className="space-y-2.5">
                {items.map(({ candidate, eligibility, checks }) => {
                  const p = candidate.payload;
                  return (
                    <li key={candidate.submissionId} className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-cream-300/70">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button type="button" className="text-left font-semibold text-forest-900 hover:underline" onClick={() => onOpen(candidate.submissionId)}>
                            {p.personal.fullName}
                          </button>
                          <p className="text-xs text-stone-500">
                            {TRACK_LABEL[p.track]}
                            {p.team.preference === "flexible" ? " (Flexible)" : ""} · {candidate.submissionId}
                          </p>
                        </div>
                        <span className="font-display shrink-0 text-xl font-semibold text-forest-900 tabular-nums">{eligibility.score ?? "—"}</span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {checks.map((check) => (
                          <CheckChip key={check.id} check={check} compact />
                        ))}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-stone-500">
                        <span>{eligibility.basis}</span>
                        <button type="button" className="font-semibold text-leaf-700 hover:underline" onClick={() => onOpen(candidate.submissionId)}>
                          Lihat & nilai →
                        </button>
                      </div>
                    </li>
                  );
                })}
                {items.length === 0 && <li className="px-1 py-4 text-center text-xs text-stone-400">Belum ada kandidat</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
