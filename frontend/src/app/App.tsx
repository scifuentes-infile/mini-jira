import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { TicketDetailPage } from "../features/tickets/TicketDetailPage";
import { TicketsPage } from "../features/tickets/TicketsPage";
import { AdminUsersPage } from "../features/users/AdminUsersPage";
import { AuthenticatedLayout } from "./layouts/AuthenticatedLayout";
import { NotFoundPage } from "./NotFoundPage";
import { AdminGuard } from "./router/RouteGuards";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (failureCount, error) =>
        !(error instanceof Error && "status" in error) && failureCount < 2,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthenticatedLayout />}>
          <Route index element={<TicketsPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/archived" element={<TicketsPage archived />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </QueryClientProvider>
  );
}
