import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

export function AdminGuard() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/tickets" replace />;
  return <Outlet />;
}
