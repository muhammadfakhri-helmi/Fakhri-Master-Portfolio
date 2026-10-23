import { useMemo, useState } from "react";
import { LEADERSHIP_SHORT, labelOf, REWARD_SHORT, WEEKLY_HOURS_OPTIONS } from "../lib/content.ts";
import { teamPreferenceText, type Candidate } from "../lib/recap.ts";
import { computeScore, emptyReview, type Review } from "../lib/scoring.ts";
import { checkKpi } from "../lib/validation.ts";

type Filter = "all" | "internal" | "external" | "flexible";
type Sort = "name" | "score" | "status";

export function RecapTable({
  candidates,
  reviews,
  repeats,
  conflicts,
  onOpen,
}: {
  candidates: Candidate[];
  reviews: Record<string, Review>;
  repeats: Record<string, string[]>;
  conflicts: string[];
  onOpen: (sid: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("score");

  const rows = useMemo(() => {
    const list = candidates
      .filter((c) => filter === "all" || c.payload.team.preference === filter)
      .map((c) => {
        const review = reviews[c.submissionId] ?? emptyReview(c.submissionId);
        return { c, review, result: computeScore(c.payload.track, review.scores) };
      });
    return list.sort((a, b) => {
      if (sort === "score") return (b.result.score ?? -1) - (a.result.score ?? -1);
      if (sort === "status") return a.review.status.localeCompare(b.review.status);
      return a.c.payload.personal.fullName.localeCompare(b.c.payload.personal.fullName);
    });
  }, [candidates, reviews, filter, sort]);

  if (candidates.length === 0) {
    return <p className="card p-6 text-sm text-stone-500">Belum ada kandidat. Muat file jawaban (.md) kandidat.</p>;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <select aria-label="Filter tim" className="input w-auto py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">Semua pilihan tim</option>
          <option value="internal">Internal</option>
          <option value="external">External</option>
          <option value="flexible">Flexible</option>
        </select>
        <select aria-label="Urutkan" className="input w-auto py-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="score">Urut skor tertinggi</option>
          <option value="name">Urut nama</option>
          <option value="status">Urut status</option>
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-forest-900 text-xs text-forest-100">
            <tr>
              {["Name", "Team Preference", "Weekly Availability", "Leadership Interest", "Target (Off/On)", "Target Companies", "KPI", "Reward Plan", "Score", "Classification", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map(({ c, review, result }) => {
              const p = c.payload;
              const ext = p.external;
              const kpiOk = ext ? Object.keys(checkKpi(ext.kpi).errors).length === 0 : null;
              const flags = [
                ...(repeats[c.submissionId]?.length ? ["Kemungkinan ganda"] : []),
                ...(conflicts.includes(c.submissionId) ? ["ID konflik"] : []),
                ...(p.integrity?.pasteBlocked ? [`Paste diblokir ×${p.integrity.pasteBlocked}`] : []),
              ];
              return (
                <tr key={c.submissionId} className="align-top hover:bg-forest-50">
                  <td className="px-3 py-2.5">
                    <button type="button" className="text-left font-semibold text-forest-900 underline-offset-2 hover:underline" onClick={() => onOpen(c.submissionId)}>
                      {p.personal.fullName}
                    </button>
                    <p className="font-mono text-xs text-stone-400">{c.submissionId}</p>
                    {flags.map((f) => (
                      <span key={f} className="mt-1 mr-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                        {f}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-2.5">{teamPreferenceText(p)}</td>
                  <td className="px-3 py-2.5">{labelOf(WEEKLY_HOURS_OPTIONS, p.personal.weeklyHours)}</td>
                  <td className="px-3 py-2.5">{p.final.leadership.interest ? LEADERSHIP_SHORT[p.final.leadership.interest] : "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{ext ? `${ext.kpi.total} (${ext.kpi.offline}/${ext.kpi.online})` : "—"}</td>
                  <td className="max-w-56 px-3 py-2.5">{ext ? ext.companies.join(", ") : "—"}</td>
                  <td className="px-3 py-2.5">{kpiOk === null ? "—" : kpiOk ? "Konsisten" : <span className="text-red-700">Tidak konsisten</span>}</td>
                  <td className="px-3 py-2.5">{p.final.reward.plan ? REWARD_SHORT[p.final.reward.plan] : "—"}</td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">{result.score ?? (result.scored ? `${result.scored}/${result.total}` : "—")}</td>
                  <td className="px-3 py-2.5">{result.classification?.label ?? "—"}</td>
                  <td className="px-3 py-2.5">{review.status}</td>
                  <td className="px-3 py-2.5">
                    <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-leaf-700 hover:bg-leaf-400/10" onClick={() => onOpen(c.submissionId)}>
                      Nilai →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
