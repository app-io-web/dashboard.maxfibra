import { useState } from "react";
import { api } from "../../lib/api";
import { KeyRound } from "lucide-react";

export function UserPermissionToolsSection() {
  const [userId, setUserId] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasOwner, setHasOwner] = useState<boolean | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<any | null>(null);

  async function handleCheck() {
    if (!userId) return;
    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post("/tools/check-system-owner", {
        auth_user_id: userId,
      });

      setHasOwner(res.data?.exists ?? false);
      setOwnerInfo(res.data?.data || null);
      setResult(res.data);
    } catch (err: any) {
      console.error("Erro ao consultar permissão OWNER:", err);
      const apiError =
        err?.response?.data?.error ||
        err.message ||
        "Erro ao consultar permissão do usuário.";
      setError(apiError);
      setHasOwner(null);
      setOwnerInfo(null);
    } finally {
      setChecking(false);
    }
  }

  async function handleGrantOwner() {
    setLoadingAction(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post("/tools/grant-system-owner", {
        auth_user_id: userId,
      });
      setResult(res.data);
      setHasOwner(true);
    } catch (err: any) {
      console.error("Erro ao conceder permissão OWNER:", err);
      const apiError =
        err?.response?.data?.error ||
        err.message ||
        "Erro ao tentar conceder permissão ao usuário.";
      setError(apiError);
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleRevokeOwner() {
    setLoadingAction(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post("/tools/revoke-system-owner", {
        auth_user_id: userId,
      });
      setResult(res.data);
      setHasOwner(false);
      setOwnerInfo(null);
    } catch (err: any) {
      console.error("Erro ao revogar permissão OWNER:", err);
      const apiError =
        err?.response?.data?.error ||
        err.message ||
        "Erro ao tentar remover permissão do usuário.";
      setError(apiError);
    } finally {
      setLoadingAction(false);
    }
  }

  const showGrantButton = hasOwner === false || hasOwner === null;
  const showRevokeButton = hasOwner === true;

  return (
    <section
      className="
        mt-2
        overflow-hidden rounded-2xl border border-slate-200
        bg-white shadow-sm
      "
    >
      {/* HEADER */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
          <KeyRound className="h-5 w-5" />
        </div>

        <div className="flex flex-col">
          <h2 className="font-semibold text-slate-800 text-base sm:text-lg">
            Permissão de usuário
          </h2>
          <p className="text-xs text-slate-500">
            Consultar, conceder ou remover permissão OWNER global (apenas
            OWNER + Desenvolvedor).
          </p>
        </div>
      </header>

      {/* CORPO */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            ID global do usuário (auth_user_id)
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setHasOwner(null);
              setOwnerInfo(null);
              setResult(null);
              setError(null);
            }}
            placeholder="Ex: a736e9f5-72e0-4faa-946c-8c5a62b6bb77"
            className="
              w-full rounded-lg bg-slate-50
              border border-slate-200 px-3 py-2
              text-sm text-slate-800 font-mono
              focus:outline-none focus:ring-2 focus:ring-indigo-500/60
              focus:border-indigo-500
            "
          />
          <p className="text-xs text-slate-500">
            Use o ID global exibido nas telas de gestão de usuários/empresas.
          </p>
        </div>

        {/* Linha de ações */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking || !userId}
            className="
              inline-flex items-center justify-center
              rounded-lg px-3 py-2 text-xs sm:text-sm font-medium
              border border-slate-300 text-slate-700 bg-white
              hover:bg-slate-50
              disabled:opacity-60 disabled:cursor-not-allowed
              transition
            "
          >
            {checking ? "Consultando..." : "Consultar permissão"}
          </button>

          {showGrantButton && (
            <button
              type="button"
              onClick={handleGrantOwner}
              disabled={loadingAction || !userId}
              className="
                inline-flex items-center justify-center
                rounded-lg px-4 py-2 text-sm font-medium
                bg-indigo-500 text-white
                hover:bg-indigo-600
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              {loadingAction ? "Processando..." : "Conceder OWNER global"}
            </button>
          )}

          {showRevokeButton && (
            <button
              type="button"
              onClick={handleRevokeOwner}
              disabled={loadingAction || !userId}
              className="
                inline-flex items-center justify-center
                rounded-lg px-4 py-2 text-sm font-medium
                bg-red-500 text-white
                hover:bg-red-600
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              {loadingAction ? "Removendo..." : "Remover OWNER global"}
            </button>
          )}

          {error && (
            <p className="text-xs text-red-500 flex-1 min-w-[200px] truncate">
              {error}
            </p>
          )}
        </div>

        {/* Badge de status */}
        {hasOwner !== null && (
          <div className="text-xs">
            {hasOwner ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                Usuário já possui permissão OWNER global
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                Usuário ainda não possui permissão OWNER global
              </span>
            )}
          </div>
        )}

        {/* Resultado bruto da API */}
        {result && (
          <div
            className="
              mt-2 rounded-lg border border-indigo-100
              bg-indigo-50 px-3 py-2
            "
          >
            <p className="text-xs font-semibold text-indigo-800 mb-1">
              Resposta da API:
            </p>
            <pre className="text-[11px] whitespace-pre-wrap text-indigo-900 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
