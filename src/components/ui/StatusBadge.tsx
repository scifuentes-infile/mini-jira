import { statusClasses, statusLabels } from "../../lib/constants";
import type { TicketStatus } from "../../types/domain";

export function StatusBadge({
  status,
  count,
}: {
  status: TicketStatus;
  count?: number;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-label-sm uppercase ${statusClasses[status]}`}
    >
      {count === undefined ? statusLabels[status] : count}
    </span>
  );
}
