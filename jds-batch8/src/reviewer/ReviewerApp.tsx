import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Delimiter } from "../lib/csv.ts";
import { emptyIntake, intakeFile, possibleRepeatSubmissions, type IntakeResult, type IntakeState } from "../lib/intake.ts";
import { isProtectedKeyFile, loadPrivateKey, type LoadedPrivateKey } from "../lib/private-key.ts";
import { externalCompaniesCsv, externalKpiCsv, internalStrategyCsv, recapCsv } from "../lib/recap.ts";
import { emptyReview, type Review } from "../lib/scoring.ts";
import { loadReviews, saveReview, serverAvailable } from "./api.ts";
import { Dashboard } from "./Dashboard.tsx";
import { Detail } from "./Detail.tsx";
import { InternalCompare } from "./InternalCompare.tsx";
import { RecapTable } from "./RecapTable.tsx";

type Tab = "recap" | "dashboard" | "internal" | "detail";

const STATUS_STYLE: Record<IntakeResult["status"], string> = {
  ok: "text-emerald-700",
  duplicate_file: "text-slate-500",
  id_conflict: "text-amber-700",
  wrong_key: "text-red-700",
  tampered: "text-red-700",
  invalid_format: "text-red-700",
};

function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const today = () => new Date().toISOString().slice(0, 10);

