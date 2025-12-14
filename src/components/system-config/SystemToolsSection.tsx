// src/components/system-config/SystemToolsSection.tsx
import { useState } from "react";
import { api } from "../../lib/api";
import { Wrench } from "lucide-react";


type ResultData = any;

export function SystemToolsSection() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScript() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const json = JSON.parse(inputText);

      const res = await api.post("/tools/run-config-script", json);
      setResult(res.data);
    } catch (err: any) {
      console.error("Erro ao executar script:", err);
      const apiError =
        err?.response?.data?.error || err.message || "Erro ao executar script.";
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="
        mt-6
        overflow-hidden rounded-2xl border border-slate-200
        bg-white shadow-sm
      "
    >
      {/* HEADER DO CARD */}
      <header
        className="
        flex items-center gap-3
        border-b border-slate-200
        bg-white px-5 py-4 sm:px-6
      "
      >
        <div
          className="
          flex h-10 w-10 items-center justify-center
          rounded-xl bg-blue-500/10 text-blue-500
        "
        >
          <Wrench className="h-5 w-5" />
        </div>

        <div className="flex flex-col">
          <h2 className="font-semibold text-slate-800 text-base sm:text-lg">
            Ferramentas avançadas do sistema
          </h2>
          <p className="text-xs text-slate-500">
            Execute scripts de configuração direto pelo painel (apenas OWNER +
            Desenvolvedor).
          </p>
        </div>
      </header>

      {/* CORPO */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-4">
        <div className="text-xs text-slate-500">
          Cole um JSON com o formato aceito pela API
          <code className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px]">
            POST /tools/run-config-script
          </code>
          . Exemplo:
        </div>

        <pre
          className="
          text-[11px] whitespace-pre-wrap rounded-lg border border-slate-200
          bg-slate-50 px-3 py-2 font-mono text-slate-700
        "
        >
{`{
  "key": "dashboard_show_notification_test_button",
  "value": true,
  "description": "Controla se o botão de teste de notificação aparece no dashboard principal.",
  "is_sensitive": false,
  "category": "dashboard"
}`}
        </pre>

        <textarea
          className="
          w-full h-40 rounded-lg bg-slate-50
          border border-slate-200 px-3 py-2
          text-sm text-slate-800 font-mono
          focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500
        "
          placeholder={`Cole aqui o JSON da configuração que deseja criar/alterar...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3">
          {error && (
            <p className="text-xs text-red-500 flex-1">{error}</p>
          )}

          <button
            onClick={runScript}
            disabled={loading}
            className="
              inline-flex items-center justify-center
              rounded-lg px-4 py-2 text-sm font-medium
              bg-blue-500 text-white
              hover:bg-blue-600
              disabled:opacity-60 disabled:cursor-not-allowed
              transition
            "
          >
            {loading ? "Executando..." : "Executar script"}
          </button>
        </div>

        {result && (
          <div
            className="
            mt-2 rounded-lg border border-blue-100
            bg-blue-50 px-3 py-2
          "
          >
            <p className="text-xs font-semibold text-blue-800 mb-1">
              Resposta da API:
            </p>
            <pre className="text-[11px] whitespace-pre-wrap text-blue-900 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
