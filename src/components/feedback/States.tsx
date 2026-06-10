import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Cargando" }: { label?: string }) {
  return (
    <div
      className="flex min-h-48 items-center justify-center gap-3 text-on-surface-variant"
      role="status"
    >
      <LoaderCircle className="animate-spin" size={22} />
      <span>{label}...</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-outline-variant bg-surface-container-low p-8 text-center">
      <div>
        <Inbox className="mx-auto mb-3 text-outline" size={32} />
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-error bg-error-container p-4 text-on-error-container"
      role="alert"
    >
      <AlertCircle className="shrink-0" size={20} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
