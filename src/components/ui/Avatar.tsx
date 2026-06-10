import type { UserSummary } from "../../types/domain";
import { initials } from "../../lib/format";

export function Avatar({
  user,
  size = "md",
}: {
  user: UserSummary;
  size?: "sm" | "md";
}) {
  return (
    <span
      title={user.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-outline-variant bg-secondary-container font-bold text-on-secondary-container ${
        size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
      }`}
    >
      {initials(user.name)}
    </span>
  );
}
