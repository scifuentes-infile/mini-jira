import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

export function SearchInput({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
        size={18}
        aria-hidden="true"
      />
      <input
        aria-label={label}
        className="h-10 w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container"
        {...props}
      />
    </label>
  );
}
