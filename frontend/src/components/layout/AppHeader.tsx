import { Menu } from "lucide-react";
import { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/IconButton";
import { SearchInput } from "../ui/SearchInput";

export function AppHeader({
  onOpenNavigation,
}: {
  onOpenNavigation: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const search = String(data.get("search") ?? "").trim();
    navigate(
      search ? `/tickets?search=${encodeURIComponent(search)}` : "/tickets",
    );
  }

  if (!user) return null;

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center border-b border-outline-variant bg-surface-container-lowest px-4 lg:left-60 lg:px-8">
      <IconButton
        label="Abrir navegación"
        className="mr-3 lg:hidden"
        onClick={onOpenNavigation}
      >
        <Menu size={21} />
      </IconButton>
      <p className="hidden shrink-0 text-headline-md font-bold text-primary sm:block">
        Jira-Lite
      </p>
      <form className="ml-0 w-full max-w-md sm:ml-6" onSubmit={submit}>
        <SearchInput
          label="Buscar tickets"
          name="search"
          defaultValue={params.get("search") ?? ""}
          placeholder="Buscar tickets..."
        />
      </form>
      <div className="ml-auto flex items-center gap-3 pl-4">
        <div className="hidden text-right md:block">
          <p className="text-body-md font-semibold">{user.name}</p>
          <p className="text-body-sm text-on-surface-variant">
            {user.role === "admin" ? "Administrador" : "Usuario"}
          </p>
        </div>
        <Avatar user={user} size="sm" />
      </div>
    </header>
  );
}
