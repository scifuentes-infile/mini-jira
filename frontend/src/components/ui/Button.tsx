import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "border-primary bg-primary text-on-primary hover:bg-primary-container disabled:bg-surface-dim disabled:text-on-surface-variant",
  secondary:
    "border-primary bg-surface-container-lowest text-primary hover:bg-primary-fixed disabled:border-outline-variant disabled:text-outline",
  ghost:
    "border-transparent bg-transparent text-on-surface-variant hover:bg-surface-container-high disabled:text-outline",
  danger:
    "border-error bg-error text-on-error hover:bg-tertiary disabled:bg-surface-dim disabled:text-on-surface-variant",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  icon?: ReactNode;
}

export function Button({
  className = "",
  variant = "primary",
  icon,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
