import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "../../contexts/SessionContext";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiClock,
  FiExternalLink,
  FiMessageSquare,
  FiRefreshCw,
  FiArrowLeft,
  FiInfo,
} from "react-icons/fi";

const PAYMENT_URL =
  "https://invoice.infinitepay.io/joao-carlos-lopes19/gh95TD3FR";

// coloca no .env: VITE_LICENSE_WHATSAPP=5581999999999 (DDD + número, só dígitos)
const WHATSAPP_NUMBER =
  import.meta.env.VITE_LICENSE_WHATSAPP || "5527998168674";

const LS_KEY = "mx_license_renew_clicked_v1";

function formatDateBR(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

function buildWhatsAppLink(opts: { number: string; message: string }) {
  const msg = encodeURIComponent(opts.message);
  return `https://wa.me/${opts.number}?text=${msg}`;
}

type StatusUI = {
  tag: string;
  tone: string;
  dot: string;
  icon: React.ReactNode;
  title: string;
};

export function LicensePage() {
  const { licenseStatus, empresaId, empresaBranding, me } = useSession() as any;

  const [renewClicked, setRenewClicked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(LS_KEY);
    setRenewClicked(!!raw);
  }, []);

  const exp = useMemo(
    () => formatDateBR(licenseStatus?.expires_at),
    [licenseStatus?.expires_at]
  );
  const starts = useMemo(
    () => formatDateBR(licenseStatus?.starts_at),
    [licenseStatus?.starts_at]
  );

  const empresaNome = empresaBranding?.display_name || "Empresa";
  const userName = me?.name || "Usuário";

  const statusUI: StatusUI = useMemo(() => {
    if (!licenseStatus?.has_license) {
      return {
        tag: "SEM LICENÇA",
        title: "Nenhuma licença encontrada",
        tone: "border-amber-200 bg-amber-50 text-amber-800 ring-amber-100",
        dot: "bg-amber-500",
        icon: <FiAlertTriangle className="h-4 w-4" />,
      };
    }

    if (licenseStatus?.is_valid_now) {
      return {
        tag: "ATIVA",
        title: "Licença ativa",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-800 ring-emerald-100",
        dot: "bg-emerald-500",
        icon: <FiCheckCircle className="h-4 w-4" />,
      };
    }

    if (licenseStatus?.is_paid) {
      return {
        tag: "EXPIRADA",
        title: "Licença expirada",
        tone: "border-rose-200 bg-rose-50 text-rose-800 ring-rose-100",
        dot: "bg-rose-500",
        icon: <FiXCircle className="h-4 w-4" />,
      };
    }

    return {
      tag: "PENDENTE",
      title: "Aguardando confirmação de pagamento",
      tone: "border-sky-200 bg-sky-50 text-sky-800 ring-sky-100",
      dot: "bg-sky-500",
      icon: <FiClock className="h-4 w-4" />,
    };
  }, [licenseStatus]);

  const headerTitle = useMemo(() => {
    if (!licenseStatus?.has_license) return "Licença necessária para acesso";
    if (licenseStatus?.is_valid_now) return "Licença ativa";
    if (licenseStatus?.is_paid) return "Licença expirada";
    return "Pagamento em validação";
  }, [licenseStatus]);

  const headerDesc = useMemo(() => {
    if (!licenseStatus?.has_license) {
      return "Não há uma licença ativa vinculada a esta empresa. Para liberar o acesso, é necessário renovar/ativar.";
    }
    if (licenseStatus?.is_valid_now) {
      return `A licença está ativa${exp ? ` até ${exp}` : ""}.`;
    }
    if (licenseStatus?.is_paid) {
      return `A licença expirou${exp ? ` em ${exp}` : ""}. Inicie a renovação para gerar o pagamento.`;
    }
    return "A licença foi criada, porém ainda está marcada como não paga. Após o pagamento, envie o comprovante via WhatsApp para validação manual.";
  }, [licenseStatus, exp]);

  const waMessage = useMemo(() => {
    return `Olá! Estou enviando o comprovante da renovação da licença.

Empresa: ${empresaNome}
Empresa ID: ${empresaId || "-"}
Usuário: ${userName}

Link do pagamento: ${PAYMENT_URL}`;
  }, [empresaNome, empresaId, userName]);

  const whatsappLink = useMemo(() => {
    return buildWhatsAppLink({ number: WHATSAPP_NUMBER, message: waMessage });
  }, [waMessage]);

  function handleRenewNow() {
    try {
      localStorage.setItem(LS_KEY, String(Date.now()));
      setRenewClicked(true);
    } catch {}
    window.open(PAYMENT_URL, "_blank", "noopener,noreferrer");
  }

  function handleClearFlow() {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
    setRenewClicked(false);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(2,6,23,0.35)]">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-slate-900">
                Licença do sistema
              </h1>
              <p className="text-sm text-slate-600">
                {empresaNome} • {empresaId ? `ID ${empresaId}` : "ID indisponível"}
              </p>
            </div>

            {/* Status pill */}
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ring-4 ${statusUI.tone}`}
              title={statusUI.title}
            >
              <span className={`h-2 w-2 rounded-full ${statusUI.dot}`} />
              <span className="inline-flex items-center gap-2">
                {statusUI.icon}
                {statusUI.tag}
              </span>
            </div>
          </div>

          {/* Content card */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-slate-700">{statusUI.icon}</div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {headerTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{headerDesc}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] text-slate-500">Início</p>
                <p className="text-sm font-semibold text-slate-900">
                  {starts || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] text-slate-500">Expira em</p>
                <p className="text-sm font-semibold text-slate-900">
                  {exp || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] text-slate-500">Plano</p>
                <p className="text-sm font-semibold text-slate-900">
                  {licenseStatus?.license?.name || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {!renewClicked ? (
              <button
                type="button"
                onClick={handleRenewNow}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:bg-blue-700"
              >
                <FiRefreshCw className="h-4 w-4" />
                Renovar licença
              </button>
            ) : (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 active:bg-sky-700"
              >
                <FiMessageSquare className="h-4 w-4" />
                Enviar comprovante no WhatsApp
              </a>
            )}

            <a
              href={PAYMENT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FiExternalLink className="h-4 w-4" />
              Abrir link de pagamento
            </a>

            {renewClicked && (
              <button
                type="button"
                onClick={handleClearFlow}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                title="Reiniciar fluxo de renovação"
              >
                <FiArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <FiInfo className="mt-0.5 h-4 w-4 text-slate-500" />
            <p className="text-[12px] leading-relaxed text-slate-600">
              Após o envio do comprovante, a validação é manual (no momento).
              O acesso será liberado assim que a confirmação for concluída.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
