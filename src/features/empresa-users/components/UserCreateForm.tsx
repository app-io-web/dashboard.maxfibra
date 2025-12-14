import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CreatedUser, EmpresaSettings, ProfileItem } from "../types";
import { ROLES, PROFESSION_PRESETS } from "../constants";
import { AllowedProfilesSelect } from "./AllowedProfilesSelect";
import { api } from "../../../lib/api";

type Props = {
  empresas: EmpresaSettings[];
  defaultEmpresaId?: string | null;
  onCreated: () => Promise<void> | void;
  allowedProfiles: ProfileItem[];
  loadingProfiles: boolean;
  profilesError: string | null;
};

export function UserCreateForm(props: Props) {
  const {
    empresas,
    defaultEmpresaId,
    onCreated,
    allowedProfiles,
    loadingProfiles,
    profilesError,
  } = props;

  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("ADMIN");
  const [isCentralAdmin, setIsCentralAdmin] = useState(false);
  const [profession, setProfession] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");

  // 🔥 flag pra saber se o cara mexeu manualmente no select
  const userPickedEmpresaRef = useRef(false);

  const empresaOptions = useMemo(() => {
    return (empresas || []).map((e) => ({
      id: String(e.auth_empresa_id),
      label:
        (e.display_name && String(e.display_name).trim()) || e.auth_empresa_id,
    }));
  }, [empresas]);

  const empresaIdsSet = useMemo(() => {
    return new Set(empresaOptions.map((e) => e.id));
  }, [empresaOptions]);

  // ✅ empresa selecionada (inicial)
  const [empresaId, setEmpresaId] = useState<string>(() => {
    return (
      String(defaultEmpresaId || "") ||
      String(empresas?.[0]?.auth_empresa_id || "")
    );
  });

  // ✅ quando muda a empresa "padrão" vinda de fora (troca no switcher),
  // a gente permite voltar a seguir o default novamente.
  useEffect(() => {
    userPickedEmpresaRef.current = false;
  }, [defaultEmpresaId]);

  // ✅ FIX REAL: não deixa o effect “desfazer” a escolha do usuário
  useEffect(() => {
    const firstId = empresaOptions[0]?.id || "";
    const defaultId =
      defaultEmpresaId && empresaIdsSet.has(String(defaultEmpresaId))
        ? String(defaultEmpresaId)
        : "";

    const desired = defaultId || firstId;
    if (!desired) return;

    setEmpresaId((prev) => {
      const prevValid = !!prev && empresaIdsSet.has(String(prev));

      // se o usuário já escolheu manualmente e o valor ainda é válido, respeita
      if (userPickedEmpresaRef.current && prevValid) return prev;

      // se não tem nada selecionado OU ficou inválido, aplica o desired (default/first)
      if (!prev || !prevValid) return desired;

      // se ainda não escolheu manualmente, pode sincronizar com o desired
      if (!userPickedEmpresaRef.current && prev !== desired) return desired;

      return prev;
    });
  }, [defaultEmpresaId, empresaOptions, empresaIdsSet]);

  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  const allowedIdsSet = useMemo(
    () => new Set((allowedProfiles || []).map((p) => String(p.id))),
    [allowedProfiles]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    setCreatedUser(null);

    try {
      if (!empresaId) throw new Error("Selecione uma empresa para vincular o usuário.");

      const safeProfileIds = profileIds
        .map(String)
        .filter((id) => allowedIdsSet.has(id));

      const payload: any = {
        name,
        empresaId, // compat
        auth_empresa_id: empresaId, // certo
        role,
        isCentralAdmin,
        profession,
        data_nascimento: dataNascimento,
      };

      if (cpf) payload.cpf = cpf.replace(/\D/g, "");

      const res = await api.post("/users", payload);
      const user = res.data?.user || null;
      setCreatedUser(user);

      if (user?.id && safeProfileIds.length > 0) {
        await Promise.all(
          safeProfileIds.map((profile_id) =>
            api.post("/rbac/allowed-profiles/assign-to-user", {
              auth_user_id: user.id,
              auth_empresa_id: empresaId,
              profile_id,
              is_active: true,
            })
          )
        );
      }

      setSuccessMessage(
        "Usuário pré-cadastrado com sucesso! Ele deverá usar 'Primeiro acesso' para definir e-mail e senha."
      );

      await onCreated();

      setName("");
      setCpf("");
      setProfession("");
      setDataNascimento("");
      setRole("ADMIN");
      setIsCentralAdmin(false);
      setProfileIds([]);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Erro ao criar usuário. Verifique os dados e sua permissão."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-slate-900 mb-1">
        Criar novo usuário
      </h3>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Vincular o usuário em qual empresa?
        </label>

        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={empresaId}
          onChange={(e) => {
            userPickedEmpresaRef.current = true; // 🔥 agora é “minha escolha, respeita”
            setEmpresaId(e.target.value);
          }}
          required
          disabled={empresaOptions.length === 0}
        >
          {empresaOptions.length === 0 ? (
            <option value="">Nenhuma empresa disponível</option>
          ) : (
            empresaOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))
          )}
        </select>

        <p className="mt-1 text-[11px] text-slate-500">
          Esse vínculo é o que habilita perfis e permissões na empresa escolhida.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Nome completo
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Papel na empresa (role)
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Cargo / função (profession)
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AllowedProfilesSelect
        value={profileIds}
        onChange={setProfileIds}
        options={allowedProfiles}
        loading={loadingProfiles}
        error={profilesError}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Data de nascimento
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            required
          />
        </div>

        <div className="flex items-end">
          <div className="flex items-center gap-2">
            <input
              id="central-admin"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              checked={isCentralAdmin}
              onChange={(e) => setIsCentralAdmin(e.target.checked)}
            />
            <label htmlFor="central-admin" className="text-xs text-slate-700">
              Marcar como administrador global da Central (is_central_admin)
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
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {successMessage}
          {createdUser && (
            <div className="mt-1 text-[11px] text-blue-700">
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
          disabled={submitting || !empresaId || empresaOptions.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Criando usuário..." : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
