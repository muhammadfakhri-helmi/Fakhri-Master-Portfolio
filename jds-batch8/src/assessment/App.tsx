import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RECRUITMENT_LEAD } from "../lib/content.ts";
import { describeSubmission } from "../lib/describe.ts";
import { assessmentTrack, createInitialAnswers } from "../lib/initial.ts";
import { buildPayload, createEncryptedAssessment, type EncryptedFile, type RecipientKey } from "../lib/payload.ts";
import type { Answers } from "../lib/types.ts";
import { stepsFor, validateAll, validateStep, type StepId } from "../lib/validation.ts";
import { Landing } from "./Landing.tsx";
import { LogoMark } from "./Logo.tsx";
import { CommitmentStep, RewardLeadershipStep } from "./steps-d.tsx";
import { PersonalStep, SkillsStep, TeamStep } from "./steps-ab.tsx";
import { ExternalCompaniesStep, ExternalFirst30Step, ExternalKpiStep, ExternalOutreachStep, ExternalProspectsStep } from "./steps-external.tsx";
import { InternalDeliverablesStep, InternalExecutionStep, InternalRecoveryStep, InternalStrategyStep } from "./steps-internal.tsx";
import type { StepProps, Update } from "./types.ts";

const STEP_META: Record<StepId, { section: "A" | "B" | "C" | "D" | "Review"; title: string; render?: (props: StepProps) => ReactNode }> = {
  personal: { section: "A", title: "Personal Background", render: (p) => <PersonalStep {...p} /> },
  skills: { section: "A", title: "Keahlian & Ketersediaan Waktu", render: (p) => <SkillsStep {...p} /> },
  team: { section: "B", title: "Team Preference & Commitment", render: (p) => <TeamStep {...p} /> },
  "internal-strategy": { section: "C", title: "Internal · Main Recruitment Strategy", render: (p) => <InternalStrategyStep {...p} /> },
  "internal-execution": { section: "C", title: "Internal · Execution & Coordination", render: (p) => <InternalExecutionStep {...p} /> },
  "internal-recovery": { section: "C", title: "Internal · Recovery Strategy", render: (p) => <InternalRecoveryStep {...p} /> },
  "internal-deliverables": { section: "C", title: "Internal · Personal Contribution", render: (p) => <InternalDeliverablesStep {...p} /> },
  "external-companies": { section: "C", title: "External · Target Company Mapping", render: (p) => <ExternalCompaniesStep {...p} /> },
  "external-prospects": { section: "C", title: "External · Personal Candidate Target", render: (p) => <ExternalProspectsStep {...p} /> },
  "external-kpi": { section: "C", title: "External · Personal Recruitment KPI", render: (p) => <ExternalKpiStep {...p} /> },
  "external-outreach": { section: "C", title: "External · Outreach Simulation", render: (p) => <ExternalOutreachStep {...p} /> },
  "external-first30": { section: "C", title: "External · First 30 Days", render: (p) => <ExternalFirst30Step {...p} /> },
  "reward-leadership": { section: "D", title: "Reward & Leadership", render: (p) => <RewardLeadershipStep {...p} /> },
  commitment: { section: "D", title: "Accountability & Final Commitment", render: (p) => <CommitmentStep {...p} /> },
  review: { section: "Review", title: "Review & Download" },
};

const SECTION_LABELS = [
  { id: "A", label: "Personal" },
  { id: "B", label: "Tim" },
  { id: "C", label: "Studi Kasus" },
  { id: "D", label: "Komitmen" },
  { id: "Review", label: "Review" },
] as const;

type Phase = "landing" | "form" | "done";

