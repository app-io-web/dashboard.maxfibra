import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { api } from "../../lib/api";
import {
  FiLock,
  FiAlertCircle,
  FiRefreshCw,
  FiCreditCard,
  FiClock,
} from "react-icons/fi";

const ALLOW_PATH_PREFIXES = ["/system/licenses"];

export function LicenseBlocker() {
  const { licenseBlocked, licenseStatus } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loadingGrace, setLoadingGrace] = useState(false);

  const allowed = useMemo(() => {
    return ALLOW_PATH_PREFIXES.some((p) => pathname.startsWith(p));
  }, [pathname]);

  if (!licenseBlocked || allowed) return null;

  const exp = licenseStatus?.expires_at
    ? new Date(licenseStatus.expires_at).toLocaleDateString("pt-BR")
    : null;

  const graceUntil = licenseStatus?.grace_until
    ? new Date(licenseStatus.grace_until).toLocaleString("pt-BR")
    : null;

  const title = licenseStatus?.is_grace_active
    ? "Liberação temporária ativa"
    : !licenseStatus?.has_license
    ? "Licença não encontrada"
    : licenseStatus?.is_paid
    ? "Licença expirada"
    : "Pagamento pendente";

  const description = licenseStatus?.is_grace_active
    ? `O sistema está liberado temporariamente até ${graceUntil}. Após esse período, o acesso será bloqueado novamente.`
    : !licenseStatus?.has_license
    ? "Esta empresa não possui uma licença ativa vinculada. Para liberar o acesso ao sistema, é necessário atribuir ou renovar uma licença."
    : licenseStatus?.is_paid
    ? `A licença desta empresa expirou${exp ? ` em ${exp}` : ""}. Para continuar utilizando o sistema, realize a renovação.`
    : "Uma licença foi criada, porém o pagamento ainda não foi confirmado. Após a validação, o acesso será liberado automaticamente.";

  // ✅ botão só aparece UMA vez
    const canUseGrace =
    !licenseStatus?.is_valid_now &&
    !licenseStatus?.is_grace_active &&
    !licenseStatus?.grace_used_once;


  async function handleGrace() {
    try {
      setLoadingGrace(true);
      await api.post("/system/license/grace", {
        hours: 10,
        reason: "Pagar mais tarde (UI)",
      });
      window.location.reload();
    } catch (err: any) {
      alert(
        err?.response?.data?.error ||
          "Não foi possível liberar temporariamente."
      );
    } finally {
      setLoadingGrace(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-100/80 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-20px_rgba(2,6,23,0.25)]">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
              <FiLock className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/system/licenses")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <FiCreditCard className="h-4 w-4" />
              Gerenciar licenças
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FiRefreshCw className="h-4 w-4" />
              Já efetuei o pagamento
            </button>

            {canUseGrace && (
              <button
                type="button"
                disabled={loadingGrace}
                onClick={handleGrace}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
              >
                <FiClock className="h-4 w-4" />
                Pagar mais tarde (10h)
              </button>
            )}
          </div>

          {/* Info */}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <FiAlertCircle className="mt-0.5 h-4 w-4 text-slate-500" />
            <p className="text-[12px] leading-relaxed text-slate-600">
              {licenseStatus?.is_grace_active
                ? "Esta liberação é única e não poderá ser solicitada novamente."
                : "O acesso ao sistema está temporariamente restrito até que a situação da licença seja regularizada."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
