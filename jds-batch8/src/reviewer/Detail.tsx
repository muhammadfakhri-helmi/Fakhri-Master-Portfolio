import { useState } from "react";
import { labelOf, STATUS_OPTIONS, TRACK_LABEL } from "../lib/content.ts";
import { describeSubmission } from "../lib/describe.ts";
import { teamPreferenceText, type Candidate } from "../lib/recap.ts";
import { computeScore, CRITERIA, RUBRIC, SELECTION_STATUSES, type Review, type SelectionStatus } from "../lib/scoring.ts";
import { checkKpi } from "../lib/validation.ts";

export function Detail({
  candidate,
  review,
  repeats,
  conflict,
  onChange,
}: {
  candidate: Candidate;
  review: Review;
  repeats: string[];
  conflict: boolean;
  onChange: (review: Review) => void;
}) {
  const p = candidate.payload;
  const [showRestricted, setShowRestricted] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const sections = describeSubmission(p);
  const criteria = CRITERIA[p.track];
  const result = computeScore(p.track, review.scores);
  const kpi = p.external ? checkKpi(p.external.kpi) : null;
  const restrictedCount = sections.flatMap((s) => s.items).filter((i) => i.sensitive).length;

  const set = (patch: Partial<Review>) => onChange({ ...review, ...patch, updatedAt: new Date().toISOString() });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-4">
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-forest-900">{p.personal.fullName}</h2>
              <p className="text-sm text-stone-600">
                {p.personal.university} · {p.personal.major} · {p.personal.graduationYear} · {labelOf(STATUS_OPTIONS, p.personal.status)}
              </p>
              {p.personal.currentJob && <p className="text-sm text-stone-600">{p.personal.currentJob}</p>}
            </div>
            <div className="text-right text-sm">
              <p className="font-mono text-stone-500">{p.submissionId}</p>
              <p>
                Pilihan: <strong>{teamPreferenceText(p)}</strong>
              </p>
              <p>Asesmen: {TRACK_LABEL[p.track]}</p>
              <p className="text-xs text-stone-400">Dikirim {new Date(p.submittedAt).toLocaleString("id-ID")}</p>
              {p.integrity && (
                <p className={`mt-1 text-xs font-semibold ${p.integrity.pasteBlocked ? "text-amber-700" : "text-stone-400"}`}>
                  Percobaan paste yang diblokir: {p.integrity.pasteBlocked}
                </p>
              )}
            </div>
          </div>
          {(repeats.length > 0 || conflict) && (
            <div className="mt-3 space-y-1 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              {repeats.length > 0 && <p>Kemungkinan pengiriman ganda — data identitas sama dengan Submission ID: {repeats.join(", ")}.</p>}
              {conflict && <p>Ada file lain dengan Submission ID yang sama tetapi isi berbeda (tidak dimuat).</p>}
            </div>
          )}
        </section>

        {kpi && (
          <section className="card space-y-2 p-5 text-sm">
            <h3 className="font-bold text-forest-900">Indikator otomatis KPI (bukan nilai)</h3>
            <p>
              Konsistensi angka: {Object.keys(kpi.errors).length === 0 ? <span className="font-semibold text-emerald-700">konsisten</span> : <span className="font-semibold text-red-700">tidak konsisten</span>}
            </p>
            {[...Object.values(kpi.errors), ...kpi.warnings].map((m) => (
              <p key={m} className="text-amber-800">
                • {m}
              </p>
            ))}
          </section>
        )}

        {restrictedCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span>{restrictedCount} entri berisi data kandidat rekomendasi (pihak ketiga). Data terbatas — tidak masuk rekap umum.</span>
            <button type="button" className="btn-ghost py-1.5" onClick={() => setShowRestricted((v) => !v)}>
              {showRestricted ? "Sembunyikan data terbatas" : "Tampilkan data terbatas"}
            </button>
          </div>
        )}

        {sections.map((section) => (
          <section key={section.step} className="card overflow-hidden">
            <h3 className="border-b border-forest-100 bg-forest-50/70 px-5 py-2.5 font-semibold text-forest-900">{section.title}</h3>
            <dl className="divide-y divide-stone-100">
              {section.items.map((item, i) => (
                <div key={i} className="grid gap-1 px-5 py-3 md:grid-cols-[14rem_1fr] md:gap-4">
                  <dt className="text-sm font-medium text-stone-500">{item.label}</dt>
                  <dd className="text-sm whitespace-pre-line text-stone-800 [overflow-wrap:anywhere]">
                    {item.sensitive && !showRestricted ? (
                      <span className="text-stone-400 italic">Data terbatas disembunyikan</span>
                    ) : Array.isArray(item.value) ? (
                      <ul className="space-y-0.5">
                        {item.value.map((v, n) => (
                          <li key={n}>{v}</li>
                        ))}
                      </ul>
                    ) : (
                      item.value || "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <section className="card space-y-4 p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="font-bold text-forest-900">Penilaian {TRACK_LABEL[p.track]}</h3>
            <button type="button" className="text-xs font-semibold text-leaf-700" onClick={() => setShowRubric((v) => !v)}>
              {showRubric ? "Tutup rubrik" : "Rubrik 0–5"}
            </button>
          </div>
          {showRubric && (
            <ol className="space-y-1.5 rounded-xl bg-forest-50 p-3 text-xs text-stone-600">
              {RUBRIC.map((r) => (
                <li key={r.score}>
                  <strong className="text-forest-900">
                    {r.score} · {r.label}:
                  </strong>{" "}
                  {r.description}
                </li>
              ))}
            </ol>
          )}
          {criteria.map((criterion) => (
            <fieldset key={criterion.id} className="space-y-1.5">
              <legend className="text-sm font-semibold text-forest-900">
                {criterion.label} <span className="font-normal text-stone-400">· {criterion.weight}%</span>
              </legend>
              <p className="text-xs text-stone-500">{criterion.evidence}</p>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((score) => {
                  const active = review.scores[criterion.id] === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      title={RUBRIC[score]!.description}
                      aria-pressed={active}
                      aria-label={`${criterion.label}: ${score}`}
                      onClick={() => set({ scores: { ...review.scores, [criterion.id]: active ? null : score } })}
                      className={`h-9 flex-1 rounded-lg border text-sm font-semibold ${active ? "border-forest-900 bg-forest-900 text-white" : "border-stone-200 bg-white hover:border-leaf-500"}`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="rounded-xl bg-forest-900 p-4 text-white">
            <p className="text-xs text-leaf-300">Skor akhir (0–100)</p>
            <p className="text-3xl font-extrabold tabular-nums">{result.score ?? "—"}</p>
            <p className="text-sm text-forest-100">{result.classification?.label ?? `Belum lengkap (${result.scored}/${result.total} kriteria)`}</p>
          </div>
          <p className="text-xs text-stone-500">
            Klasifikasi adalah rekomendasi, bukan keputusan otomatis. Minat koordinator dan rencana reward rekomendasi nama tidak termasuk dalam skor.
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-forest-900">Selection status</span>
            <select className="input py-2 text-sm" value={review.status} onChange={(e) => set({ status: e.target.value as SelectionStatus })}>
              {SELECTION_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-forest-900">Reviewer notes</span>
            <textarea className="input min-h-28 text-sm" maxLength={10_000} value={review.notes} onChange={(e) => set({ notes: e.target.value })} />
          </label>
          {review.updatedAt && <p className="text-xs text-stone-400">Terakhir diubah {new Date(review.updatedAt).toLocaleString("id-ID")}</p>}
        </section>
      </aside>
    </div>
  );
}
