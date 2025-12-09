// src/components/internal-services/PlanosEmpresariaisSection.tsx
import { useEffect, useMemo, useState, FormEvent } from "react";
import { api } from "../../lib/api";
import { Briefcase, RefreshCcw, Save, AlertCircle } from "lucide-react";
import { PlanosSuccessToast } from "./PlanosSuccessToast";

type PlanoFields = {
  ID_?: string | null;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
  Plano_Startup?: any;
  Plano_Medium?: any;
  Plano_Big?: any;
};

type PlanoRecord = {
  id: string;
  fields: PlanoFields;
};

type NocoListResponse = {
  records?: PlanoRecord[];
  next?: string | null;
  prev?: string | null;
};

type PlanoUI = {
  tecnologia: string;
  modem: string;
  valor: string;
  ip: string;
  tempoSla: string;
  suporte: string;
  mostrarIp: boolean;
  mostrarModem: boolean;
};

const emptyPlano: PlanoUI = {
  tecnologia: "",
  modem: "",
  valor: "",
  ip: "",
  tempoSla: "",
  suporte: "",
  mostrarIp: false,
  mostrarModem: false,
};

function normalizePlanoFromField(value: any): PlanoUI {
  if (value === null || value === undefined || value === "") {
    return { ...emptyPlano };
  }

  let obj = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      obj = {};
    }
  }

  const tecnologia = obj.Tecnologia || obj.tecnologia || "";
  const modem =
    obj.Moldem || obj.Modem || obj.modem || obj.moldem || "";
  const valor = obj.Valor || obj.valor || "";
  const ip = obj.IP || obj.ip || "";
  const tempoSla =
    obj.Tempo_de_SLA || obj.tempoSla || obj.tempo_sla || "";
  const suporte = obj.Suporte || obj.suporte || "";

  const mostrarModem =
    typeof obj.Mostrar_Modem === "boolean"
      ? obj.Mostrar_Modem
      : !!modem;
  const mostrarIp =
    typeof obj.Mostrar_IP === "boolean"
      ? obj.Mostrar_IP
      : !!ip;

  return {
    tecnologia,
    modem,
    valor,
    ip,
    tempoSla,
    suporte,
    mostrarIp,
    mostrarModem,
  };
}

function planoToJson(p: PlanoUI) {
  if (!p) return null;

  const hasSomething =
    p.tecnologia ||
    p.modem ||
    p.valor ||
    p.ip ||
    p.tempoSla ||
    p.suporte;

  if (!hasSomething) return null;

  const payload: any = {
    Tecnologia: p.tecnologia,
    Valor: p.valor,
    Tempo_de_SLA: p.tempoSla,
    Suporte: p.suporte,
  };

  if (p.mostrarModem && p.modem) {
    payload.Moldem = p.modem;
    payload.Mostrar_Modem = true;
  } else {
    payload.Moldem = "";
    payload.Mostrar_Modem = false;
  }

  if (p.mostrarIp && p.ip) {
    payload.IP = p.ip;
    payload.Mostrar_IP = true;
  } else {
    payload.IP = "";
    payload.Mostrar_IP = false;
  }

  return payload;
}

type PlanoCardProps = {
  title: string;
  plano: PlanoUI;
  onChange: (plano: PlanoUI) => void;
};

