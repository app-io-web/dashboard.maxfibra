import React, { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiDownload, FiRefreshCw } from "react-icons/fi";
import { api } from "../../lib/api";

type PaidItem = {
  payment_id: string;
  assignment_id: string;
  txid: string | null;
  amount_cents: number | null;
  status: string;
  updated_at: string;

  receipt_id: string | null;
  paid_at: string | null;
  end_to_end_id: string | null;
  receipt_created_at: string | null;
};

function brl(cents?: number | null) {
  if (typeof cents !== "number") return "—";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dtBR(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

function downloadPdfBase64(pdfBase64: string, filename: string) {
  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${pdfBase64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ContasPagas() {
  const [items, setItems] = useState<PaidItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get("/system/license-payments/paid", { params: { _ts: Date.now() } });
      setItems(r.data?.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Erro ao carregar contas pagas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const empty = useMemo(() => !loading && items.length === 0, [loading, items]);

  async function handleDownload(paymentId: string, txid?: string | null) {
    setDownloading(paymentId);
    setError(null);
    try {
      const r = await api.get(`/system/license-payments/${paymentId}/receipt`, {
        params: { _ts: Date.now() },
      });
      const receipt = r.data?.receipt;
      if (!receipt?.pdf_base64) throw new Error("Comprovante veio sem PDF.");
      const name = `comprovante_${txid || paymentId}.pdf`;
      downloadPdfBase64(receipt.pdf_base64, name);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Erro ao baixar comprovante.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(2,6,23,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Contas pagas</h3>
          <p className="mt-1 text-xs text-slate-600">
            Histórico recente de pagamentos concluídos + comprovante em PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <FiRefreshCw className="h-4 w-4" />
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {empty && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Nenhum pagamento concluído encontrado ainda. (Sim, o Pix às vezes demora, ele é tímido.)
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((it) => (
            <div key={it.payment_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                    <FiCheckCircle className="h-4 w-4" />
                    CONCLUÍDA
                  </span>
                  <span className="text-xs text-slate-600">
                    Pago em: <strong>{dtBR(it.paid_at || it.updated_at)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(it.payment_id, it.txid)}
                  disabled={downloading === it.payment_id}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloading === it.payment_id ? "Baixando..." : "Baixar comprovante"}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] text-slate-500">Valor</p>
                  <p className="text-sm font-semibold text-slate-900">{brl(it.amount_cents)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] text-slate-500">TXID</p>
                  <p className="text-xs font-mono text-slate-800 break-all">{it.txid || "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] text-slate-500">EndToEndId</p>
                  <p className="text-xs font-mono text-slate-800 break-all">{it.end_to_end_id || "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
