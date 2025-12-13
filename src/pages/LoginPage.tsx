// src/pages/LoginPage.tsx
import React, { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/auth";
import { api } from "../lib/api";

import { UpdateOverlay } from "../components/auth/UpdateOverlay";
import { useSwUpdateFlow } from "../hooks/useSwUpdateFlow";

// ✅ ADD
import { useSession } from "../contexts/SessionContext";

type ActiveTab = "login" | "firstAccess";

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

export function LoginPage() {
  const navigate = useNavigate();

  // ✅ sessão (pra matar o bug do menu travado no primeiro login)
  const { refreshPermissions, refreshBranding } = useSession();

  // 🔥 fluxo SW update (overlay + steps)
  const swFlow = useSwUpdateFlow();

  const [activeTab, setActiveTab] = useState<ActiveTab>("login");

  // login normal
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // primeiro acesso – passo 1 (identidade)
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // controle do fluxo
  const [firstAccessValidated, setFirstAccessValidated] = useState(false);

  // primeiro acesso – passo 2 (credenciais)
  const [firstAccessEmail, setFirstAccessEmail] = useState("");
  const [firstAccessEmailConfirm, setFirstAccessEmailConfirm] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ Caps Lock
  const [capsOn, setCapsOn] = useState(false);
  function handleCaps(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState?.("CapsLock") ?? false);
  }

  // 🧼 Overlay do LOGIN (usa done:boolean pq UpdateOverlay calcula porcentagem por isso)
  const LOGIN_OVERLAY_MIN_MS = 1400;

  const [loginOverlayOpen, setLoginOverlayOpen] = useState(false);
  const [loginOverlaySteps, setLoginOverlaySteps] = useState<
    { label: string; done: boolean }[]
  >([
    { label: "Iniciando sessão segura…", done: false },
    { label: "Sincronizando permissões e perfil…", done: false },
    { label: "Preparando seu painel…", done: false },
  ]);

  function resetFirstAccessState() {
    setFullName("");
    setCpf("");
    setBirthDate("");
    setFirstAccessValidated(false);
    setFirstAccessEmail("");
    setFirstAccessEmailConfirm("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function markDone(index: number) {
    setLoginOverlaySteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, done: true } : s))
    );
  }

  function setAllDone() {
    setLoginOverlaySteps((prev) => prev.map((s) => ({ ...s, done: true })));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const startedAt = Date.now();

    try {
      if (activeTab === "login") {
        // ✅ abre overlay IMEDIATO
        setLoginOverlaySteps([
          { label: "Iniciando sessão segura…", done: false },
          { label: "Sincronizando permissões e perfil…", done: false },
          { label: "Preparando seu painel…", done: false },
        ]);
        setLoginOverlayOpen(true);

        // micro-progresso (feedback instant)
        await sleep(250);
        markDone(0);

        // login real
        await login(loginEmail, loginPassword);

        // ✅ AQUI É O PULO DO GATO:
        // força SessionContext carregar permissões/branding ANTES do dashboard montar
        markDone(1);
        await refreshPermissions();
        await refreshBranding();

        // ✅ FINALIZA 100% ANTES DE NAVEGAR
        setAllDone();
        await sleep(220); // dá tempo de VER os OK

        // ✅ garante tempo mínimo total do overlay de login
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(LOGIN_OVERLAY_MIN_MS - elapsed, 0);
        if (remaining) await sleep(remaining);

        // navega (agora sim)
        navigate("/dashboard", { replace: true });

        // fallback (se por algum motivo não desmontar)
        setLoginOverlayOpen(false);
        return;
      }

      // fluxo de primeiro acesso
      const cpfClean = cpf.replace(/\D/g, "");

      if (!firstAccessValidated) {
        // PASSO 1: validar dados básicos
        if (!fullName || !cpfClean || !birthDate) {
          setError("Preencha nome completo, CPF e data de nascimento.");
          return;
        }

        await api.post("/auth/first-access/validate", {
          full_name: fullName,
          cpf: cpfClean,
          birth_date: birthDate,
        });

        setFirstAccessValidated(true);
        setSuccess(
          "Dados validados! Agora defina o e-mail que deseja usar e a sua senha."
        );
      } else {
        // PASSO 2: criar e-mail + senha
        if (
          !firstAccessEmail ||
          !firstAccessEmailConfirm ||
          !newPassword ||
          !confirmPassword
        ) {
          setError("Preencha todos os campos de e-mail e senha.");
          return;
        }

        if (firstAccessEmail !== firstAccessEmailConfirm) {
          setError("A confirmação de e-mail não confere.");
          return;
        }

        if (newPassword !== confirmPassword) {
          setError("A confirmação de senha não confere.");
          return;
        }

        await api.post("/auth/first-access", {
          full_name: fullName,
          cpf: cpfClean,
          birth_date: birthDate,
          email: firstAccessEmail,
          password: newPassword,
        });

        setSuccess(
          "Acesso criado com sucesso! Agora você já pode fazer login com seu e-mail e a nova senha."
        );

        // limpa fluxo de primeiro acesso e volta pra aba login
        resetFirstAccessState();
        setActiveTab("login");
      }
    } catch (err: any) {
      console.error(err);

      // se deu erro no login, mata overlay
      if (activeTab === "login") {
        setLoginOverlayOpen(false);
      }

      const msg =
        err?.response?.data?.error ||
        (activeTab === "login"
          ? "Erro ao fazer login. Verifique as credenciais."
          : firstAccessValidated
          ? "Não foi possível criar o acesso. Verifique os dados informados."
          : "Não foi possível validar seus dados. Verifique as informações.");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const firstAccessButtonLabel = (() => {
    if (submitting) {
      if (activeTab === "login") return "Entrando...";
      return firstAccessValidated ? "Criando acesso..." : "Validando...";
    }

    if (activeTab === "login") return "Entrar";
    return firstAccessValidated ? "Criar acesso" : "Validar dados";
  })();

  // ✅ Decide qual overlay mostrar:
  // - Se o overlay do login estiver aberto, ele tem prioridade
  // - Se não, cai pro overlay do SW update
  const overlayOpen = loginOverlayOpen || swFlow.open;

  const overlaySteps = useMemo(() => {
    if (loginOverlayOpen) return loginOverlaySteps;
    return swFlow.steps; // swFlow.steps já é {label, done}
  }, [loginOverlayOpen, loginOverlaySteps, swFlow.steps]);

  return (
    <>
      {/* 🔥 Overlay (Login ou SW Update) */}
      <UpdateOverlay open={overlayOpen} steps={overlaySteps} />

      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <span className="text-emerald-600 font-semibold text-xl">MX</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              Central Administrativa Max Fibra
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Acesse seu painel interno.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            {/* Abas: login x primeiro acesso */}
            <div className="flex mb-4 rounded-lg bg-slate-50 p-1 text-xs font-medium">
              <button
                type="button"
                className={`flex-1 rounded-md py-2 transition ${
                  activeTab === "login"
                    ? "bg-white shadow-sm text-emerald-600 border border-slate-200"
                    : "text-slate-500"
                }`}
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setActiveTab("login");
                }}
              >
                Já tenho acesso
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md py-2 transition ${
                  activeTab === "firstAccess"
                    ? "bg-white shadow-sm text-emerald-600 border border-slate-200"
                    : "text-slate-500"
                }`}
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setActiveTab("firstAccess");
                }}
              >
                Primeiro acesso
              </button>
            </div>

            {success && (
              <div className="mb-3 text-xs rounded-lg border border-emerald-500/40 bg-emerald-50 text-emerald-700 px-3 py-2">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-3 text-xs rounded-lg border border-red-500/40 bg-red-50 text-red-600 px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "login" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="voce@empresa.com.br"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={handleCaps}
                      onKeyUp={handleCaps}
                    />

                    {capsOn && (
                      <div className="mt-2 text-[11px] rounded-lg border border-amber-500/40 bg-amber-50 text-amber-700 px-3 py-2">
                        Caps Lock ativado.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* PASSO 1: dados de validação */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nome exatamente como foi cadastrado"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Data de nascimento
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>

                  {/* PASSO 2: só aparece depois que validou */}
                  {firstAccessValidated && (
                    <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 space-y-3">
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Dados validados. Agora escolha o e-mail e a senha que
                        você quer usar para acessar a Central.
                      </p>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          E-mail desejado
                        </label>
                        <input
                          type="email"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="voce@empresa.com.br"
                          value={firstAccessEmail}
                          onChange={(e) => setFirstAccessEmail(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Confirmar e-mail
                        </label>
                        <input
                          type="email"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Digite o e-mail novamente"
                          value={firstAccessEmailConfirm}
                          onChange={(e) =>
                            setFirstAccessEmailConfirm(e.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Nova senha
                          </label>
                          <input
                            type="password"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Defina a sua senha"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyDown={handleCaps}
                            onKeyUp={handleCaps}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Confirmar senha
                          </label>
                          <input
                            type="password"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={handleCaps}
                            onKeyUp={handleCaps}
                          />
                        </div>
                      </div>

                      {capsOn && (
                        <div className="text-[11px] rounded-lg border border-amber-500/40 bg-amber-50 text-amber-700 px-3 py-2">
                          Caps Lock ativado.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-medium py-2.5 mt-2 hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {firstAccessButtonLabel}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              Versão interna · Max Fibra · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
