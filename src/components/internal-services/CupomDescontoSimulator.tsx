import { useMemo, useState, FormEvent } from "react";
import { Calculator } from "lucide-react";

type CupomDescontoSimulatorProps = {
  onImport: (config: { descontoPercentual: string }) => void;
};

type PlanoKey =
  | "TURBO"
  | "GOLD"
  | "INFINITY"
  | "STARTUP_COMPANY"
  | "MEDIUM_COMPANY"
  | "BIG_COMPANY";

const PLANOS_BASE: Record<PlanoKey, { label: string; valor: number }> = {
  TURBO: { label: "Turbo", valor: 99.9 },
  GOLD: { label: "Gold", valor: 129.9 },
  INFINITY: { label: "Infinity", valor: 169.9 },
  STARTUP_COMPANY: { label: "Startup Company", valor: 199.9 },
  MEDIUM_COMPANY: { label: "Medium Company", valor: 299.9 },
  BIG_COMPANY: { label: "Big Company", valor: 399.9 },
};

export function CupomDescontoSimulator({ onImport }: CupomDescontoSimulatorProps) {
  const [open, setOpen] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoKey>("TURBO");
  const [desconto, setDesconto] = useState<string>("10"); // % padrão
  const [erro, setErro] = useState<string | null>(null);

  function parsePercent(str: string): number {
    if (!str) return 0;
    const parsed = parseFloat(str.replace("%", "").replace(",", "."));
    if (Number.isNaN(parsed)) return 0;
    return parsed;
  }

  const descontoNumber = useMemo(() => parsePercent(desconto), [desconto]);

  const linhas = useMemo(() => {
    return (Object.entries(PLANOS_BASE) as [PlanoKey, { label: string; valor: number }][])
      .map(([key, { label, valor }]) => {
        const valorFinal = descontoNumber
          ? valor * (1 - descontoNumber / 100)
          : valor;

        return {
          key,
          label,
          valorBase: valor,
          valorFinal,
        };
      });
  }, [descontoNumber]);

  function formatCurrency(v: number) {
    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  }

  function handleOpen() {
    setErro(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleImport(e: FormEvent) {
    e.preventDefault();

    if (!desconto || parsePercent(desconto) <= 0) {
      setErro("Informe um desconto maior que 0% para importar.");
      return;
    }

    onImport({ descontoPercentual: desconto });
    setOpen(false);
  }

  return (
    <>
      {/* BOTÃO QUE ABRE O MODAL */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
      >
        <Calculator className="w-4 h-4" />
        Simular desconto
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Simulador de desconto por plano
                </h3>
                <p className="text-[11px] text-slate-500">
                  Selecione o plano de referência, defina o desconto e veja o valor final
                  em cada plano antes de importar para o formulário de cupom.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImport} className="mt-4 space-y-4">
              {/* Linha de controles */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700">
                    Plano do usuário
                  </label>
                  <select
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none"
                    value={planoSelecionado}
                    onChange={(e) =>
                      setPlanoSelecionado(e.target.value as PlanoKey)
                    }
                  >
                    {Object.entries(PLANOS_BASE).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400">
                    Apenas usado para destaque visual na tabela.
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700">
                    Desconto a aplicar (%)
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2">
                    <span className="text-slate-500 text-xs">%</span>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      className="w-full bg-transparent py-1.5 text-xs outline-none"
                      placeholder="Ex: 10 = 10%"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Esse valor será importado para o campo de desconto do cupom.
                  </span>
                </div>
              </div>

              {/* Erro */}
              {erro && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  {erro}
                </div>
              )}

              {/* Tabela de simulação */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="border-b border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600">
                  Simulação de valores com desconto
                </div>
                <div className="max-h-56 overflow-auto">
                  <table className="min-w-full text-[11px]">
                    <thead className="bg-white text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Plano
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Valor base
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Valor com desconto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {linhas.map((linha) => {
                        const isSelected =
                          linha.key === planoSelecionado;
                        return (
                          <tr
                            key={linha.key}
                            className={
                              isSelected
                                ? "bg-emerald-50/80"
                                : "hover:bg-slate-50/60"
                            }
                          >
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {linha.label}
                              {isSelected && (
                                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  selecionado
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {formatCurrency(linha.valorBase)}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {formatCurrency(linha.valorFinal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-between items-center gap-3 pt-2">
                <span className="text-[11px] text-slate-500">
                  Desconto atual:{" "}
                  <span className="font-semibold">
                    {descontoNumber.toFixed(1)}%
                  </span>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Importar configuração
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
