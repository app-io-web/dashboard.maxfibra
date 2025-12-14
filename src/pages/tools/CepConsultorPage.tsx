// src/pages/tools/CepConsultorPage.tsx
import { useState } from "react";
import { api } from "../../lib/api";
import { Search, MapPin } from "lucide-react";

type CepInfo = {
  cep: string | null;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ibge: string | null;
  ddd: string | null;
  siafi: string | null;
};

export function CepConsultorPage() {
  const [cepInput, setCepInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CepInfo | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);

    let cep = cepInput.replace(/\D/g, "");

    if (cep.length !== 8) {
      setError("Digite um CEP válido com 8 dígitos.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/tools/cep-lookup", {
        params: { cep },
      });

      setData(response.data);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        "Não foi possível consultar o CEP. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-500">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Consultor de CEP
          </h1>
          <p className="text-sm text-slate-500">
            Consulte rapidamente endereços a partir de um CEP.
          </p>
        </div>
      </header>

        {/* Card principal */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Label em cima */}
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            CEP
            </label>

            {/* Linha com input + botão */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
                <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <MapPin className="w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    value={formatCep(cepInput)}
                    onChange={(e) => setCepInput(e.target.value)}
                    placeholder="00000-000"
                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className={[
                "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                "bg-blue-500 text-white hover:bg-blue-600",
                loading ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
            >
                <Search className="w-4 h-4" />
                {loading ? "Consultando..." : "Consultar CEP"}
            </button>
            </div>

            {/* Texto de ajuda */}
            <p className="text-xs text-slate-500">
            Digite apenas números, o formato será aplicado automaticamente.
            </p>
        </form>

        {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
            </div>
        )}

        {data && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-slate-800">
                Resultado da consulta
                </div>
                {data.cep && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-mono text-blue-700 border border-blue-100">
                    {data.cep}
                </span>
                )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InfoLine label="Logradouro" value={data.logradouro} />
                <InfoLine label="Complemento" value={data.complemento} />
                <InfoLine label="Bairro" value={data.bairro} />
                <InfoLine
                label="Cidade / UF"
                value={
                    data.cidade || data.uf
                    ? `${data.cidade ?? ""}${data.uf ? " - " + data.uf : ""}`
                    : null
                }
                />
                <InfoLine label="IBGE" value={data.ibge} />
                <InfoLine label="DDD" value={data.ddd} />
                <InfoLine label="SIAFI" value={data.siafi} />
            </div>
            </div>
        )}
        </div>

    </div>
  );
}

type InfoLineProps = {
  label: string;
  value: string | null;
};

function InfoLine({ label, value }: InfoLineProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-900">
        {value && value.trim() !== "" ? value : "—"}
      </span>
    </div>
  );
}
