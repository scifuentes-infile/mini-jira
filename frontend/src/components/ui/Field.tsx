import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const controlClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:border-primary disabled:bg-surface-container disabled:text-on-surface-variant";

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-on-surface">
      {label}
      <input
        className={`${controlClass} ${error ? "border-error" : ""}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <span className="text-xs font-normal text-error">{error}</span>
      ) : null}
    </label>
  );
}

export function Textarea({
  label,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-on-surface">
      {label}
      <textarea
        className={`${controlClass} min-h-32 resize-y ${error ? "border-error" : ""}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <span className="text-xs font-normal text-error">{error}</span>
      ) : null}
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-on-surface">
      {label}
      <select className={controlClass} {...props}>
        {children}
      </select>
    </label>
  );
}
