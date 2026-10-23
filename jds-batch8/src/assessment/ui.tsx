import { ClipboardX } from "lucide-react";
import { useId, type ReactNode } from "react";
import type { Option } from "../lib/content.ts";
import { LIMITS } from "../lib/validation.ts";
import { PASTE_BLOCKED_MESSAGE, useNoPaste } from "./paste-guard.tsx";

export const fieldId = (key: string) => `f-${key.replace(/[^a-zA-Z0-9]+/g, "-")}`;

interface FieldShellProps {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  pasteBlocked?: boolean;
}

function FieldShell({ id, label, help, error, optional, children, footer, pasteBlocked }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="ml-2 rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-medium text-[#7d7562]">opsional</span>}
      </label>
      {help && (
        <p id={`${id}-help`} className="help !mt-0">
          {help}
        </p>
      )}
      {children}
      {pasteBlocked && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
          <ClipboardX className="size-4 shrink-0" aria-hidden="true" />
          {PASTE_BLOCKED_MESSAGE}
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} className="error-text" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        {footer}
      </div>
    </div>
  );
}

const describedBy = (id: string, help?: ReactNode, error?: string) =>
  [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

interface TextFieldProps {
  name: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: ReactNode;
  placeholder?: string;
  optional?: boolean;
  type?: "text" | "email" | "tel";
  inputMode?: "numeric" | "decimal" | "text" | "email" | "tel";
  autoComplete?: string;
  maxLength?: number;
  /** Block pasting/dropping text (answer fields). */
  noPaste?: boolean;
}

export function TextField({ name, label, value, onChange, error, help, placeholder, optional, type = "text", inputMode, autoComplete = "off", maxLength = LIMITS.short, noPaste = false }: TextFieldProps) {
  const id = fieldId(name);
  const guard = useNoPaste(name, noPaste);
  return (
    <FieldShell id={id} label={label} help={help} error={error} optional={optional} pasteBlocked={guard.blocked}>
      <input
        {...guard.inputProps}
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="input"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, help, error)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends Omit<TextFieldProps, "type" | "inputMode" | "autoComplete"> {
  min?: number;
  rows?: number;
}

/** Free-text answer. Pasting is blocked unless noPaste is set to false. */
export function TextArea({ name, label, value, onChange, error, help, placeholder, optional, min, rows = 4, maxLength = LIMITS.essay, noPaste = true }: TextAreaProps) {
  const id = fieldId(name);
  const guard = useNoPaste(name, noPaste);
  const count = value.trim().length;
  const counter = (
    <span className={`shrink-0 pt-1.5 text-xs tabular-nums ${min && count < min ? "text-[#a49a82]" : "font-semibold text-leaf-700"}`} aria-live="off">
      {count}
      {min ? ` / min ${min}` : ""} karakter
    </span>
  );
  return (
    <FieldShell id={id} label={label} help={help} error={error} optional={optional} footer={counter} pasteBlocked={guard.blocked}>
      <textarea
        {...guard.inputProps}
        id={id}
        name={name}
        rows={rows}
        className="input min-h-24 resize-y leading-relaxed"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, help, error)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

interface NumberFieldProps {
  name: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: ReactNode;
  suffix?: string;
  decimal?: boolean;
}

export function NumberField({ name, label, value, onChange, error, help, suffix, decimal }: NumberFieldProps) {
  const id = fieldId(name);
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          className={`input tabular-nums ${suffix ? "pr-14" : ""}`}
          value={value}
          maxLength={6}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, help, error)}
          onChange={(event) => onChange(event.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, ""))}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-[#a49a82]">{suffix}</span>}
      </div>
    </FieldShell>
  );
}

interface ChoiceProps<T extends string> {
  name: string;
  legend: ReactNode;
  options: Option<T>[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string;
  help?: ReactNode;
  columns?: 1 | 2;
}

export function RadioCards<T extends string>({ name, legend, options, value, onChange, error, help, columns = 1 }: ChoiceProps<T>) {
  const id = fieldId(name);
  return (
    <fieldset id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, help, error)} tabIndex={-1} className="space-y-2 outline-none">
      <legend className="label">{legend}</legend>
      {help && (
        <p id={`${id}-help`} className="help !mt-0">
          {help}
        </p>
      )}
      <div className={`grid gap-2.5 pt-1 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all duration-150 ${
                checked ? "border-forest-600 bg-leaf-100/80 shadow-[0_4px_14px_-8px_rgb(70_97_61/0.6)] ring-1 ring-forest-600" : "border-cream-300 bg-white/70 hover:border-forest-500/50 hover:bg-white"
              } ${error && !value ? "border-red-300" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4.5 shrink-0 accent-leaf-600"
              />
              <span>
                <span className="block text-[15px] font-medium text-forest-900">{option.label}</span>
                {option.hint && <span className="mt-0.5 block text-sm text-[#7d7562]">{option.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="error-text" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface SelectProps<T extends string> {
  name: string;
  label: ReactNode;
  options: Option<T>[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string;
}

export function Select<T extends string>({ name, label, options, value, onChange, error }: SelectProps<T>) {
  const id = fieldId(name);
  return (
    <FieldShell id={id} label={label} error={error}>
      <select
        id={id}
        name={name}
        className="input"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, undefined, error)}
        onChange={(event) => onChange(event.target.value as T)}
      >
        <option value="">Pilih…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface CheckboxProps {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
}

export function Checkbox({ name, checked, onChange, children, error }: CheckboxProps) {
  const id = fieldId(name);
  return (
    <div>
      <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 ${error ? "border-red-300 bg-red-50/50" : "border-cream-300 bg-white/70"}`}>
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-4.5 shrink-0 accent-leaf-600"
        />
        <span className="text-[15px] text-ink">{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warning" | "dark"; title?: ReactNode; children: ReactNode }) {
  const styles = {
    info: "border-leaf-300 bg-leaf-100/70 text-forest-900",
    warning: "border-amber-300 bg-amber-50 text-amber-950",
    dark: "border-forest-800 bg-forest-900 text-cream-50",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 text-[15px] leading-relaxed sm:p-5 ${styles}`}>
      {title && <p className="mb-1.5 font-semibold">{title}</p>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function QuestionBlock({ number, title, children, intro }: { number: string; title: ReactNode; intro?: ReactNode; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="card space-y-5 p-5 sm:p-7">
      <header className="flex items-start gap-3.5">
        <span className="font-display grid size-11 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-[15px] font-semibold text-forest-800 ring-1 ring-leaf-300/70" aria-hidden="true">
          {number.split(" ")[0]}
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="eyebrow">{number}</p>
          <h3 id={headingId} className="text-[1.2rem] leading-snug font-semibold text-forest-900 sm:text-[1.35rem]">
            {title}
          </h3>
          {intro && <div className="space-y-2 text-[15px] leading-relaxed text-[#5b5544]">{intro}</div>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function RepeaterCard({ title, onRemove, removable, children }: { title: string; onRemove: () => void; removable: boolean; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-[1.25rem] border border-cream-300 bg-cream-100/70 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[1.05rem] font-semibold text-forest-900">{title}</p>
        {removable && (
          <button type="button" onClick={onRemove} className="rounded-full px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50">
            Hapus
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
