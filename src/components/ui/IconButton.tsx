import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  label,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-transparent text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:text-outline ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
