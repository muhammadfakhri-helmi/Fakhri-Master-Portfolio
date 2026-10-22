import { useState } from "react";
import { LEADERSHIP_SHORT, TARGETS, TEAM_SIZE } from "../lib/content.ts";
import { aggregateKpi, type Candidate } from "../lib/recap.ts";
import { SELECTION_STATUSES, type Review } from "../lib/scoring.ts";

const ROWS = [
  { key: "total", label: "Total peserta", target: TARGETS.total },
  { key: "offline", label: "Offline", target: TARGETS.offline },
  { key: "online", label: "Online", target: TARGETS.online },
  { key: "experienced", label: "Experienced", target: TARGETS.experienced },
  { key: "freshGraduate", label: "Fresh graduate", target: TARGETS.freshGraduate },
  { key: "operator", label: "Operator migas/geothermal (min.)", target: TARGETS.operator },
  { key: "seniorService", label: "Senior service company (min.)", target: TARGETS.seniorService },
  { key: "networking", label: "Networking/sponsorship (min.)", target: TARGETS.networking },
] as const;

export function Dashboard({ candidates, reviews }: { candidates: Candidate[]; reviews: Record<string, Review> }) {
  const [selectedOnly, setSelectedOnly] = useState(false);
  const pool = selectedOnly ? candidates.filter((c) => reviews[c.submissionId]?.status === "Terpilih — External") : candidates;
  const sum = aggregateKpi(pool);

  const count = (fn: (c: Candidate) => string) =>
    candidates.reduce<Record<string, number>>((acc, c) => {
      const key = fn(c);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  const byPreference = count((c) => c.payload.team.preference || "—");
  const byLeadership = count((c) => (c.payload.final.leadership.interest ? LEADERSHIP_SHORT[c.payload.final.leadership.interest] : "—"));
  const byStatus = count((c) => reviews[c.submissionId]?.status ?? "Belum direview");

  return (
    <section className="space-y-5">
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-forest-900">Shared target · proyeksi KPI External vs target JDS Batch 8</h2>
            <p className="text-sm text-stone-500">
              {sum.candidates} kandidat External dihitung. Subkategori boleh tumpang tindih; hanya “Total” yang mewakili peserta unik. Asumsi perencanaan: {TEAM_SIZE.externalAssumption} ×{" "}
              {TEAM_SIZE.examplePerExternalMember} = {TEAM_SIZE.externalAssumption * TEAM_SIZE.examplePerExternalMember}.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectedOnly} onChange={(e) => setSelectedOnly(e.target.checked)} className="accent-leaf-600" />
            Hanya status “Terpilih — External”
          </label>
        </div>
        <div className="space-y-3">
          {ROWS.map((row) => {
            const value = sum[row.key];
            const pct = Math.min(100, Math.round((value / row.target) * 100));
            return (
              <div key={row.key} className="grid items-center gap-2 sm:grid-cols-[16rem_1fr_7rem]">
                <span className="text-sm font-medium text-forest-900">{row.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-stone-200" role="img" aria-label={`${row.label}: ${value} dari ${row.target}`}>
                  <div className={`h-full rounded-full ${value >= row.target ? "bg-emerald-500" : "bg-leaf-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm tabular-nums text-stone-600">
                  {value} / {row.target}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Pilihan tim", data: byPreference },
          { title: "Minat koordinator (informasi tambahan)", data: byLeadership },
          { title: "Status seleksi", data: Object.fromEntries(SELECTION_STATUSES.map((s) => [s, byStatus[s] ?? 0])) },
        ].map((box) => (
          <div key={box.title} className="card p-5">
            <h3 className="text-sm font-bold text-forest-900">{box.title}</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {Object.entries(box.data).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-3">
                  <span className="text-stone-600">{k}</span>
                  <span className="font-semibold tabular-nums">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