export function ReviewerApp() {
  const [keyText, setKeyText] = useState<string | null>(null);
  const [keyFileName, setKeyFileName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [privateKey, setPrivateKey] = useState<LoadedPrivateKey | null>(null);
  const [keyError, setKeyError] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [intake, setIntake] = useState<IntakeState>(emptyIntake);
  const [log, setLog] = useState<IntakeResult[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [storage, setStorage] = useState<{ ok: boolean; message: string }>({ ok: false, message: "" });
  const [tab, setTab] = useState<Tab>("recap");
  const [selected, setSelected] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [dragging, setDragging] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const intakeRef = useRef<IntakeState>(intake);
  const intakeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!serverAvailable()) {
      setStorage({ ok: false, message: "Server reviewer lokal tidak terdeteksi — skor hanya tersimpan selama tab ini terbuka. Jalankan dengan: npm run reviewer" });
      return;
    }
    loadReviews()
      .then(({ reviews: stored, dataFile }) => {
        setReviews(stored);
        setStorage({ ok: true, message: `Review tersimpan otomatis di ${dataFile}` });
      })
      .catch((error: Error) => setStorage({ ok: false, message: error.message }));
  }, []);

  const unlockKey = async () => {
    if (!keyText) return;
    setKeyBusy(true);
    setKeyError("");
    try {
      setPrivateKey(await loadPrivateKey(keyText, passphrase || undefined));
      setKeyText(null);
      setPassphrase("");
    } catch (error) {
      setKeyError((error as Error).message);
    } finally {
      setKeyBusy(false);
    }
  };

  // Files are processed one batch at a time so duplicate detection sees every earlier file.
  const loadFiles = (files: FileList | File[]) => {
    const key = privateKey;
    const list = Array.from(files);
    if (!key) return;
    intakeQueue.current = intakeQueue.current.then(async () => {
      let state = intakeRef.current;
      const results: IntakeResult[] = [];
      for (const file of list) {
        if (!file.name.toLowerCase().endsWith(".md")) {
          results.push({ fileName: file.name, status: "invalid_format", message: "Bukan file .md" });
          continue;
        }
        const out = await intakeFile(state, file.name, await file.text(), key);
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
    if (!serverAvailable()) return;
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
    <div className="min-h-screen bg-navy-50">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-accent-300 uppercase">JDS Batch 8 · Rekrutmen</p>
            <h1 className="text-xl font-bold">Private Reviewer (lokal)</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 font-semibold ${privateKey ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-navy-100"}`}>
              {privateKey ? `Kunci dimuat · ${privateKey.keyId}` : "Kunci privat belum dimuat"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-navy-100">{candidates.length} kandidat</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <p className={`rounded-xl px-4 py-2.5 text-sm ${storage.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {storage.message || "Menghubungkan ke server lokal…"} · Jawaban yang didekripsi hanya ada di memori tab ini.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card space-y-3 p-5">
            <h2 className="font-bold text-navy-900">1 · Muat kunci privat</h2>
            {privateKey ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Kunci aktif: <span className="font-mono font-semibold text-navy-900">{privateKey.keyId}</span> (non-extractable, hanya di memori)
                </p>
                <button type="button" className="btn-ghost py-2" onClick={() => setPrivateKey(null)}>
                  Lepas kunci
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  aria-label="File kunci privat"
                  accept=".json,.pem,application/json"
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-white"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setKeyFileName(file.name);
                    setKeyError("");
                    setKeyText(await file.text());
                  }}
                />
                {keyText && (
                  <form
                    className="flex flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void unlockKey();
                    }}
                  >
                    {isProtectedKeyFile(keyText) && (
                      <input
                        type="password"
                        aria-label="Passphrase kunci privat"
                        className="input"
                        autoComplete="off"
                        placeholder="Passphrase kunci"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                      />
                    )}
                    <button type="submit" className="btn-primary" disabled={keyBusy}>
                      {keyBusy ? "Membuka…" : `Buka ${keyFileName}`}
                    </button>
                  </form>
                )}
                {keyError && (
                  <p className="error-text" role="alert">
                    {keyError}
                  </p>
                )}
              </>
            )}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-bold text-navy-900">2 · Muat file asesmen (.md)</h2>
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
                privateKey ? (dragging ? "border-accent-500 bg-accent-400/10" : "border-slate-300 hover:border-accent-500") : "cursor-not-allowed border-slate-200 text-slate-400"
              }`}
            >
              <span className="font-semibold text-navy-900">Pilih atau seret banyak file sekaligus</span>
              <span className="text-slate-500">{privateKey ? "File JDS_B8_ASSESSMENT_*.md" : "Muat kunci privat terlebih dahulu"}</span>
              <input
                type="file"
                multiple
                accept=".md,text/markdown"
                aria-label="File asesmen"
                className="sr-only"
                disabled={!privateKey}
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
          <span className="px-2 text-sm font-semibold text-navy-900">Ekspor CSV (Excel):</span>
          <select aria-label="Pemisah CSV" className="input w-auto py-2 text-sm" value={delimiter} onChange={(e) => setDelimiter(e.target.value as Delimiter)}>
            <option value=",">Koma (,)</option>
            <option value=";">Titik koma (;) — Excel regional Indonesia</option>
          </select>
          <button type="button" className="btn-primary py-2" disabled={exportsDisabled} onClick={() => downloadCsv(`JDS_B8_recap_${today()}.csv`, recapCsv(candidates, reviews, delimiter))}>
            Rekap kandidat (CSV)
          </button>
          <button
            type="button"
            className="btn-ghost py-2"
            disabled={exportsDisabled}
            onClick={() => downloadCsv(`JDS_B8_external_companies_${today()}.csv`, externalCompaniesCsv(candidates, delimiter))}
          >
            Perusahaan target External (CSV)
          </button>
          <button type="button" className="btn-ghost py-2" disabled={exportsDisabled} onClick={() => downloadCsv(`JDS_B8_external_kpi_${today()}.csv`, externalKpiCsv(candidates, delimiter))}>
            Proyeksi KPI External (CSV)
          </button>
          <button
            type="button"
            className="btn-ghost py-2"
            disabled={exportsDisabled}
            onClick={() => downloadCsv(`JDS_B8_internal_strategy_${today()}.csv`, internalStrategyCsv(candidates, delimiter))}
          >
            Ringkasan strategi Internal (CSV)
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-b border-navy-100" aria-label="Tampilan reviewer">
          {(
            [
              ["recap", "Rekap kandidat"],
              ["dashboard", "Dashboard target"],
              ["internal", "Bandingkan strategi Internal"],
              ["detail", current ? `Detail · ${current.payload.personal.fullName}` : "Detail"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === id ? "border-accent-500 text-navy-900" : "border-transparent text-slate-500 hover:text-navy-900"}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "recap" && <RecapTable candidates={candidates} reviews={reviews} repeats={repeats} conflicts={intake.conflicts} onOpen={openDetail} />}
        {tab === "dashboard" && <Dashboard candidates={candidates} reviews={reviews} />}
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
            <p className="card p-6 text-sm text-slate-500">Pilih kandidat dari tab Rekap.</p>
          ))}
      </main>
    </div>
  );
}
