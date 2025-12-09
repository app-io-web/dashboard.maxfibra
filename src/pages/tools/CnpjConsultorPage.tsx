// src/pages/tools/CnpjConsultorPage.tsx
import { useState } from "react";
import { api } from "../../lib/api";
import { Search, Building2 } from "lucide-react";

type CnpjInfo = {
  abertura: string | null;
  cnpj: string | null;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  porte: string | null;
  naturezaJuridica: string | null;
  atividadePrincipal: any[];
  atividadesSecundarias: any[];
  qsa: any[];
  telefone: string | null;
  email: string | null;
  cep: string | null;
  uf: string | null;
  municipio: string | null;
  bairro: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  tipo: string | null;
  capitalSocial: string | null;
  situacao: string | null;
  dataSituacao: string | null;
  situacaoEspecial: string | null;
  dataSituacaoEspecial: string | null;
};

export function CnpjConsultorPage() {
  const [cnpjInput, setCnpjInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CnpjInfo | null>(null);

  function normalizeCnpj(value: string) {
    return value.replace(/[^\d]/g, "").slice(0, 14);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);

    const cleaned = normalizeCnpj(cnpjInput);

    if (cleaned.length !== 14) {
      setError("Informe um CNPJ válido com 14 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<CnpjInfo>("/tools/cnpj-lookup", {
        params: { cnpj: cleaned },
      });
      setData(response.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Não foi possível consultar o CNPJ. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = !!data;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Consultor de CNPJ
          </h1>
          <p className="text-sm text-slate-500">
            Consulte rapidamente as informações cadastrais de um CNPJ.
          </p>
        </div>
      </header>

        <form onSubmit={handleSubmit} className="space-y-3">
        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            CNPJ
        </label>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
            <input
                type="text"
                value={cnpjInput}
                onChange={(e) => setCnpjInput(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-400">
                14 dígitos
            </span>
            </div>

            <button
            type="submit"
            disabled={loading}
            className={[
                "h-11 inline-flex items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium",
                "bg-cyan-500 text-white hover:bg-cyan-400 transition",
                loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
            >
            <Search className="h-4 w-4" />
            {loading ? "Consultando..." : "Consultar CNPJ"}
            </button>
        </div>

        <p className="text-xs text-slate-500">
            Você pode colar o CNPJ com ou sem pontos e traços, a gente limpa pra você.
        </p>
        </form>


      {/* Resultado */}
      {hasResult && data && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Bloco principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Dados cadastrais
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <dt className="text-slate-500">Razão social</dt>
                  <dd className="font-medium">
                    {data.razaoSocial || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Nome fantasia</dt>
                  <dd className="font-medium">
                    {data.nomeFantasia || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">CNPJ</dt>
                  <dd className="font-mono text-xs">
                    {data.cnpj || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Abertura</dt>
                  <dd>{data.abertura || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Porte</dt>
                  <dd>{data.porte || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Natureza jurídica</dt>
                  <dd>{data.naturezaJuridica || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Situação</dt>
                  <dd>{data.situacao || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Data situação</dt>
                  <dd>{data.dataSituacao || "-"}</dd>
                </div>
              </dl>
            </div>

            {/* Endereço */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Endereço
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <dt className="text-slate-500">Logradouro</dt>
                  <dd>
                    {data.logradouro || "-"} {data.numero || ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Complemento</dt>
                  <dd>{data.complemento || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Bairro</dt>
                  <dd>{data.bairro || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Município / UF</dt>
                  <dd>
                    {data.municipio || "-"} {data.uf ? `- ${data.uf}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">CEP</dt>
                  <dd>{data.cep || "-"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Contato / extra */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Contato
              </h2>
              <dl className="space-y-2 text-xs text-slate-700">
                <div>
                  <dt className="text-slate-500">Telefone</dt>
                  <dd>{data.telefone || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">E-mail</dt>
                  <dd className="break-all">{data.email || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Capital social</dt>
                  <dd>{data.capitalSocial || "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tipo</dt>
                  <dd>{data.tipo || "-"}</dd>
                </div>
              </dl>
            </div>

            {data.atividadePrincipal && data.atividadePrincipal.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-2">
                  Atividade principal
                </h2>
                <p className="text-xs text-slate-700">
                  {data.atividadePrincipal[0]?.code
                    ? `${data.atividadePrincipal[0].code} - ${data.atividadePrincipal[0].text}`
                    : JSON.stringify(data.atividadePrincipal)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
