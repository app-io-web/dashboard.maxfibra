// src/components/layout/AppLayout.tsx
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NewFichaPopup } from "../notifications/NewFichaPopup";
import { SmartOltAutomationPopup } from "../notifications/SmartOltAutomationPopup";
import { useSession } from "../../contexts/SessionContext";
import { LicenseBlocker } from "../license/LicenseBlocker";
import { InvoiceReminderModal } from "../license/InvoiceReminderModal";
import { GraceNoticeToast } from "../license/GraceNoticeToast";

const POST_LOGIN_REFRESH_KEY = "mx_post_login_refresh_v1";

export function AppLayout() {
  const { empresaId } = useSession();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });

  const [isTabletPortrait, setIsTabletPortrait] = useState(false);

  // ✅ refresh rápido UMA vez depois do login (pra permissões/menu carregarem lisinho)
  useEffect(() => {
    const flag = sessionStorage.getItem(POST_LOGIN_REFRESH_KEY);
    if (flag === "1") {
      sessionStorage.removeItem(POST_LOGIN_REFRESH_KEY);
      setTimeout(() => window.location.reload(), 80);
    }
  }, []);

  useEffect(() => {
    function checkOrientation() {
      if (typeof window === "undefined") return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const isTablet = width >= 768 && width <= 1280;
      const isPortrait = height > width;

      setIsTabletPortrait(isTablet && isPortrait);
    }

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (isTabletPortrait) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">
            Gire o tablet para o modo horizontal
          </h1>
          <p className="text-sm text-slate-300">
            Para usar a Central Administrativa no tablet, mantenha o aparelho na
            orientação paisagem (horizontal).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Fechar menu lateral"
        />
      )}

      <div
        className={[
          "fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 overflow-hidden",
          "md:static",
          isSidebarOpen
            ? "translate-x-0 w-72 md:w-64"
            : "-translate-x-full w-72 md:w-0",
        ].join(" ")}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <Topbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
          <LicenseBlocker />
          <InvoiceReminderModal />

            <GraceNoticeToast />

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <NewFichaPopup />
            <SmartOltAutomationPopup />

            {/* ✅ isso aqui é o pulo do gato */}
            <Outlet key={empresaId || "no-empresa"} />
          </div>
        </main>
      </div>
    </div>
  );
}
