import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Field, Select, Textarea } from "../../components/ui/Field";
import { priorityLabels } from "../../lib/constants";
import { mockApi } from "../../mocks/api";
import type { Ticket, TicketInput } from "../../types/domain";
import { useAuth } from "../auth/AuthContext";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Usa al menos 3 caracteres.")
    .max(120, "Usa como máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria.")
    .max(5000),
  priority: z.enum(["low", "medium", "high"]),
  assigneeId: z.string(),
  labelIds: z.array(z.string()).max(5),
});
type FormValues = z.infer<typeof schema>;

export function TicketForm({
  ticket,
  onSubmit,
  onCancel,
  submitting,
}: {
  ticket?: Ticket;
  onSubmit: (input: TicketInput) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const { user } = useAuth();
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: mockApi.listUsers,
  });
  const labelsQuery = useQuery({
    queryKey: ["labels"],
    queryFn: mockApi.listLabels,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: ticket?.title ?? "",
      description: ticket?.description ?? "",
      priority: ticket?.priority ?? "medium",
      assigneeId: ticket?.assignee?.id ?? "",
      labelIds: ticket?.labels.map((label) => label.id) ?? [],
    },
  });

  useEffect(() => {
    reset({
      title: ticket?.title ?? "",
      description: ticket?.description ?? "",
      priority: ticket?.priority ?? "medium",
      assigneeId: ticket?.assignee?.id ?? "",
      labelIds: ticket?.labels.map((label) => label.id) ?? [],
    });
  }, [ticket, reset]);

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          assigneeId: values.assigneeId || null,
        });
      })}
    >
      <Field
        label="Título"
        maxLength={120}
        error={errors.title?.message}
        {...register("title")}
      />
      <Textarea
        label="Descripción"
        maxLength={5000}
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Prioridad" {...register("priority")}>
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Responsable"
          disabled={Boolean(ticket && user?.role !== "admin")}
          {...register("assigneeId")}
        >
          <option value="">Sin asignar</option>
          {usersQuery.data
            ?.filter((item) => item.status === "active")
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </Select>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Etiquetas</legend>
        <div className="flex flex-wrap gap-2">
          {labelsQuery.data?.map((label) => (
            <label
              key={label.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                value={label.id}
                {...register("labelIds")}
              />
              {label.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-3 border-t border-outline-variant pt-5">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting || (ticket ? !isDirty : false)}
        >
          {submitting
            ? "Guardando..."
            : ticket
              ? "Guardar cambios"
              : "Crear ticket"}
        </Button>
      </div>
    </form>
  );
}
