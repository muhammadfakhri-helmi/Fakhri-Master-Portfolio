import type { Candidate } from "../lib/recap.ts";

const FIELDS = [
  { label: "Strategi utama (Q9a)", get: (c: Candidate) => c.payload.internal!.strategy.mainStrategy },
  { label: "Tiga langkah pertama (Q9f)", get: (c: Candidate) => c.payload.internal!.strategy.firstThreeSteps },
  { label: "Operator & senior service (Q9b–c)", get: (c: Candidate) => `${c.payload.internal!.strategy.operatorPlan}\n\n${c.payload.internal!.strategy.seniorServicePlan}` },
  { label: "Prioritas Internal (Q10a)", get: (c: Candidate) => c.payload.internal!.execution.priorities },
  { label: "Ukuran efektivitas (Q10c)", get: (c: Candidate) => c.payload.internal!.execution.effectivenessMeasure },
  { label: "Pemulihan 7 hari (Q11)", get: (c: Candidate) => `${c.payload.internal!.recovery.priorities}\n\nKPI: ${c.payload.internal!.recovery.recoveryKpi}` },
  { label: "Deliverable 30 hari (Q12)", get: (c: Candidate) => c.payload.internal!.deliverables.map((d, i) => `${i + 1}. ${d.title} (${d.deadline})`).join("\n") },
];

export function InternalCompare({ candidates, onOpen }: { candidates: Candidate[]; onOpen: (sid: string) => void }) {
  const internal = candidates.filter((c) => c.payload.internal);
  if (internal.length === 0) return <p className="card p-6 text-sm text-stone-500">Belum ada kandidat yang mengerjakan studi kasus Internal.</p>;
  return (
    <section className="space-y-3">
      <p className="text-sm text-stone-500">Bandingkan ide strategi antarcalon panitia Internal. Geser ke samping bila kandidat lebih dari tiga.</p>
      <div className="overflow-x-auto pb-2">
        <div className="grid auto-cols-[minmax(18rem,1fr)] grid-flow-col gap-4">
          {internal.map((c) => (
            <article key={c.submissionId} className="card flex flex-col p-5">
              <button type="button" className="text-left font-bold text-forest-900 hover:underline" onClick={() => onOpen(c.submissionId)}>
                {c.payload.personal.fullName}
              </button>
              <p className="font-mono text-xs text-stone-400">
                {c.submissionId} · {c.payload.team.preference === "flexible" ? "Flexible" : "Internal"}
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                {FIELDS.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs font-bold tracking-wide text-leaf-700 uppercase">{f.label}</dt>
                    <dd className="mt-1 whitespace-pre-line text-stone-700 [overflow-wrap:anywhere]">{f.get(c)}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
