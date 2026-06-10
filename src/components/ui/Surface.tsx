import type { HTMLAttributes, ReactNode } from "react";

const levels = {
  base: "bg-background",
  raised: "border border-outline-variant bg-surface-container-lowest",
  muted: "border border-outline-variant bg-surface-container-low",
};

export function Surface({
  level = "raised",
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  level?: keyof typeof levels;
  children: ReactNode;
}) {
  return (
    <div className={`${levels[level]} ${className}`} {...props}>
      {children}
    </div>
  );
}
