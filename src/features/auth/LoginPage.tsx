import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Workflow } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { isApiError } from "../../mocks/api";
import { useAuth } from "./AuthContext";

const schema = z.object({
  email: z.email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});
type LoginValues = z.infer<typeof schema>;

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@minijira.test",
      password: "demo123",
    },
  });

  if (user) return <Navigate to="/tickets" replace />;

  async function submit(values: LoginValues) {
    setError("");
    try {
      await login(values.email, values.password);
      const target =
        (location.state as { from?: string } | null)?.from ?? "/tickets";
      navigate(target, { replace: true });
    } catch (caught) {
      setError(
        isApiError(caught) ? caught.message : "No fue posible iniciar sesión.",
      );
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-primary p-12 text-on-primary lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-on-primary text-primary">
            <Workflow size={24} />
          </span>
          <span className="text-xl font-bold">Mini Jira</span>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-on-primary-container">
            Trabajo claro, decisiones rápidas
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">
            Gestiona el trabajo del equipo sin perder el contexto.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-on-primary-container">
            Tickets, responsables, comentarios y métricas en una experiencia
            simple y consistente.
          </p>
        </div>
        <p className="text-sm text-on-primary-container">
          Herramienta interna para equipos pequeños
        </p>
      </section>

      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-on-primary">
              <Workflow size={22} />
            </span>
            <span className="text-xl font-bold text-primary">Mini Jira</span>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-primary-fixed text-primary">
              <LockKeyhole size={22} />
            </span>
            <h2 className="text-3xl font-bold">Bienvenido</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Inicia sesión para acceder al espacio de trabajo.
            </p>

            <form className="mt-7 grid gap-5" onSubmit={handleSubmit(submit)}>
              {error ? (
                <p
                  className="rounded-lg border border-error bg-error-container p-3 text-sm text-on-error-container"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <Field
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Field
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </form>
            <div className="mt-6 rounded-lg bg-surface-container-low p-4 text-xs text-on-surface-variant">
              <p className="font-semibold text-on-surface">Cuenta de demo</p>
              <p className="mt-1">admin@minijira.test / demo123</p>
              <p>diego@minijira.test / demo123</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
