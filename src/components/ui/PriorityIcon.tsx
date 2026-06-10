import { ArrowDown, ArrowUp, ChevronsUp } from "lucide-react";
import { priorityClasses, priorityLabels } from "../../lib/constants";
import type { Priority } from "../../types/domain";

const icons = { high: ChevronsUp, medium: ArrowUp, low: ArrowDown };

export function PriorityIcon({
  priority,
  size = 18,
}: {
  priority: Priority;
  size?: number;
}) {
  const Icon = icons[priority];
  return (
    <span
      className={priorityClasses[priority]}
      title={`Prioridad ${priorityLabels[priority].toLowerCase()}`}
    >
      <Icon size={size} aria-hidden="true" />
      <span className="sr-only">
        Prioridad {priorityLabels[priority].toLowerCase()}
      </span>
    </span>
  );
}
