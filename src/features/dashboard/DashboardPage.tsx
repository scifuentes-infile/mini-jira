import { useQuery } from "@tanstack/react-query";
import { AlertOctagon, Clock3, Layers3, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ErrorState, LoadingState } from "../../components/feedback/States";
import { statusLabels, ticketStatuses } from "../../lib/constants";
import { mockApi } from "../../mocks/api";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: mockApi.dashboard,
  });
  if (query.isPending) return <LoadingState label="Calculando métricas" />;
  if (query.isError) {
    return <ErrorState message="No fue posible cargar el dashboard." />;
  }
  const data = query.data;
  const activeTotal =
    data.byStatus.todo +
    data.byStatus.in_progress +
    data.byStatus.review +
    data.byStatus.blocked;
  const cards = [
    {
      label: "Tickets activos",
      value: activeTotal,
      icon: Layers3,
      to: "/tickets?view=list",
    },
    {
      label: "Bloqueados",
      value: data.blocked,
      icon: AlertOctagon,
      to: "/tickets?view=list&status=blocked",
    },
    {
      label: "Tiempo promedio",
      value: `${data.averageCloseDays} días`,
      icon: Clock3,
      to: "/tickets?view=list&status=done",
    },
    {
      label: "Responsables activos",
      value: data.activeByAssignee.length,
      icon: UsersRound,
      to: "/tickets?view=list",
    },
  ];

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Visión general
        </p>
        <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {user?.role === "admin"
            ? "Métricas globales del espacio de trabajo."
            : "Métricas de los tickets creados por ti o asignados a ti."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-fixed text-primary">
                <Icon size={21} />
              </span>
              <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-on-surface-variant">
              {label}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-lg font-semibold">Tickets por estado</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Distribución actual del trabajo activo.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {ticketStatuses.map((status) => (
              <Link
                key={status}
                to={`/tickets?view=list&status=${status}`}
                className="rounded-lg bg-surface-container-low p-3 text-center"
              >
                <p className="text-2xl font-bold">{data.byStatus[status]}</p>
                <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                  {statusLabels[status]}
                </p>
              </Link>
            ))}
          </div>
        </div>
        <ChartPanel title="Tickets cerrados por mes">
          <BarChart data={data.closedByMonth}>
            <CartesianGrid
              stroke="var(--color-outline-variant)"
              vertical={false}
            />
            <XAxis dataKey="month" stroke="var(--color-on-surface-variant)" />
            <YAxis
              allowDecimals={false}
              stroke="var(--color-on-surface-variant)"
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-container-lowest)",
                borderColor: "var(--color-outline-variant)",
              }}
            />
            <Bar
              dataKey="total"
              fill="var(--color-primary-container)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartPanel>
        <ChartPanel title="Tickets activos por responsable" wide>
          <BarChart data={data.activeByAssignee} layout="vertical">
            <CartesianGrid
              stroke="var(--color-outline-variant)"
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              stroke="var(--color-on-surface-variant)"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              stroke="var(--color-on-surface-variant)"
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-container-lowest)",
                borderColor: "var(--color-outline-variant)",
              }}
            />
            <Bar
              dataKey="total"
              fill="var(--color-secondary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartPanel>
      </section>
    </div>
  );
}

function ChartPanel({
  title,
  wide = false,
  children,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactElement;
}) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest p-5 ${
        wide ? "xl:col-span-2" : ""
      }`}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
