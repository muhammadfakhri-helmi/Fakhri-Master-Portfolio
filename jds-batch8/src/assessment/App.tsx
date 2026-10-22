import { ArrowLeft, ArrowRight, CircleAlert, Download, FileText, PencilLine, RotateCcw, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { describeSubmission } from "../lib/describe.ts";
import { assessmentTrack, createInitialAnswers } from "../lib/initial.ts";
import { buildPayload, createAnswerFile, type AnswerFile } from "../lib/payload.ts";
import type { Answers } from "../lib/types.ts";
import { stepsFor, validateAll, validateStep, type StepId } from "../lib/validation.ts";
import { SceneBanner, Sprout } from "./Illustration.tsx";
import { Landing } from "./Landing.tsx";
import { SECTIONS, Shell, type NavState, type SectionId } from "./Shell.tsx";
import { CommitmentStep, RewardLeadershipStep } from "./steps-d.tsx";
import { PersonalStep, SkillsStep, TeamStep } from "./steps-ab.tsx";
import { ExternalObjectiveStep, InternalObjectiveStep } from "./steps-c.tsx";
import type { StepProps, Update } from "./types.ts";

const STEP_META: Record<StepId, { section: SectionId; title: string; render?: (props: StepProps) => ReactNode }> = {
  personal: { section: "A", title: "Personal Background", render: (p) => <PersonalStep {...p} /> },
  skills: { section: "A", title: "Keahlian & Ketersediaan Waktu", render: (p) => <SkillsStep {...p} /> },
  team: { section: "B", title: "Team Preference & Commitment", render: (p) => <TeamStep {...p} /> },
  "internal-objective": { section: "C", title: "Internal Team · Objective & Strategi", render: (p) => <InternalObjectiveStep {...p} /> },
  "external-objective": { section: "C", title: "External Team · Objective & Outreach", render: (p) => <ExternalObjectiveStep {...p} /> },
  "reward-leadership": { section: "D", title: "Reward & Leadership", render: (p) => <RewardLeadershipStep {...p} /> },
  commitment: { section: "D", title: "Accountability & Final Commitment", render: (p) => <CommitmentStep {...p} /> },
  review: { section: "Review", title: "Review & Download" },
};

const SECTION_INTRO: Record<SectionId, string> = {
  A: "Ceritakan latar belakang, kontak, keahlian, dan waktu yang realistis untuk JDS Batch 8.",
  B: "Pilih tim yang paling sesuai dan jelaskan kontribusi nyatamu untuk target bersama.",
  C: "Lima pertanyaan singkat sesuai objective tim pilihanmu.",
  D: "Reward KPI, minat menjadi koordinator, akuntabilitas, dan komitmen akhir.",
  Review: "Periksa kembali jawabanmu, lalu unduh file jawaban (.md).",
};

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

export function App() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [answers, setAnswers] = useState<Answers>(createInitialAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(-1);
  const [showErrors, setShowErrors] = useState(false);
  const [file, setFile] = useState<AnswerFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

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
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const goTo = (index: number) => {
    setPhase("form");
    setStepIndex(index);
    setMaxReached((m) => Math.max(m, index));
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
      const created = file ?? createAnswerFile(answers);
      setFile(created);
      downloadText(created.fileName, created.content);
      setPhase("done");
      window.scrollTo({ top: 0 });
    } catch (error) {
      setFailure((error as Error).message || "File gagal dibuat. Coba lagi dengan browser terbaru.");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setAnswers(createInitialAnswers());
    setFile(null);
    setStepIndex(0);
    setMaxReached(-1);
    setShowErrors(false);
    setPhase("landing");
    window.scrollTo({ top: 0 });
  };

  // Sidebar state: sections already reached can be revisited; later ones stay locked.
  const currentSection = phase === "form" ? meta.section : null;
  const nav = Object.fromEntries(
    SECTIONS.map((s) => {
      const indices = steps.map((id, i) => (STEP_META[id].section === s.id ? i : -1)).filter((i) => i >= 0);
      const first = indices[0] ?? Number.POSITIVE_INFINITY;
      const last = indices.at(-1) ?? Number.POSITIVE_INFINITY;
      let state: NavState = first <= maxReached && phase !== "done" ? "open" : "locked";
      if (s.id === currentSection) state = "current";
      else if (phase === "done" || (state === "open" && last < stepIndex)) state = "done";
      return [s.id, state];
    }),
  ) as Record<SectionId, NavState>;

  const openSection = (id: SectionId) => {
    const index = steps.findIndex((s) => STEP_META[s].section === id);
    if (index >= 0 && index <= maxReached) goTo(index);
  };

  const progress = Math.round((stepIndex / (steps.length - 1)) * 100);

  let content: ReactNode;
  if (phase === "landing") {
    content = <Landing onStart={() => goTo(maxReached >= 0 ? stepIndex : 0)} />;
  } else if (phase === "done" && file) {
    content = <DoneView file={file} onRedownload={() => downloadText(file.fileName, file.content)} onRestart={restart} />;
  } else {
    const track = assessmentTrack(answers);
    content = (
      <main className="mx-auto max-w-4xl px-4 py-5 sm:px-8 sm:py-8">
        <div key={step} className="step-enter space-y-6">
          <SceneBanner size="md">
            <div className="flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-lg">
                <p className="eyebrow">
                  {meta.section === "Review" ? "Review" : `Section ${meta.section}`}
                  {meta.section === "C" && track && answers.team.preference === "flexible" ? " · Flexible" : ""}
                </p>
                <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-[1.75rem] leading-tight font-semibold text-forest-900 outline-none sm:text-[2.15rem]">
                  {meta.title}
                </h2>
                <p className="mt-2 text-[15px] text-[#5b5544]">{SECTION_INTRO[meta.section]}</p>
              </div>
              <div className="w-full shrink-0 rounded-2xl bg-cream-50/90 p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-300/70 md:w-56">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-forest-900">
                    Langkah {stepIndex + 1}/{steps.length}
                  </span>
                  <span className="text-[#857d68] tabular-nums">{progress}%</span>
                </div>
                <div className="progress-track mt-2" role="progressbar" aria-label="Progres asesmen" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <div className="progress-fill transition-[width] duration-500" style={{ width: `${Math.max(progress, 4)}%` }} />
                </div>
              </div>
            </div>
          </SceneBanner>

          {showErrors && errorCount > 0 && (
            <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
              Ada {errorCount} isian yang perlu dilengkapi atau diperbaiki sebelum lanjut.
            </div>
          )}

          {step === "review" ? (
            <ReviewStep
              answers={answers}
              steps={steps}
              incompleteSteps={incompleteSteps}
              busy={busy}
              failure={failure}
              onEdit={(s) => goTo(steps.indexOf(s))}
              onDownload={download}
            />
          ) : (
            meta.render?.({ answers, update, errors })
          )}

          <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Navigasi langkah">
            <button type="button" className="btn-ghost" onClick={() => (stepIndex === 0 ? setPhase("landing") : goTo(stepIndex - 1))}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Previous
            </button>
            {step !== "review" && (
              <button type="button" className="btn-primary px-6" onClick={next}>
                {steps[stepIndex + 1] === "review" ? "Review jawaban" : "Next"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </nav>
        </div>
      </main>
    );
  }

  return (
    <Shell
      home={phase === "landing"}
      nav={nav}
      onHome={() => {
        setPhase("landing");
        window.scrollTo({ top: 0 });
      }}
      onSection={openSection}
      stepLabel={phase === "form" ? `Langkah ${stepIndex + 1}/${steps.length}` : undefined}
    >
      {content}
    </Shell>
  );
}

function DoneView({ file, onRedownload, onRestart }: { file: AnswerFile; onRedownload: () => void; onRestart: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-5 sm:px-8 sm:py-8">
      <div className="step-enter space-y-6">
        <SceneBanner size="md">
          <div className="flex items-center gap-4 p-6 sm:p-8">
            <Sprout className="size-16 shrink-0" />
            <div>
              <p className="eyebrow">Asesmen selesai</p>
              <h1 className="mt-1 text-[1.9rem] leading-tight font-semibold text-forest-900 sm:text-[2.3rem]">File jawaban berhasil dibuat</h1>
              <p className="mt-1 text-[15px] text-[#5b5544]">Terima kasih sudah meluangkan waktu untuk JDS Batch 8.</p>
            </div>
          </div>
        </SceneBanner>
        <section className="card p-6 sm:p-8">
          <dl className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-2xl bg-forest-900 p-4 text-cream-50">
              <FileText className="size-6 shrink-0 text-leaf-300" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold tracking-[0.16em] text-leaf-300 uppercase">Nama file</dt>
                <dd className="font-mono text-sm break-all">{file.fileName}</dd>
              </div>
            </div>
            <div className="rounded-2xl bg-cream-100 p-4">
              <dt className="text-[11px] font-semibold tracking-[0.16em] text-[#857d68] uppercase">Submission ID</dt>
              <dd className="font-display text-2xl font-semibold text-forest-900">{file.submissionId}</dd>
            </div>
          </dl>
          <h2 className="card-title mt-8">
            <Send className="size-5 text-leaf-600" aria-hidden="true" />
            Langkah berikutnya
          </h2>
          <ol className="mt-3 space-y-2.5 text-[15px] text-[#5b5544]">
            {[
              "Pastikan file di atas sudah tersimpan di folder unduhan perangkatmu.",
              "Kirim file tersebut secara manual melalui kanal resmi yang diberikan panitia.",
              "Jangan mengubah isi file, terutama blok data di bagian akhir, agar jawabanmu tetap terbaca oleh panitia.",
              "Catat Submission ID untuk konfirmasi bila diperlukan.",
            ].map((text, i) => (
              <li key={text} className="flex gap-3">
                <span className="font-display grid size-7 shrink-0 place-items-center rounded-full bg-leaf-100 text-sm font-semibold text-forest-800">{i + 1}</span>
                <span className="pt-0.5">{text}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-primary" onClick={onRedownload}>
              <Download className="size-4" aria-hidden="true" />
              Unduh ulang file (.md)
            </button>
            <button type="button" className="btn-ghost" onClick={onRestart}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Hapus jawaban dari halaman ini
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function ReviewStep({
  answers,
  steps,
  incompleteSteps,
  busy,
  failure,
  onEdit,
  onDownload,
}: {
  answers: Answers;
  steps: StepId[];
  incompleteSteps: StepId[];
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
      {incompleteSteps.length > 0 && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
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
          <header className="flex items-center justify-between gap-3 border-b border-cream-300/70 bg-cream-100/70 px-5 py-3">
            <h3 className="text-[1.05rem] font-semibold text-forest-900">{section.title}</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-leaf-700 hover:bg-leaf-100"
              onClick={() => onEdit(section.step)}
            >
              <PencilLine className="size-3.5" aria-hidden="true" />
              Ubah
            </button>
          </header>
          <dl className="divide-y divide-cream-200">
            {section.items.map((item, i) => (
              <div key={i} className="grid gap-1 px-5 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                <dt className="text-sm font-medium text-[#857d68]">{item.label}</dt>
                <dd className="text-[15px] whitespace-pre-line text-ink [overflow-wrap:anywhere]">
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

      <section className="card space-y-4 p-6 sm:p-7">
        <h3 className="card-title">
          <FileText className="size-5 text-leaf-600" aria-hidden="true" />
          Unduh file jawaban
        </h3>
        <p className="text-[15px] leading-relaxed text-[#5b5544]">
          Seluruh jawabanmu disimpan dalam satu file Markdown (<code className="font-semibold text-forest-800">.md</code>) yang dapat dibuka dengan aplikasi teks apa pun. Setelah
          diunduh, kirim file tersebut melalui kanal resmi yang diberikan panitia.
        </p>
        {failure && (
          <p role="alert" className="error-text">
            {failure}
          </p>
        )}
        <button type="button" className="btn-accent w-full px-7 py-3.5 text-base sm:w-auto" disabled={busy || incompleteSteps.length > 0} onClick={onDownload}>
          <Download className="size-4.5" aria-hidden="true" />
          {busy ? "Menyiapkan file…" : "Download Assessment (.md)"}
        </button>
      </section>
    </div>
  );
}
