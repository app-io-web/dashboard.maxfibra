import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "../../contexts/SessionContext";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiInfo,
  FiX,
  FiCopy,
} from "react-icons/fi";

import { api } from "../../lib/api"; // ✅ usa o axios central
import { ContasPagas } from "../../components/license/ContasPagas";


const RENEW_PRICE_LABEL = "R$ 1,90";

// util: data
function formatDateBR(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

// util: tenta transformar base64 em src de img
function toImageSrc(maybeBase64?: string | null) {
  if (!maybeBase64) return null;
  const s = String(maybeBase64).trim();
  if (!s) return null;
  if (s.startsWith("data:image/")) return s;
  return `data:image/png;base64,${s}`;
}

type StatusUI = {
  tag: string;
  tone: string;
  dot: string;
  icon: React.ReactNode;
  title: string;
};

type PixPayment = {
  id?: string;
  txid?: string;
  brcode?: string;
  qrcode_image?: string;
  amount_cents?: number;
};

export function LicensePage() {
  const { licenseStatus, empresaId, empresaBranding, refreshLicenseStatus } =
    useSession() as any;

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const pollingRef = useRef<number | null>(null);
  const verifyPollingRef = useRef<number | null>(null);
  const verifyingRef = useRef(false);
  const verifyAttemptsRef = useRef(0);


  const exp = useMemo(
    () => formatDateBR(licenseStatus?.expires_at),
    [licenseStatus?.expires_at]
  );
  const starts = useMemo(
    () => formatDateBR(licenseStatus?.starts_at),
    [licenseStatus?.starts_at]
  );

  const empresaNome = empresaBranding?.display_name || "Empresa";

    // ✅ condição expirada igual teu UI atual
  const isExpiredUI = useMemo(() => {
    if (!licenseStatus?.has_license) return false;
    if (licenseStatus?.is_valid_now) return false;

    // usa flag do backend se vier
    if (typeof licenseStatus?.is_expired === "boolean") {
      return licenseStatus.is_expired;
    }

    // fallback pelo expires_at
    const ex = licenseStatus?.expires_at ? new Date(licenseStatus.expires_at) : null;
    if (!ex || Number.isNaN(ex.getTime())) return false;
    return ex.getTime() < Date.now();
  }, [licenseStatus]);

  const daysToExpire = useMemo(() => {
  if (!licenseStatus?.expires_at) return null;

  const expDate = new Date(licenseStatus.expires_at);
  if (Number.isNaN(expDate.getTime())) return null;

  const diffMs = expDate.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}, [licenseStatus?.expires_at]);


  const canRenewEarly = useMemo(() => {
    if (!licenseStatus?.has_license) return false;
    if (isExpiredUI) return true; // já vencida, libera sempre

    if (typeof daysToExpire === "number" && daysToExpire <= 5) {
      return true; // faltando 5 dias ou menos
    }

    return false;
  }, [licenseStatus, isExpiredUI, daysToExpire]);


  // ✅ se NÃO está válida, a UI deve deixar gerar pix
  const canGeneratePixUI = canRenewEarly;

  const assignmentId = licenseStatus?.assignment_id || null;

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

    // ✅ expirada ganha prioridade (mesmo se não paga)
    if (isExpiredUI) {
      return {
        tag: "EXPIRADA",
        title: "Licença expirada",
        tone: "border-rose-200 bg-rose-50 text-rose-800 ring-rose-100",
        dot: "bg-rose-500",
        icon: <FiXCircle className="h-4 w-4" />,
      };
    }

    // senão, não tá válida mas não “expirou” => pendente/validação
    return {
      tag: "PENDENTE",
      title: "Aguardando confirmação de pagamento",
      tone: "border-sky-200 bg-sky-50 text-sky-800 ring-sky-100",
      dot: "bg-sky-500",
      icon: <FiClock className="h-4 w-4" />,
    };
  }, [licenseStatus, isExpiredUI]);


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
      return `A licença expirou${exp ? ` em ${exp}` : ""}. Inicie a renovação para gerar o Pix.`;
    }
    return "A licença foi criada, porém ainda está marcada como não paga. Aguardando confirmação.";
  }, [licenseStatus, exp]);

  function stopVerifyPolling() {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function startPolling() {
    stopVerifyPolling();
    pollingRef.current = window.setInterval(async () => {
      try {
        if (typeof refreshLicenseStatus === "function") {
          await refreshLicenseStatus();
        }
      } catch {}
    }, 3000);
  }

  useEffect(() => {
    if (licenseStatus?.is_valid_now && isRenewModalOpen) {
      setIsRenewModalOpen(false);
      setPixPayment(null);
      setPixError(null);
      stopVerifyPolling();
    }
  }, [licenseStatus?.is_valid_now, isRenewModalOpen]);

  useEffect(() => () => stopVerifyPolling(), []);

  async function createPixCharge() {
    if (!assignmentId) {
      setPixError("Não encontrei o assignment_id dessa licença pra gerar o Pix.");
      return;
    }

    setPixLoading(true);
    setPixError(null);

    try {
      // ✅ Axios com interceptors (Authorization + x-empresa-id)
      const res = await api.post(
        `/system/license-assignments/${assignmentId}/pix`,
        {},
        { params: { _ts: Date.now() } }
      );

      const payment = res.data?.payment || null;

      // ✅ se vier reused/already_paid etc
      if (res.data?.already_paid) {
        setPixError("Essa licença já está marcada como paga.");
        return;
      }

      // ✅ valida retorno
      if (!payment?.brcode && !payment?.qrcode_image) {
        // manda um erro mais útil pro debug
        throw new Error(
          `Cobrança gerada, mas não veio QR/BR Code no retorno. (keys: ${Object.keys(
            payment || {}
          ).join(", ") || "vazio"})`
        );
      }

      setPixPayment(payment);
      startVerifyPolling(); // ✅ agora verifica a Efí automaticamente

    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Erro ao gerar cobrança Pix.";
      setPixError(msg);
    } finally {
      setPixLoading(false);
    }
  }

  function stopVerifyPolling() {
    if (verifyPollingRef.current) {
      window.clearInterval(verifyPollingRef.current);
      verifyPollingRef.current = null;
    }
    verifyingRef.current = false;
    verifyAttemptsRef.current = 0;
  }

  async function verifyOnce() {
    if (!assignmentId) return { status: "ERROR" as const };

    try {
      const r = await api.post(
        `/system/license-assignments/${assignmentId}/pix/verify`,
        {},
        { params: { _ts: Date.now() } }
      );

      const st = String(r.data?.status || "").toUpperCase();

      // Atualiza o status na tela (puxa do backend)
      if (typeof refreshLicenseStatus === "function") {
        await refreshLicenseStatus();
      }

      return { status: st as string };
    } catch (e: any) {
      return {
        status: "ERROR",
        error: e?.response?.data?.error || e?.message || "Erro ao verificar Pix.",
      };
    }
  }

  function startVerifyPolling() {
    stopVerifyPolling();

    // roda 1x imediatamente
    void (async () => {
      const first = await verifyOnce();
      if (first.status === "PAID" || first.status === "CONFIRMED") {
        stopVerifyPolling();
      }
    })();

    verifyPollingRef.current = window.setInterval(async () => {
      if (verifyingRef.current) return; // anti-overlap
      verifyingRef.current = true;

      try {
        verifyAttemptsRef.current += 1;

        const result = await verifyOnce();
        const st = String(result.status || "").toUpperCase();

        // ✅ confirmou -> para
        if (st === "PAID" || st === "CONFIRMED") {
          stopVerifyPolling();
          return;
        }

        // opcional: depois de um tempo dá uma dica sem spam
        if (verifyAttemptsRef.current === 30) {
          setPixError(
            "Ainda aguardando confirmação na Efí. Pode levar alguns minutos. Vou continuar verificando."
          );
        }
      } finally {
        verifyingRef.current = false;
      }
    }, 6000);
  }


  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
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
                {empresaNome} •{" "}
                {empresaId ? `ID ${empresaId}` : "ID indisponível"}
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

        {daysToExpire !== null && daysToExpire <= 5 && daysToExpire > 0 && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    ⚠️ Sua licença vence em <strong>{daysToExpire} dia{daysToExpire > 1 ? "s" : ""}</strong>.
                    Já é possível renovar.
                  </div>
                )}

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
            {canGeneratePixUI && (
              <button
                type="button"
                onClick={() => {
                  setIsRenewModalOpen(true);
                  setPixPayment(null);
                  setPixError(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 active:bg-blue-700"
              >
                <FiRefreshCw className="h-4 w-4" />
                {isExpiredUI ? "Renovar licença" : "Gerar Pix"}


                
              </button>
            )}

          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <FiInfo className="mt-0.5 h-4 w-4 text-slate-500" />
            <p className="text-[12px] leading-relaxed text-slate-600">
              Pagamento via Pix (Efí). Assim que o pagamento for confirmado, o
              acesso é liberado automaticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <ContasPagas />
      </div>

      {/* MODAL RENOVAR */}
      {isRenewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsRenewModalOpen(false);
              stopVerifyPolling();
            }}
            aria-label="Fechar"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_25px_80px_-35px_rgba(2,6,23,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Renovar licença
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Valor:{" "}
                  <span className="font-semibold">{RENEW_PRICE_LABEL}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsRenewModalOpen(false);
                  stopVerifyPolling();
                }}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Fechar modal"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {!pixPayment && (
              <div className="mt-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="text-xs text-slate-600">
                    Empresa:{" "}
                    <span className="font-semibold">{empresaNome}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Plano:{" "}
                    <span className="font-semibold">
                      {licenseStatus?.license?.name || "-"}
                    </span>
                  </div>
                  {exp && (
                    <div className="text-xs text-slate-600">
                      Expirou em: <span className="font-semibold">{exp}</span>
                    </div>
                  )}
                </div>

                {pixError && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {pixError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={createPixCharge}
                  disabled={pixLoading}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  {pixLoading ? "Gerando Pix..." : "Gerar Pix de renovação"}
                </button>

                <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                  Ao gerar o Pix, vamos mostrar o QR Code e o “copia e cola”
                  aqui.
                </p>
              </div>
            )}

            {pixPayment && (
              <div className="mt-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-600">
                    Txid:{" "}
                    <span className="font-mono font-semibold">
                      {pixPayment.txid || "-"}
                    </span>
                  </div>
                </div>

                {toImageSrc(pixPayment.qrcode_image) && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={toImageSrc(pixPayment.qrcode_image)!}
                      alt="QR Code Pix"
                      className="h-56 w-56 rounded-xl border border-slate-200 bg-white p-2"
                    />
                  </div>
                )}

                {pixPayment.brcode && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-700">
                      Pix copia e cola
                    </p>
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="break-all font-mono text-[11px] text-slate-700">
                        {pixPayment.brcode}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(pixPayment.brcode!)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FiCopy className="h-4 w-4" />
                      Copiar código
                    </button>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-[12px] text-slate-600">
                  Estamos verificando automaticamente. Assim que confirmar, a
                  licença ativa sozinha.
                </div>

                {pixError && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {pixError}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPixPayment(null);
                      setPixError(null);
                      stopVerifyPolling();
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Gerar outro Pix
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setPixLoading(true);
                        setPixError(null);

                        if (!assignmentId) {
                          setPixError("assignment_id não encontrado.");
                          return;
                        }

                        // ✅ chama o verify real no backend
                        const r = await api.post(
                          `/system/license-assignments/${assignmentId}/pix/verify`,
                          {},
                          { params: { _ts: Date.now() } }
                        );

                        const st = r.data?.status;

                        // se ainda não confirmou, mostra status
                        if (st === "PENDING") {
                          setPixError("Ainda não confirmou na Efí. Aguarde 1-2 min e tente novamente.");
                        } else {
                          // ✅ atualiza status na tela
                          if (typeof refreshLicenseStatus === "function") {
                            await refreshLicenseStatus();
                          }
                        }
                      } catch (e: any) {
                        const msg = e?.response?.data?.error || e?.message || "Erro ao verificar Pix.";
                        setPixError(msg);
                      } finally {
                        setPixLoading(false);
                      }
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700"
                  >
                    Verificar agora
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
