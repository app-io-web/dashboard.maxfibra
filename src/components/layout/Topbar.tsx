// src/components/layout/Topbar.tsx
import { useEffect, useState, useRef } from "react";
import { api, ACCESS_TOKEN_KEY } from "../../lib/api";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

type UserSettings = {
  display_name: string | null;
  avatar_url: string | null;
  language: string;
  theme_preference: "light" | "dark" | "system";
  is_central_admin: boolean;
  profession: string | null;
};

type TopbarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function Topbar({ isSidebarOpen, onToggleSidebar }: TopbarProps) {
  const [user, setUser] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const settings = await api.get("/me/settings");
        setUser(settings.data.userSettings);
      } catch (err) {
        console.error("Erro ao carregar topbar:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.display_name || "Usuário Central";
  const avatar = user?.avatar_url;
  const profession = user?.profession || null;

  function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.location.href = "/login";
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 md:px-6 relative">
      <div className="flex items-center gap-3">
        {/* BOTÃO: abre / fecha sidebar */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>

        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Central Administrativa
          </h1>
          <p className="text-xs text-slate-500">
            Painel interno conectado ao Auth Global
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative" ref={menuRef}>
        {loading ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : (
          <>
            <button
              onClick={() => setOpenMenu((v) => !v)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="flex flex-col text-right leading-tight max-w-[170px]">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {displayName}
                </span>

                {profession && (
                  <span className="text-[11px] text-slate-500 truncate">
                    {profession}
                  </span>
                )}
              </div>

              {avatar ? (
                <img
                  src={avatar}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-brand-300 flex items-center justify-center text-xs font-semibold text-white">
                  {displayName.charAt(0)}
                </div>
              )}
            </button>

            {openMenu && (
              <div className="absolute right-0 top-14 w-40 bg-white shadow-lg border border-slate-200 rounded-lg py-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Sair
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
