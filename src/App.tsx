// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { UserSettingsPage } from "./pages/UserSettingsPage";
import { EmpresaSettingsPage } from "./pages/EmpresaSettingsPage";
import { ServicePage } from "./pages/ServicePage";
import { ShortcutsPage } from "./pages/ShortcutsPage";
import { NotesPage } from "./pages/NotesPage";
import { PasswordsPage } from "./pages/PasswordsPage";
import { AniversariantesPage } from "./pages/AniversariantesPage";
import { LoginPage } from "./pages/LoginPage";
import { isAuthenticated } from "./lib/auth";
import { EmpresaUsersPage } from "./pages/EmpresaUsersPage";
import { SystemSettingsPage } from "./pages/SystemSettingsPage";
import { MonitoramentoPage } from "./pages/MonitoramentoPage";
import { CnpjConsultorPage } from "./pages/tools/CnpjConsultorPage";
import { CepConsultorPage } from "./pages/tools/CepConsultorPage";
import { InternalServicesPage } from "./pages/InternalServicesPage";
import { SupportPage } from "./pages/SupportPage";
import { SupportTicketPage } from "./pages/SupportTicketPage";
import { ClienteFichaDetailPage } from "./pages/internal-services/ClienteFichaDetailPage";
import { DuvidasFrequentesEditPage } from "./pages/DuvidasFrequentesEditPage";
import { SmartOltIxcReportPage } from "./pages/SmartOltIxcReportPage";


type PropsWithChildren = {
  children: React.ReactNode;
};

function RequireAuth({ children }: PropsWithChildren) {
  const authed = isAuthenticated();

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnly({ children }: PropsWithChildren) {
  const authed = isAuthenticated();

  if (authed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  // BrowserRouter fica no main.tsx (padrão Vite)
  return (
    <Routes>
      {/* ROTA PÚBLICA */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      {/* ROTAS PROTEGIDAS: tudo dentro do AppLayout */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* index = / */}
        <Route index element={<DashboardPage />} />
        <Route path="user-settings" element={<UserSettingsPage />} />
        <Route path="empresa-settings" element={<EmpresaSettingsPage />} />
        <Route path="empresa-users" element={<EmpresaUsersPage />} />


        <Route path="services" element={<ServicePage />} />
        <Route path="/internal-services" element={<InternalServicesPage />} />

        <Route path="monitoramento" element={<MonitoramentoPage />} />
        <Route path="shortcuts" element={<ShortcutsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="passwords" element={<PasswordsPage />} />
        <Route path="aniversariantes" element={<AniversariantesPage />} />
        <Route path="system-config" element={<SystemSettingsPage />} />
        <Route path="/tools/cnpj-consultor" element={<CnpjConsultorPage />} />
        <Route path="/tools/cep-consultor" element={<CepConsultorPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support/tickets/:id" element={<SupportTicketPage />} />

        <Route path="/services/clientes/:id" element={<ClienteFichaDetailPage />} />
        <Route
          path="/internal-services/duvidas-frequentes/:id"
          element={<DuvidasFrequentesEditPage />}
        />

        <Route
            path="/monitoramento/smart-olt-relatorio"
            element={<SmartOltIxcReportPage />}
          />



      </Route>



      {/* qualquer coisa estranha vai pro dashboard (se logado) ou pro login (pelo RequireAuth) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
