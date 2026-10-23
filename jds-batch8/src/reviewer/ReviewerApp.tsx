import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Delimiter } from "../lib/csv.ts";
import { emptyIntake, intakeFile, possibleRepeatSubmissions, type IntakeResult, type IntakeState } from "../lib/intake.ts";
import { externalCompaniesCsv, externalKpiCsv, internalStrategyCsv, recapCsv } from "../lib/recap.ts";
import { emptyReview, type Review } from "../lib/scoring.ts";
import { loadReviews, parseReviewsBackup, reviewsBackup, saveReview } from "./api.ts";
import { Detail } from "./Detail.tsx";
import { EligibilityDashboard } from "./EligibilityDashboard.tsx";
import { InternalCompare } from "./InternalCompare.tsx";
import { RecapTable } from "./RecapTable.tsx";

type Tab = "eligibility" | "recap" | "internal" | "detail";

const STATUS_STYLE: Record<IntakeResult["status"], string> = {
  ok: "text-emerald-700",
  duplicate_file: "text-stone-500",
  id_conflict: "text-amber-700",
  invalid_format: "text-red-700",
};

function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const today = () => new Date().toISOString().slice(0, 10);

export function ReviewerApp() {
  const [intake, setIntake] = useState<IntakeState>(emptyIntake);
  const [log, setLog] = useState<IntakeResult[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [storage, setStorage] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });
  const [tab, setTab] = useState<Tab>("eligibility");
  const [selected, setSelected] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [dragging, setDragging] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const intakeRef = useRef<IntakeState>(intake);
  const intakeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    loadReviews()
      .then(({ reviews: stored, where }) => {
        setReviews(stored);
        setStorage({ ok: true, message: `Skor & catatan tersimpan otomatis di ${where}` });
      })
      .catch((error: Error) => setStorage({ ok: false, message: error.message }));
  }, []);

  const importBackup = async (file: File) => {
    try {
      const restored = parseReviewsBackup(await file.text());
      for (const review of Object.values(restored)) await saveReview(review);
      setReviews((previous) => ({ ...previous, ...restored }));
      setStorage({ ok: true, message: `${Object.keys(restored).length} review dipulihkan dari backup` });
    } catch (error) {
      setStorage({ ok: false, message: (error as Error).message });
    }
  };

  // Files are processed one batch at a time so duplicate detection sees every earlier file.
  const loadFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    intakeQueue.current = intakeQueue.current.then(async () => {
      let state = intakeRef.current;
      const results: IntakeResult[] = [];
      for (const file of list) {
        if (!file.name.toLowerCase().endsWith(".md")) {
          results.push({ fileName: file.name, status: "invalid_format", message: "Bukan file .md" });
          continue;
        }
        const out = intakeFile(state, file.name, await file.text());
        state = out.state;
        results.push(out.result);
      }
      intakeRef.current = state;
      setIntake(state);
      setLog((previous) => [...results, ...previous]);
    });
  };

  const updateReview = useCallback((next: Review) => {
    setReviews((previous) => ({ ...previous, [next.submissionId]: next }));
    clearTimeout(saveTimers.current[next.submissionId]);
    saveTimers.current[next.submissionId] = setTimeout(() => {
      saveReview(next)
        .then(() => setStorage((s) => ({ ...s, ok: true })))
        .catch((error: Error) => setStorage({ ok: false, message: error.message }));
    }, 500);
  }, []);

  const candidates = intake.candidates;
  const repeats = useMemo(() => possibleRepeatSubmissions(candidates), [candidates]);
  const current = candidates.find((c) => c.submissionId === selected) ?? null;

  const openDetail = (sid: string) => {
    setSelected(sid);
    setTab("detail");
    window.scrollTo({ top: 0 });
  };

  const exportsDisabled = candidates.length === 0;

  return (
    <div className="min-h-screen bg-forest-50">
      <header className="bg-forest-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-leaf-300 uppercase">JDS Batch 8 · Rekrutmen</p>
            <h1 className="text-xl font-bold">Dashboard Kelayakan Panitia</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1 text-forest-100">{candidates.length} kandidat</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <p className={`rounded-xl px-4 py-2.5 text-sm ${storage.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {storage.message || "Memuat data review…"} · File jawaban hanya dibaca di perangkat ini dan tidak di-upload ke mana pun.
        </p>

        <div>
          <section className="card space-y-3 p-5">
            <h2 className="font-bold text-forest-900">Muat file jawaban (.md)</h2>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                loadFiles(e.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm ${
                dragging ? "border-leaf-500 bg-leaf-400/10" : "border-stone-300 hover:border-leaf-500"
              }`}
            >
              <span className="font-semibold text-forest-900">Pilih atau seret banyak file sekaligus</span>
              <span className="text-stone-500">File JDS_B8_ASSESSMENT_*.md dari kandidat</span>
              <input
                type="file"
                multiple
                accept=".md,text/markdown"
                aria-label="File asesmen"
                className="sr-only"
                onChange={(event) => {
                  const files = event.target.files ? Array.from(event.target.files) : [];
                  event.target.value = "";
                  loadFiles(files);
                }}
              />
            </label>
            {log.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-auto text-sm" aria-label="Hasil pemuatan file">
                {log.map((entry, i) => (
                  <li key={i} className={STATUS_STYLE[entry.status]}>
                    <span className="font-mono text-xs">{entry.fileName}</span> — {entry.message}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <span className="px-2 text-sm font-semibold text-forest-900">Ekspor CSV (Excel):</span>
          <select aria-label="Pemisah CSV" className="input w-auto py-2 text-sm" value={delimiter} onChange={(e) => setDelimiter(e.target.value as Delimiter)}>
            <option value=",">Koma (,)</option>
            <option value=";">Titik koma (;) — Excel regional Indonesia</option>
          </select>
          <button type="button" className="btn-primary py-2" disabled={exportsDisabled} onClick={() => downloadFile(`JDS_B8_recap_${today()}.csv`, recapCsv(candidates, reviews, delimiter))}>
            Rekap kandidat (CSV)
          </button>
          <button
            type="button"
            className="btn-ghost py-2"
            disabled={exportsDisabled}
            onClick={() => downloadFile(`JDS_B8_external_companies_${today()}.csv`, externalCompaniesCsv(candidates, delimiter))}
          >
            Perusahaan target External (CSV)
          </button>
          <button type="button" className="btn-ghost py-2" disabled={exportsDisabled} onClick={() => downloadFile(`JDS_B8_external_kpi_${today()}.csv`, externalKpiCsv(candidates, delimiter))}>
            Proyeksi KPI External (CSV)
          </button>
          <button
            type="button"
            className="btn-ghost py-2"
            disabled={exportsDisabled}
            onClick={() => downloadFile(`JDS_B8_internal_strategy_${today()}.csv`, internalStrategyCsv(candidates, delimiter))}
          >
            Ringkasan strategi Internal (CSV)
          </button>
          <span className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost py-2"
              onClick={() => downloadFile(`JDS_B8_review_backup_${today()}.json`, reviewsBackup(reviews), "application/json")}
            >
              Backup skor (.json)
            </button>
            <label className="btn-ghost cursor-pointer py-2">
              Pulihkan backup
              <input
                type="file"
                accept=".json,application/json"
                aria-label="File backup skor"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void importBackup(file);
                }}
              />
            </label>
          </span>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-forest-100" aria-label="Tampilan reviewer">
          {(
            [
              ["eligibility", "Dashboard kelayakan"],
              ["recap", "Rekap kandidat"],
              ["internal", "Bandingkan strategi Internal"],
              ["detail", current ? `Detail · ${current.payload.personal.fullName}` : "Detail"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === id ? "border-leaf-500 text-forest-900" : "border-transparent text-stone-500 hover:text-forest-900"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "recap" && <RecapTable candidates={candidates} reviews={reviews} repeats={repeats} conflicts={intake.conflicts} onOpen={openDetail} />}
        {tab === "eligibility" && <EligibilityDashboard candidates={candidates} reviews={reviews} repeats={repeats} onOpen={openDetail} />}
        {tab === "internal" && <InternalCompare candidates={candidates} onOpen={openDetail} />}
        {tab === "detail" &&
          (current ? (
            <Detail
              key={current.submissionId}
              candidate={current}
              review={reviews[current.submissionId] ?? emptyReview(current.submissionId)}
              repeats={repeats[current.submissionId] ?? []}
              conflict={intake.conflicts.includes(current.submissionId)}
              onChange={updateReview}
            />
          ) : (
            <p className="card p-6 text-sm text-stone-500">Pilih kandidat dari Dashboard kelayakan atau Rekap.</p>
          ))}
      </main>
    </div>
  );
}
