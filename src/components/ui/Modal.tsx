import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-inverse-surface p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <section className="max-h-full w-full max-w-2xl overflow-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <header className="flex items-center justify-between border-b border-outline-variant p-5">
          <h2 id="modal-title" className="text-xl font-semibold">
            {title}
          </h2>
          <Button
            variant="ghost"
            className="px-2"
            onClick={onClose}
            aria-label="Cerrar"
            icon={<X size={20} />}
          />
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
