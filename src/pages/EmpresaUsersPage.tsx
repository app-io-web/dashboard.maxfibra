// src/pages/EmpresaUsersPage.tsx
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type EmpresaSettings = {
  id: string;
  auth_empresa_id: string;
  display_name: string | null;
};

type CreatedUser = {
  id: string;
  name: string;
  email?: string | null;
};

const ROLES = ["OWNER", "ADMIN", "MANAGER", "OPERATOR", "VIEWER"];

const PROFESSION_PRESETS = [
  "Financeiro",
  "Atendente",
  "CEO",
  "Gerente",
  "Atendente de loja",
];

export function EmpresaUsersPage() {
  const [empresa, setEmpresa] = useState<EmpresaSettings | null>(null);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [empresaError, setEmpresaError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("ADMIN");
  const [isCentralAdmin, setIsCentralAdmin] = useState(false);

  // CAMPOS PRINCIPAIS
  const [profession, setProfession] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadEmpresa() {
      setLoadingEmpresa(true);
      setEmpresaError(null);

      try {
        const res = await api.get<{ empresaSettings: EmpresaSettings | null }>(
          "/empresa/settings"
        );

        if (!isMounted) return;

        if (!res.data.empresaSettings) {
          setEmpresaError(
            "Nenhuma configuração de empresa encontrada. Configure a empresa antes de criar usuários."
          );
          setEmpresa(null);
        } else {
          setEmpresa(res.data.empresaSettings);
        }
      } catch (err: any) {
        console.error(err);
        if (!isMounted) return;
        const msg =
          err?.response?.data?.error ||
          "Erro ao carregar informações da empresa.";
        setEmpresaError(msg);
      } finally {
        if (isMounted) setLoadingEmpresa(false);
      }
    }

    loadEmpresa();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!empresa) return;

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    setCreatedUser(null);

    try {
      const payload: any = {
        name,
        empresaId: empresa.auth_empresa_id,
        role,
        isCentralAdmin,
        profession, // cargo / função
        data_nascimento: dataNascimento, // 'YYYY-MM-DD'
      };

      // CPF limpo
      if (cpf) {
        payload.cpf = cpf.replace(/\D/g, "");
      }

      const res = await api.post("/users", payload);

      setSuccessMessage(
        "Usuário pré-cadastrado com sucesso! Ele deverá usar 'Primeiro acesso' para definir e-mail e senha."
      );
      setCreatedUser(res.data.user || null);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        "Erro ao criar usuário. Verifique os dados e sua permissão.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Usuários da empresa
          </h2>
          <p className="text-sm text-slate-600">
            Crie novos usuários vinculados à empresa atual. Este é um
            pré-cadastro: o usuário irá definir e-mail e senha depois, na tela
            de &quot;Primeiro acesso&quot;.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/empresa-settings")}
          className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 shadow-sm transition"
        >
          ← Voltar para Empresa
        </button>
      </div>

      {loadingEmpresa && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Carregando dados da empresa...
        </div>
      )}

      {!loadingEmpresa && empresaError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {empresaError}
        </div>
      )}

      {!loadingEmpresa && !empresaError && empresa && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">
              Empresa atual
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {empresa.display_name || "Empresa sem nome"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              ID (auth_empresa_id):{" "}
              <span className="font-mono text-[11px] text-slate-700">
                {empresa.auth_empresa_id}
              </span>
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Criar novo usuário da empresa
            </h3>

            {/* Linha 1: nome / CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ex: Maria Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Usado para validação no fluxo de &quot;Primeiro acesso&quot;.
                </p>
              </div>
            </div>

            {/* Linha 2: role / profissão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Papel na empresa (role)
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-[11px] text-slate-500">
                  OWNER / ADMIN têm acesso total; MANAGER / OPERATOR / VIEWER
                  podem ser usados para permissões mais restritas depois.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Cargo / função (profession)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ex: Financeiro, Atendente, CEO..."
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {PROFESSION_PRESETS.map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setProfession(p)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Linha 3: data de nascimento + central admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Usado para exibir aniversário e validar o primeiro acesso.
                </p>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <input
                    id="central-admin"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={isCentralAdmin}
                    onChange={(e) => setIsCentralAdmin(e.target.checked)}
                  />
                  <label
                    htmlFor="central-admin"
                    className="text-xs text-slate-700"
                  >
                    Marcar como administrador global da Central
                    (is_central_admin)
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {successMessage}
                {createdUser && (
                  <div className="mt-1 text-[11px] text-emerald-700">
                    Usuário: {createdUser.name}
                    {createdUser.email
                      ? ` (${createdUser.email})`
                      : " (e-mail será definido no primeiro acesso)"}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !empresa}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Criando usuário..." : "Criar usuário"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
