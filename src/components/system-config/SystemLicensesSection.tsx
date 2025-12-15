import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Coins,
  Loader2,
  Plus,
  Search,
  Ticket,
} from "lucide-react";

type License = {
  id: string;
  name: string;
  duration_days: number; // 30 | 60 | 365
  price_cents: number; // armazenar como centavos evita dor de cabeça
  is_active: boolean;
  created_at?: string;
};

type EmpresaMini = {
  id: string;
  display_name: string | null;
};

type LicenseAssignment = {
  id: string;
  empresa_id: string;
  license_id: string;
  starts_at: string;
  expires_at: string;
  is_paid: boolean; // verificação manual
  created_at?: string;
  license?: License;
};

type GraceItem = {
  id: string;
  empresa_id: string;
  display_name: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at?: string;
};

function formatMoneyBRLFromCents(cents: number) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR");
}

function daysLeft(expiresAt?: string) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function SystemLicensesSection() {
  const [loading, setLoading] = useState(true);

  const [licenses, setLicenses] = useState<License[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaMini[]>([]);

  // criar licença
  const [newName, setNewName] = useState("Licença Padrão");
  const [newDurationDays, setNewDurationDays] = useState<30 | 60 | 365>(30);
  const [newPriceBRL, setNewPriceBRL] = useState("99,90");
  const [creating, setCreating] = useState(false);

  // atribuir
  const [empresaQuery, setEmpresaQuery] = useState("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);


  const [gracesLoading, setGracesLoading] = useState(false);
  const [graces, setGraces] = useState<GraceItem[]>([]);
  const [graceQuery, setGraceQuery] = useState("");

  // status atual da empresa
  const [currentAssignment, setCurrentAssignment] =
    useState<LicenseAssignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [togglingPaid, setTogglingPaid] = useState(false);


  function hoursLeft(endsAt?: string) {
    if (!endsAt) return null;
    const ms = new Date(endsAt).getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60));
  }


    async function loadBase() {
    setLoading(true);
    setGracesLoading(true);

    try {
      const [licRes, empRes, graceRes] = await Promise.all([
        api.get<{ licenses: License[] }>("/system/licenses"),
        api.get<{ empresas: any[] }>("/system/empresas/min"),
        api.get<{ graces: GraceItem[] }>("/system/license/grace/active"),
      ]);

      setLicenses(licRes.data.licenses || []);

      const normalizedEmpresas: EmpresaMini[] = (empRes.data.empresas || []).map(
        (e) => ({
          id: e.id ?? e.auth_empresa_id ?? e.auth_empresaId ?? "",
          display_name: e.display_name ?? e.displayName ?? null,
        })
      );

      setEmpresas(normalizedEmpresas.filter((e) => !!e.id));
      setGraces(graceRes.data.graces || []);

      if (!selectedLicenseId && licRes.data.licenses?.[0]?.id) {
        setSelectedLicenseId(licRes.data.licenses[0].id);
      }
    } catch (err) {
      console.error("[SystemLicensesSection] loadBase error:", err);
      setLicenses([]);
      setEmpresas([]);
      setGraces([]);
    } finally {
      setLoading(false);
      setGracesLoading(false);
    }
  }




  async function loadEmpresaAssignment(empresaId: string) {
    if (!empresaId) {
      setCurrentAssignment(null);
      return;
    }

    setLoadingAssignment(true);
    try {
      const res = await api.get<{ assignment: LicenseAssignment | null }>(
        `/system/empresas/${empresaId}/license`
      );
      setCurrentAssignment(res.data.assignment);
    } finally {
      setLoadingAssignment(false);
    }
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEmpresaAssignment(selectedEmpresaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpresaId]);

  const empresasFiltered = useMemo(() => {
    const q = empresaQuery.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter((e) =>
      (e.display_name || "").toLowerCase().includes(q)
    );
  }, [empresas, empresaQuery]);

  const gracesFiltered = useMemo(() => {
    const q = graceQuery.trim().toLowerCase();
    if (!q) return graces;

    return graces.filter((g) => {
      const name = (g.display_name || "").toLowerCase();
      const reason = (g.reason || "").toLowerCase();
      return name.includes(q) || reason.includes(q);
    });
  }, [graces, graceQuery]);


  const activeLicenses = useMemo(
    () => licenses.filter((l) => l.is_active),
    [licenses]
  );

  function parseBRLToCents(str: string) {
    // aceita "99,90" ou "99.90" ou "99"
    const normalized = str
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");
    const num = Number(normalized);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 100);
  }

  async function onCreateLicense() {
    setCreating(true);
    try {
      const priceCents = parseBRLToCents(newPriceBRL);

      await api.post("/system/licenses", {
        name: newName.trim(),
        duration_days: newDurationDays,
        price_cents: priceCents,
      });

      await loadBase();
    } finally {
      setCreating(false);
    }
  }

  async function onToggleLicenseActive(licenseId: string, next: boolean) {
    // “desativa” sem apagar (pra não virar cemitério de FK)
    await api.patch(`/system/licenses/${licenseId}`, {
      is_active: next,
    });
    await loadBase();
  }

  async function onAssign() {
    if (!selectedEmpresaId || !selectedLicenseId) return;

    setAssigning(true);
    try {
      await api.post(`/system/license-assignments`, {
        empresa_id: selectedEmpresaId,
        license_id: selectedLicenseId,
        starts_at: new Date().toISOString(),
      });

      await loadEmpresaAssignment(selectedEmpresaId);
    } finally {
      setAssigning(false);
    }
  }

  async function onTogglePaid() {
    if (!currentAssignment?.id) return;

    setTogglingPaid(true);
    try {
      await api.patch(`/system/license-assignments/${currentAssignment.id}`, {
        is_paid: !currentAssignment.is_paid,
      });
      await loadEmpresaAssignment(selectedEmpresaId);
    } finally {
      setTogglingPaid(false);
    }
  }

  const remaining = daysLeft(currentAssignment?.expires_at);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
              <Ticket className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Licenças do sistema
              </h2>
              <p className="text-sm text-slate-600">
                Criar licenças e atribuir para empresas (pagamento manual).
              </p>
            </div>
          </div>

          {loading && (
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando…
            </div>
          )}
        </div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CRIAR LICENÇA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Criar licença
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700">
                Nome
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
                placeholder="Ex.: Licença 30 dias (Admin)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Duração
                </label>
                <div className="mt-1 relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={newDurationDays}
                    onChange={(e) =>
                      setNewDurationDays(Number(e.target.value) as 30 | 60 | 365)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
                  >
                    <option value={30}>30 dias</option>
                    <option value={60}>60 dias</option>
                    <option value={365}>1 ano (365)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Valor (R$)
                </label>
                <div className="mt-1 relative">
                  <Coins className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={newPriceBRL}
                    onChange={(e) => setNewPriceBRL(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
                    placeholder="99,90"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onCreateLicense}
              disabled={creating || !newName.trim()}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar licença
                </>
              )}
            </button>

            <p className="text-xs text-slate-500">
              Dica nerd: salvar preço em centavos evita “R$ 0,30000000004”.
            </p>
          </div>
        </div>

        {/* ATRIBUIR LICENÇA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              Atribuir licença a empresa
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700">
                Buscar empresa
              </label>
              <div className="mt-1 relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={empresaQuery}
                  onChange={(e) => setEmpresaQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
                  placeholder="Digite o nome da empresa…"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Empresa
              </label>
              <select
                value={selectedEmpresaId}
                onChange={(e) => setSelectedEmpresaId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
              >
                <option value="">Selecione…</option>
                {empresasFiltered.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.display_name || "(Sem nome)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Licença
              </label>
              <select
                value={selectedLicenseId}
                onChange={(e) => setSelectedLicenseId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400"
              >
                {activeLicenses.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} • {l.duration_days}d •{" "}
                    {formatMoneyBRLFromCents(l.price_cents)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onAssign}
              disabled={!selectedEmpresaId || !selectedLicenseId || assigning}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-60"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Atribuindo…
                </>
              ) : (
                <>
                  <BadgeCheck className="h-4 w-4" />
                  Atribuir licença
                </>
              )}
            </button>

            {/* STATUS ATUAL */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">
                  Status da empresa
                </p>
                {loadingAssignment && (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    carregando…
                  </span>
                )}
              </div>

              {!selectedEmpresaId ? (
                <p className="mt-2 text-sm text-slate-600">
                  Selecione uma empresa pra ver a licença atual.
                </p>
              ) : !currentAssignment ? (
                <p className="mt-2 text-sm text-slate-600">
                  Nenhuma licença atribuída ainda (a empresa tá vivendo no modo
                  trial eterno… perigoso 😅).
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="text-sm text-slate-800">
                    <span className="font-semibold">
                      {currentAssignment.license?.name || "Licença"}
                    </span>{" "}
                    • expira em{" "}
                    <span className="font-medium">
                      {formatDateBR(currentAssignment.expires_at)}
                    </span>
                    {typeof remaining === "number" && (
                      <span className="text-slate-600">
                        {" "}
                        • ({remaining} dia(s) restantes)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                      Pago (manual):{" "}
                      <span
                        className={`font-semibold ${
                          currentAssignment.is_paid
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {currentAssignment.is_paid ? "SIM" : "NÃO"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onTogglePaid}
                      disabled={togglingPaid}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      {togglingPaid ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Salvando…
                        </>
                      ) : currentAssignment.is_paid ? (
                        "Marcar como NÃO pago"
                      ) : (
                        "Marcar como pago"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

              {/* EMPRESAS EM GRACE */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Empresas usando Grace
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              Lista das empresas que estão no “modo pagar mais tarde” (grace ativa).
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-600">Ativas agora</div>
            <div className="text-2xl font-semibold text-slate-900">
              {graces.length}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={graceQuery}
              onChange={(e) => setGraceQuery(e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400"
              placeholder="Buscar por empresa ou motivo…"
            />
          </div>

          {gracesLoading && (
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando graces…
            </div>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Termina em</th>
                <th className="px-4 py-3">Restante</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-100">
              {gracesFiltered.map((g) => {
                const hrs = hoursLeft(g.ends_at);
                const danger = typeof hrs === "number" && hrs <= 6;

                return (
                  <tr key={g.id} className="text-slate-800">
                    <td className="px-4 py-3 font-medium">
                      {g.display_name || "(Sem nome)"}{" "}
                      <div className="text-xs text-slate-500">
                        {g.empresa_id}
                      </div>
                    </td>

                    <td className="px-4 py-3">{formatDateBR(g.ends_at)}</td>

                    <td className="px-4 py-3">
                      {typeof hrs === "number" ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            danger
                              ? "bg-rose-500/10 text-rose-700"
                              : "bg-amber-500/10 text-amber-800"
                          }`}
                        >
                          {hrs}h
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-slate-700">
                        {g.reason || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedEmpresaId(g.empresa_id)}
                        className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-amber-50"
                      >
                        Ver empresa
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!gracesLoading && gracesFiltered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-600" colSpan={5}>
                    Nenhuma empresa está em grace agora. Milagre? Ou boleto pago? 👀
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-600">
          Dica: quando faltar ≤ 6h eu já pinto de “perigo” pra você sentir o drama.
        </p>
      </div>

      </div>

      {/* LISTA DE LICENÇAS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Licenças cadastradas
        </h3>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {licenses.map((l) => (
                <tr key={l.id} className="text-slate-800">
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3">{l.duration_days} dias</td>
                  <td className="px-4 py-3">
                    {formatMoneyBRLFromCents(l.price_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        l.is_active
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-slate-500/10 text-slate-700"
                      }`}
                    >
                      {l.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleLicenseActive(l.id, !l.is_active)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-100"
                    >
                      {l.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && licenses.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                    Nenhuma licença criada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Recomendo “desativar” ao invés de deletar: seu banco agradece e para de
          jogar FK na sua cara.
        </p>
      </div>
    </section>
  );
}