function PlanoCard({ title, plano, onChange }: PlanoCardProps) {
  const modemDisabledClass = !plano.mostrarModem
    ? "bg-slate-100 opacity-60 cursor-not-allowed"
    : "";
  const ipDisabledClass = !plano.mostrarIp
    ? "bg-slate-100 opacity-60 cursor-not-allowed"
    : "";

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-800">
            {title}
          </p>
          <p className="text-[11px] text-slate-500">
            Ajuste os textos exibidos no site
          </p>
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
          Site
        </span>
      </div>

      <div className="grid gap-2 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Tecnologia
          </label>
          <input
            type="text"
            value={plano.tecnologia}
            onChange={(e) =>
              onChange({ ...plano, tecnologia: e.target.value })
            }
            placeholder='Ex: "100% Fibra Óptica"'
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-medium text-slate-600">
              Modem / Wi-Fi
            </label>
            <label className="flex items-center gap-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
                checked={plano.mostrarModem}
                onChange={(e) =>
                  onChange({
                    ...plano,
                    mostrarModem: e.target.checked,
                  })
                }
              />
              Mostrar no site
            </label>
          </div>
          <input
            type="text"
            value={plano.modem}
            onChange={(e) =>
              onChange({ ...plano, modem: e.target.value })
            }
            placeholder='Ex: "Moldem Wi-Fi 5G Premium"'
            disabled={!plano.mostrarModem}
            className={`mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200 ${modemDisabledClass}`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Valor
          </label>
          <input
            type="text"
            value={plano.valor}
            onChange={(e) =>
              onChange({ ...plano, valor: e.target.value })
            }
            placeholder='Ex: "R$ 199,90"'
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-medium text-slate-600">
              IP
            </label>
            <label className="flex items-center gap-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
                checked={plano.mostrarIp}
                onChange={(e) =>
                  onChange({
                    ...plano,
                    mostrarIp: e.target.checked,
                  })
                }
              />
              Mostrar no site
            </label>
          </div>
          <input
            type="text"
            value={plano.ip}
            onChange={(e) =>
              onChange({ ...plano, ip: e.target.value })
            }
            placeholder='Ex: "Fixo", "Dinâmico"'
            disabled={!plano.mostrarIp}
            className={`mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200 ${ipDisabledClass}`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Tempo de SLA
          </label>
          <input
            type="text"
            value={plano.tempoSla}
            onChange={(e) =>
              onChange({ ...plano, tempoSla: e.target.value })
            }
            placeholder='Ex: "48 horas"'
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Suporte
          </label>
          <input
            type="text"
            value={plano.suporte}
            onChange={(e) =>
              onChange({ ...plano, suporte: e.target.value })
            }
            placeholder='Ex: "Suporte especializado"'
            className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
          />
        </div>
      </div>
    </div>
  );
}

export function PlanosEmpresariaisSection() {
  const [records, setRecords] = useState<PlanoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] =
    useState<string | null>(null);

  const [startupPlano, setStartupPlano] =
    useState<PlanoUI>(emptyPlano);
  const [mediumPlano, setMediumPlano] =
    useState<PlanoUI>(emptyPlano);
  const [bigPlano, setBigPlano] = useState<PlanoUI>(emptyPlano);

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const selectedRecord = useMemo(
    () => (records.length > 0 ? records[0] : null),
    [records]
  );

  async function fetchRecords(showReloadSpinner = false) {
    if (!showReloadSpinner) {
      setLoading(true);
    } else {
      setReloading(true);
    }
    setError(null);
    setPermissionError(null);

    try {
      const resp = await api.get<NocoListResponse>(
        "/site/planos-empresariais"
      );

      const recs = Array.isArray(resp.data.records)
        ? resp.data.records
        : [];

      setRecords(recs);
    } catch (err: any) {
      console.error("[PlanosEmpresariais] Erro ao carregar:", err);
      setError(
        err?.response?.data?.error ||
          "Erro ao carregar planos empresariais."
      );
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }

  useEffect(() => {
    fetchRecords(false);
  }, []);

  useEffect(() => {
    if (!selectedRecord) {
      setStartupPlano(emptyPlano);
      setMediumPlano(emptyPlano);
      setBigPlano(emptyPlano);
      return;
    }

    const f = selectedRecord.fields || {};
    setStartupPlano(normalizePlanoFromField(f.Plano_Startup));
    setMediumPlano(normalizePlanoFromField(f.Plano_Medium));
    setBigPlano(normalizePlanoFromField(f.Plano_Big));
  }, [selectedRecord]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPermissionError(null);

    if (!selectedRecord) {
      setError("Nenhum registro de planos encontrado para salvar.");
      return;
    }

    const startupValue = planoToJson(startupPlano);
    const mediumValue = planoToJson(mediumPlano);
    const bigValue = planoToJson(bigPlano);

    setSaving(true);
    try {
      await api.patch(
        `/site/planos-empresariais/${selectedRecord.id}`,
        {
          fields: {
            Plano_Startup: startupValue,
            Plano_Medium: mediumValue,
            Plano_Big: bigValue,
          },
        }
      );

      // GET deu certo
      await fetchRecords(true);

      // PATCH + GET ok -> mostra popup
      setShowSuccessToast(true);
    } catch (err: any) {
      console.error("[PlanosEmpresariais] Erro ao salvar:", err);

      if (err?.response?.status === 403) {
        setPermissionError(
          "Você não tem permissão para editar esses planos. Apenas Admin / Gestor / Developer."
        );
      } else {
        setError(
          err?.response?.data?.error ||
            "Erro ao salvar planos empresariais."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateEmpty() {
    setError(null);
    setPermissionError(null);

    setSaving(true);
    try {
      await api.post("/site/planos-empresariais", {
        fields: {
          Plano_Startup: {},
          Plano_Medium: {},
          Plano_Big: {},
        },
      });

      await fetchRecords(true);
      setShowSuccessToast(true);
    } catch (err: any) {
      console.error("[PlanosEmpresariais] Erro ao criar:", err);
      if (err?.response?.status === 403) {
        setPermissionError(
          "Você não tem permissão para criar o registro de planos. Apenas Admin / Gestor / Developer."
        );
      } else {
        setError(
          err?.response?.data?.error ||
            "Erro ao criar registro de planos empresariais."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const hasRecord = !!selectedRecord;

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Planos Empresariais (Site)
              </h2>
              <p className="text-xs text-slate-500">
                Edite os textos dos planos exibidos no site público.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || reloading}
              onClick={() => fetchRecords(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              {reloading ? "Atualizando..." : "Recarregar"}
            </button>
          </div>
        </div>


        {(error || permissionError) && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {permissionError ?? error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              Carregando planos empresariais...
            </div>
          ) : !hasRecord ? (
            <div className="flex flex-col items-start gap-3 py-6 text-sm text-slate-600">
              <p>
                Nenhum registro de planos empresariais foi encontrado no
                NocoDB.
              </p>
              <button
                type="button"
                onClick={handleCreateEmpty}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Criando..." : "Criar registro padrão"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                <div>
                  <span className="font-medium text-slate-600">
                    Planos Empresariais:
                  </span>{" www.maxfibraltda.com.br/#/empresas"}

                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="grid gap-4 md:grid-cols-3">
                <PlanoCard
                  title="Plano Startup"
                  plano={startupPlano}
                  onChange={setStartupPlano}
                />
                <PlanoCard
                  title="Plano Medium"
                  plano={mediumPlano}
                  onChange={setMediumPlano}
                />
                <PlanoCard
                  title="Plano Big"
                  plano={bigPlano}
                  onChange={setBigPlano}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">


                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Popup de sucesso no canto inferior direito */}
      <PlanosSuccessToast
        open={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message="Informações salvas e site atualizado com sucesso."
      />
    </>
  );
}
