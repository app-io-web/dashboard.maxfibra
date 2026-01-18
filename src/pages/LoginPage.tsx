import React, { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/auth";
import { api } from "../lib/api";

import { UpdateOverlay } from "../components/auth/UpdateOverlay";
import { useSwUpdateFlow } from "../hooks/useSwUpdateFlow";
import { useSession } from "../contexts/SessionContext";

import { AuthHeroLayout } from "../Citrus/Alt/Componentes/Auth/AuthHeroLayout";
import { AuthGlassCard } from "../Citrus/Alt/Componentes/Auth/AuthGlassCard";
import { AuthTabs, type AuthTabKey } from "../Citrus/Alt/Componentes/Auth/AuthTabs";
import { AuthAlert } from "../Citrus/Alt/Componentes/Auth/AuthAlert";
import { FormField } from "../Citrus/Alt/Componentes/Auth/FormField";
import { CapsLockHint } from "../Citrus/Alt/Componentes/Auth/CapsLockHint";
import { AuthActionButton } from "../Citrus/Alt/Componentes/Auth/AuthActionButton";
import { FloatingSlot } from "../Citrus/Alt/Componentes/Auth/FloatingSlot";
import { ImageBackground } from "../Citrus/Alt/Componentes/Auth/Backgrounds/ImageBackground";


function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

export function LoginPage() {
  const navigate = useNavigate();

  const { refreshPermissions, refreshBranding } = useSession();
  const swFlow = useSwUpdateFlow();

  const [activeTab, setActiveTab] = useState<AuthTabKey>("login");

  // login normal
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // primeiro acesso – passo 1
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // controle do fluxo
  const [firstAccessValidated, setFirstAccessValidated] = useState(false);

  // primeiro acesso – passo 2
  const [firstAccessEmail, setFirstAccessEmail] = useState("");
  const [firstAccessEmailConfirm, setFirstAccessEmailConfirm] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // CapsLock
  const [capsOn, setCapsOn] = useState(false);
  function handleCaps(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState?.("CapsLock") ?? false);
  }



  // Overlay login
  const LOGIN_OVERLAY_MIN_MS = 1400;

  const [loginOverlayOpen, setLoginOverlayOpen] = useState(false);
  const [loginOverlaySteps, setLoginOverlaySteps] = useState<{ label: string; done: boolean }[]>(
    [
      { label: "Iniciando sessão segura…", done: false },
      { label: "Sincronizando permissões e perfil…", done: false },
      { label: "Preparando seu painel…", done: false },
    ]
  );

  const [cpfCheckEnabled, setCpfCheckEnabled] = useState(true);

  const ADMIN_BYPASS_CODE = "ADMIN";




  function formatCpf(value: string) {
  // só números e no máx 11 dígitos
  const digits = value.replace(/\D/g, "").slice(0, 11);

  // aplica máscara 000.000.000-00
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}


  function handleCpfChange(v: string) {
    setCpf(formatCpf(v));
  }



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

      React.useEffect(() => {
    let buffer = "";
    let lastTypeAt = 0;

    function isTypingInEditableTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;

      const tag = el.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;

      // contenteditable (div editável etc.)
      if (el.isContentEditable) return true;

      return false;
    }

    function onKeyDown(e: KeyboardEvent) {
      // não captura se estiver digitando em input/textarea/contenteditable
      if (isTypingInEditableTarget(e.target)) return;

      // ignora teclas que não "digitam" caracteres
      if (e.key.length !== 1) return;

      const now = Date.now();

      // se ficar muito tempo sem digitar, reseta (evita buffer infinito)
      if (now - lastTypeAt > 1500) buffer = "";
      lastTypeAt = now;

      buffer += e.key;

      // limita tamanho do buffer
      if (buffer.length > 64) buffer = buffer.slice(-64);

      if (buffer.toLowerCase().endsWith(ADMIN_BYPASS_CODE.toLowerCase())) {
        setCpfCheckEnabled(false);

        // opcional: dá um feedback visual (se quiser)
        // setSuccess("Modo admin: checagem de CPF desativada.");
        // ou toast, etc.

        buffer = ""; // limpa pra não disparar de novo
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    }, []);


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const startedAt = Date.now();

    try {
      if (activeTab === "login") {
        setLoginOverlaySteps([
          { label: "Iniciando sessão segura…", done: false },
          { label: "Sincronizando permissões e perfil…", done: false },
          { label: "Preparando seu painel…", done: false },
        ]);
        setLoginOverlayOpen(true);

        await sleep(250);
        markDone(0);

        await login(loginEmail, loginPassword);

        markDone(1);
        await refreshPermissions();
        await refreshBranding();

        setAllDone();
        await sleep(220);

        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(LOGIN_OVERLAY_MIN_MS - elapsed, 0);
        if (remaining) await sleep(remaining);

        navigate("/dashboard", { replace: true });
        setLoginOverlayOpen(false);
        return;
      }

      const cpfClean = cpf.replace(/\D/g, "");

      if (!firstAccessValidated) {
        // ✅ Quando cpfCheckEnabled=false, a gente NÃO exige CPF nem valida CPF no front
        if (!fullName || (!birthDate) || (cpfCheckEnabled && !cpfClean)) {
          setError("Preencha nome completo, CPF e data de nascimento.");
          return;
        }

        await api.post("/auth/first-access/validate", {
          full_name: fullName,
          cpf: cpfClean, // ✅ SEMPRE envia o CPF
          birth_date: birthDate,
          // ✅ opcional (recomendado): backend ignora validação quando false
          skip_cpf_validation: !cpfCheckEnabled,
        });

        setFirstAccessValidated(true);
        setSuccess("Dados validados! Agora defina o e-mail que deseja usar e a sua senha.");
      } else {
        if (!firstAccessEmail || !firstAccessEmailConfirm || !newPassword || !confirmPassword) {
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
          cpf: cpfClean, // ✅ SEMPRE envia o CPF
          birth_date: birthDate,
          email: firstAccessEmail,
          password: newPassword,
          // ✅ opcional (recomendado): backend ignora validação quando false
          skip_cpf_validation: !cpfCheckEnabled,
        });

        setSuccess("Acesso criado com sucesso! Agora você já pode fazer login com seu e-mail e a nova senha.");
        resetFirstAccessState();
        setActiveTab("login");
      }
    } catch (err: any) {
      console.error(err);

      if (activeTab === "login") setLoginOverlayOpen(false);

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



  const buttonLabel = (() => {
    if (submitting) {
      if (activeTab === "login") return "Entrando...";
      return firstAccessValidated ? "Criando acesso..." : "Validando...";
    }
    if (activeTab === "login") return "Entrar";
    return firstAccessValidated ? "Criar acesso" : "Validar dados";
  })();

  const overlayOpen = loginOverlayOpen || swFlow.open;
  const overlaySteps = useMemo(() => {
    if (loginOverlayOpen) return loginOverlaySteps;
    return swFlow.steps;
  }, [loginOverlayOpen, loginOverlaySteps, swFlow.steps]);

  return (
    <>
      <UpdateOverlay open={overlayOpen} steps={overlaySteps} />

      <AuthHeroLayout
        backgroundMode="none"
        hideBackgroundOnMobile
        rightWidthPx={440}
        rightGutterClassName="md:pr-12 2xl:pr-24"
        backgroundSlot={<ImageBackground opacity={0.98} objectPosition="left center" />}
      >
        <AuthGlassCard
          title="Central Administrativa"
          subtitle={activeTab === "login" ? "Entre na sua conta" : "Primeiro acesso"}
          footer={
            <p className="text-center text-[11px] text-slate-400">
              Versão interna · Max Fibra · {new Date().getFullYear()}
            </p>
          }
        >
          <AuthTabs
            active={activeTab}
            onChange={(key) => {
              setError(null);
              setSuccess(null);
              setActiveTab(key);
            }}
          />

          {success && <AuthAlert variant="success">{success}</AuthAlert>}
          {error && <AuthAlert variant="error">{error}</AuthAlert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "login" ? (
              <>
                <FormField
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  value={loginEmail}
                  onChange={setLoginEmail}
                />

                <div>
                  <FormField
                    label="Senha"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    onKeyDown={handleCaps}
                    onKeyUp={handleCaps}
                  />
                  <CapsLockHint show={capsOn} />
                </div>
              </>
            ) : (
              <>
                <FormField
                  label="Nome completo"
                  placeholder="Nome exatamente como foi cadastrado"
                  value={fullName}
                  onChange={setFullName}
                />

                <FormField
                  label="CPF"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                />


                <FormField
                  label="Data de nascimento"
                  type="date"
                  value={birthDate}
                  onChange={setBirthDate}
                />

                {firstAccessValidated && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-3">
                    <p className="text-[11px] text-blue-800 font-medium">
                      Dados validados. Agora escolha o e-mail e a senha que você quer usar.
                    </p>

                    <FormField
                      label="E-mail desejado"
                      type="email"
                      placeholder="voce@empresa.com.br"
                      value={firstAccessEmail}
                      onChange={setFirstAccessEmail}
                    />

                    <FormField
                      label="Confirmar e-mail"
                      type="email"
                      placeholder="Digite o e-mail novamente"
                      value={firstAccessEmailConfirm}
                      onChange={setFirstAccessEmailConfirm}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        label="Nova senha"
                        type="password"
                        placeholder="Defina a sua senha"
                        value={newPassword}
                        onChange={setNewPassword}
                        onKeyDown={handleCaps}
                        onKeyUp={handleCaps}
                      />
                      <FormField
                        label="Confirmar senha"
                        type="password"
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        onKeyDown={handleCaps}
                        onKeyUp={handleCaps}
                      />
                    </div>

                    <CapsLockHint show={capsOn} />
                  </div>
                )}
              </>
            )}

            <AuthActionButton label={buttonLabel} disabled={submitting} />
          </form>
        </AuthGlassCard>
      </AuthHeroLayout>
    </>
  );
}