function downloadText(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function App({ recipientKey }: { recipientKey: RecipientKey }) {
  const [phase, setPhase] = useState<Phase>("landing");
  const [answers, setAnswers] = useState<Answers>(createInitialAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [file, setFile] = useState<EncryptedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const keyReady = recipientKey.configured && !!recipientKey.spki;

  const update: Update = useCallback((mutate) => {
    setAnswers((previous) => {
      const next = structuredClone(previous);
      mutate(next);
      return next;
    });
  }, []);

  const steps = useMemo(() => stepsFor(answers), [answers]);
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;
  const meta = STEP_META[step];
  const errors = useMemo(() => (showErrors ? validateStep(step, answers) : {}), [showErrors, step, answers]);
  const errorCount = Object.keys(errors).length;

  // Answers live only in memory: warn before the tab is closed or reloaded.
  useEffect(() => {
    if (phase !== "form") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const goTo = (index: number) => {
    setStepIndex(index);
    setShowErrors(false);
    setFailure("");
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = () => {
    const stepErrors = validateStep(step, answers);
    if (Object.keys(stepErrors).length) {
      setShowErrors(true);
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.scrollIntoView({ block: "center" });
        first?.focus({ preventScroll: true });
      });
      return;
    }
    goTo(stepIndex + 1);
  };

  const allErrors = useMemo(() => (step === "review" ? validateAll(answers) : {}), [step, answers]);
  const incompleteSteps = Object.keys(allErrors) as StepId[];

  const download = async () => {
    if (incompleteSteps.length) return;
    setBusy(true);
    setFailure("");
    try {
      const encrypted = file ?? (await createEncryptedAssessment(answers, recipientKey));
      setFile(encrypted);
      downloadText(encrypted.fileName, encrypted.content);
      setPhase("done");
      window.scrollTo({ top: 0 });
    } catch (error) {
      setFailure((error as Error).message || "Enkripsi gagal. Coba lagi dengan browser terbaru.");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setAnswers(createInitialAnswers());
    setFile(null);
    setStepIndex(0);
    setShowErrors(false);
    setPhase("landing");
    window.scrollTo({ top: 0 });
  };

  if (phase === "landing") {
    return (
      <>
        <Landing keyReady={keyReady} keyId={recipientKey.keyId} onStart={() => (setPhase("form"), goTo(0))} />
        <Footer />
      </>
    );
  }

  if (phase === "done" && file) {
    return (
      <div className="min-h-screen bg-navy-50">
        <TopBar />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="card step-enter p-6 sm:p-9">
            <p className="text-sm font-bold tracking-[0.16em] text-accent-700 uppercase">Asesmen selesai</p>
            <h1 className="mt-2 text-2xl font-bold text-navy-900 sm:text-3xl">File terenkripsi berhasil dibuat</h1>
            <dl className="mt-6 grid gap-3 rounded-2xl bg-navy-900 p-5 text-sm text-navy-100 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-accent-300">Nama file</dt>
                <dd className="font-mono break-all text-white">{file.fileName}</dd>
              </div>
              <div>
                <dt className="text-xs text-accent-300">Submission ID</dt>
                <dd className="font-mono text-lg font-bold text-white">{file.submissionId}</dd>
              </div>
            </dl>
            <h2 className="mt-8 font-semibold text-navy-900">Langkah berikutnya</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] text-slate-600">
              <li>Pastikan file di atas sudah tersimpan di folder unduhan perangkatmu.</li>
              <li>
                Kirim file tersebut <strong>secara manual</strong> kepada <strong>{RECRUITMENT_LEAD}</strong> (Ketua Rekrutmen JDS Batch 8) melalui kanal resmi yang diberikan panitia.
              </li>
              <li>Jangan mengubah isi file. Perubahan sekecil apa pun membuat file tidak dapat dibuka.</li>
              <li>Catat Submission ID untuk konfirmasi bila diperlukan.</li>
            </ol>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn-primary" onClick={() => downloadText(file.fileName, file.content)}>
                Unduh ulang file (.md)
              </button>
              <button type="button" className="btn-ghost" onClick={restart}>
                Hapus jawaban dari halaman ini
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentSection = meta.section;
  const progress = Math.round((stepIndex / (steps.length - 1)) * 100);
  const track = assessmentTrack(answers);

  return (
    <div className="min-h-screen bg-navy-50">
      <TopBar />
      <div className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <ol className="flex items-center justify-between gap-1 text-[11px] font-semibold sm:text-xs" aria-label="Bagian asesmen">
            {SECTION_LABELS.map((s) => {
              const sectionIndex = SECTION_LABELS.findIndex((x) => x.id === currentSection);
              const index = SECTION_LABELS.findIndex((x) => x.id === s.id);
              const state = index < sectionIndex ? "done" : index === sectionIndex ? "current" : "todo";
              return (
                <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1.5" aria-current={state === "current" ? "step" : undefined}>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] ${
                      state === "done" ? "bg-accent-500 text-white" : state === "current" ? "bg-navy-900 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {state === "done" ? "✓" : s.id === "Review" ? "R" : s.id}
                  </span>
                  <span className={`hidden truncate sm:inline ${state === "todo" ? "text-slate-400" : "text-navy-900"}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
          <div className="mt-2.5 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="Progres asesmen"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div className="h-full rounded-full bg-accent-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              Langkah {stepIndex + 1}/{steps.length}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pt-7 pb-16 sm:px-6 sm:pt-10">
        <div key={step} className="step-enter">
          <p className="text-sm font-bold tracking-[0.16em] text-accent-700 uppercase">
            {currentSection === "Review" ? "Review" : `Section ${currentSection}`}
            {currentSection === "C" && track && answers.team.preference === "flexible" ? " · Flexible" : ""}
          </p>
          <h2 ref={headingRef} tabIndex={-1} className="mt-1.5 mb-6 text-2xl font-bold text-navy-900 outline-none sm:text-3xl">
            {meta.title}
          </h2>

          {showErrors && errorCount > 0 && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Ada {errorCount} isian yang perlu dilengkapi atau diperbaiki sebelum lanjut.
            </div>
          )}

          {step === "review" ? (
            <ReviewStep
              answers={answers}
              steps={steps}
              incompleteSteps={incompleteSteps}
              keyId={recipientKey.keyId}
              keyReady={keyReady}
              busy={busy}
              failure={failure}
              onEdit={(s) => goTo(steps.indexOf(s))}
              onDownload={download}
            />
          ) : (
            meta.render?.({ answers, update, errors })
          )}

          <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Navigasi langkah">
            <button type="button" className="btn-ghost" onClick={() => (stepIndex === 0 ? setPhase("landing") : goTo(stepIndex - 1))}>
              ← Previous
            </button>
            {step !== "review" && (
              <button type="button" className="btn-primary" onClick={next}>
                {steps[stepIndex + 1] === "review" ? "Review jawaban" : "Next"} →
              </button>
            )}
          </nav>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ReviewStep({
  answers,
  steps,
  incompleteSteps,
  keyId,
  keyReady,
  busy,
  failure,
  onEdit,
  onDownload,
}: {
  answers: Answers;
  steps: StepId[];
  incompleteSteps: StepId[];
  keyId: string;
  keyReady: boolean;
  busy: boolean;
  failure: string;
  onEdit: (step: StepId) => void;
  onDownload: () => void;
}) {
  const sections = useMemo(() => {
    try {
      return describeSubmission(buildPayload(answers, "PREVIEW"));
    } catch {
      return [];
    }
  }, [answers]);

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-slate-600">Periksa kembali seluruh jawabanmu. Gunakan tombol “Ubah” untuk memperbaiki bagian tertentu sebelum mengunduh file terenkripsi.</p>
      {incompleteSteps.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Masih ada bagian yang belum lengkap:</p>
          <ul className="mt-2 space-y-1">
            {incompleteSteps.map((s) => (
              <li key={s}>
                <button type="button" className="font-medium underline underline-offset-2" onClick={() => onEdit(steps.includes(s) ? s : "team")}>
                  {STEP_META[s].title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sections.map((section) => (
        <section key={section.step} className="card overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-navy-100 bg-navy-50/70 px-5 py-3">
            <h3 className="font-semibold text-navy-900">{section.title}</h3>
            <button type="button" className="rounded-lg px-2.5 py-1 text-sm font-semibold text-accent-700 hover:bg-accent-400/10" onClick={() => onEdit(section.step)}>
              Ubah
            </button>
          </header>
          <dl className="divide-y divide-slate-100">
            {section.items.map((item, i) => (
              <div key={i} className="grid gap-1 px-5 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
                <dd className="text-[15px] whitespace-pre-line text-slate-800 [overflow-wrap:anywhere]">
                  {Array.isArray(item.value) ? (
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

      <div className="card space-y-4 border-accent-500/40 p-5 sm:p-7">
        <h3 className="text-lg font-bold text-navy-900">Enkripsi & unduh</h3>
        <p className="text-[15px] text-slate-600">
          Saat tombol ditekan, seluruh identitas dan jawaban dienkripsi di perangkatmu dengan AES-256-GCM, lalu kunci AES dienkripsi dengan kunci publik Ketua Rekrutmen (RSA-OAEP SHA-256).
          File tidak berisi jawaban dalam bentuk teks biasa.
        </p>
        {keyReady && (
          <p className="text-sm text-slate-500">
            ID kunci penerima: <span className="font-mono font-semibold text-navy-900">{keyId}</span>
          </p>
        )}
        {failure && (
          <p role="alert" className="error-text">
            {failure}
          </p>
        )}
        <button type="button" className="btn-accent w-full py-3.5 text-base sm:w-auto" disabled={busy || !keyReady || incompleteSteps.length > 0} onClick={onDownload}>
          {busy ? "Mengenkripsi…" : "Download Assessment (.md)"}
        </button>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="bg-navy-900 text-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        <LogoMark size={32} />
        <p className="text-sm leading-tight font-semibold">
          JDS Batch 8 <span className="font-normal text-navy-100/70">· Recruitment Committee Assessment</span>
        </p>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-slate-500 sm:px-6">
        <p>JDS Batch 8 · Recruitment Committee Assessment V2 · Ketua Rekrutmen: {RECRUITMENT_LEAD}</p>
        <p>Logo pada halaman ini adalah placeholder sementara, bukan logo resmi Jakarta Drilling Society. Website ini tidak mengirim data ke server mana pun.</p>
      </div>
    </footer>
  );
}
