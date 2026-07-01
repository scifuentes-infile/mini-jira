import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { App } from "./app/App";
import { AuthProvider } from "./features/auth/AuthContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors={false} />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
