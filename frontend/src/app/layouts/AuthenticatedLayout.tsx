import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "../../components/layout/AppHeader";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../features/auth/AuthContext";

export function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [navigationOpen, setNavigationOpen] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-body-md text-on-surface-variant">
        Validando sesión...
      </div>
    );
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar />
      </div>
      {navigationOpen ? (
        <div className="fixed inset-0 z-40 bg-inverse-surface lg:hidden">
          <Sidebar onClose={() => setNavigationOpen(false)} />
        </div>
      ) : null}
      <AppHeader onOpenNavigation={() => setNavigationOpen(true)} />
      <main className="min-h-screen pt-16 lg:pl-60">
        <div className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
