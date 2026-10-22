import { useId, type ReactNode } from "react";
import type { Option } from "../lib/content.ts";
import { LIMITS } from "../lib/validation.ts";

export const fieldId = (key: string) => `f-${key.replace(/[^a-zA-Z0-9]+/g, "-")}`;

interface FieldShellProps {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

function FieldShell({ id, label, help, error, optional, children, footer }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="ml-2 text-xs font-medium text-slate-400">(opsional)</span>}
      </label>
      {help && (
        <p id={`${id}-help`} className="help !mt-0">
          {help}
        </p>
      )}
      {children}
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
}

export function TextField({ name, label, value, onChange, error, help, placeholder, optional, type = "text", inputMode, autoComplete = "off", maxLength = LIMITS.short }: TextFieldProps) {
  const id = fieldId(name);
  return (
    <FieldShell id={id} label={label} help={help} error={error} optional={optional}>
      <input
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

export function TextArea({ name, label, value, onChange, error, help, placeholder, optional, min, rows = 4, maxLength = LIMITS.essay }: TextAreaProps) {
  const id = fieldId(name);
  const count = value.trim().length;
  const counter = (
    <span className={`shrink-0 pt-1.5 text-xs tabular-nums ${min && count < min ? "text-slate-400" : "text-accent-700"}`} aria-live="off">
      {count}
      {min ? ` / min ${min}` : ""} karakter
    </span>
  );
  return (
    <FieldShell id={id} label={label} help={help} error={error} optional={optional} footer={counter}>
      <textarea
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
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-400">{suffix}</span>}
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
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                checked ? "border-accent-500 bg-accent-400/10 ring-1 ring-accent-500" : "border-slate-200 bg-white hover:border-navy-600/40"
              } ${error && !value ? "border-red-300" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4.5 shrink-0 accent-accent-600"
              />
              <span>
                <span className="block text-[15px] font-medium text-navy-900">{option.label}</span>
                {option.hint && <span className="mt-0.5 block text-sm text-slate-500">{option.hint}</span>}
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
      <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${error ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white"}`}>
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-4.5 shrink-0 accent-accent-600"
        />
        <span className="text-[15px] text-slate-700">{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warning" | "navy"; title?: ReactNode; children: ReactNode }) {
  const styles = {
    info: "border-accent-500/30 bg-accent-400/10 text-navy-900",
    warning: "border-amber-300 bg-amber-50 text-amber-950",
    navy: "border-navy-800 bg-navy-900 text-white",
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
      <header className="space-y-2">
        <p className="text-xs font-bold tracking-[0.16em] text-accent-700 uppercase">{number}</p>
        <h3 id={headingId} className="text-lg leading-snug font-bold text-navy-900 sm:text-xl">
          {title}
        </h3>
        {intro && <div className="space-y-2 text-[15px] leading-relaxed text-slate-600">{intro}</div>}
      </header>
      {children}
    </section>
  );
}

export function RepeaterCard({ title, onRemove, removable, children }: { title: string; onRemove: () => void; removable: boolean; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-navy-50/60 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-navy-900">{title}</p>
        {removable && (
          <button type="button" onClick={onRemove} className="rounded-lg px-2.5 py-1 text-sm font-medium text-red-600 hover:bg-red-50">
            Hapus
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
