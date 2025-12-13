// src/components/shortcuts/DashboardShortcutCard.tsx
import type { ApiShortcut } from "../../types/shortcut";

type Props = {
  shortcut: ApiShortcut;
};

function getScopeLabel(s: ApiShortcut) {
  if (s.is_global) return "GLOBAL";
  if (s.is_private) return "PRIVADO";
  return "EMPRESA";
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function DashboardShortcutCard({ shortcut }: Props) {
  const host = getHostname(shortcut.url);
  const title = shortcut.titulo || host;

  return (
    <a
      href={shortcut.url}
      target="_blank"
      rel="noreferrer"
      className="
        group
        flex items-stretch gap-3 rounded-2xl bg-white shadow-sm border border-slate-100
        px-3 py-3 hover:shadow-md transition
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-sky-500/40
      "
      aria-label={`Abrir atalho: ${title}`}
    >
      {/* Imagem / avatar */}
      {shortcut.img_url ? (
        <div className="flex-shrink-0">
          <img
            src={shortcut.img_url}
            alt={title}
            className="h-24 w-24 rounded-xl object-cover"
          />
        </div>
      ) : (
        <div className="flex-shrink-0 h-24 w-24 rounded-xl bg-sky-100 flex items-center justify-center text-lg font-semibold text-sky-700">
          {title.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {title}
            </p>
            <p className="text-xs text-slate-500 break-all line-clamp-1">
              {shortcut.url}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="ml-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {getScopeLabel(shortcut)}
            </span>

            {shortcut.show_on_dashboard && (
              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                Dashboard
              </span>
            )}
          </div>
        </div>

        {shortcut.anotacoes && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 whitespace-pre-line">
            {shortcut.anotacoes}
          </p>
        )}

        <div className="mt-2 flex items-center justify-end">
          {/* "Botão" visual (sem <a> dentro de <a>) */}
          <span
            className="
              inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-md
              bg-sky-500 text-white transition
              group-hover:bg-sky-600
            "
          >
            Abrir
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                d="M7 17L17 7M9 7h8v8"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}
