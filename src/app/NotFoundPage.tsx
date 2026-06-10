import { CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <CircleHelp className="mx-auto text-primary" size={48} />
        <p className="mt-4 text-sm font-bold uppercase tracking-wider text-primary">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-bold">Página no encontrada</h1>
        <p className="mt-2 text-on-surface-variant">
          La dirección solicitada no existe.
        </p>
        <Button className="mt-6">
          <Link to="/tickets">Volver a tickets</Link>
        </Button>
      </div>
    </main>
  );
}
