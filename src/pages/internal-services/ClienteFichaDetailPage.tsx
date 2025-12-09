// src/pages/internal-services/ClienteFichaDetailPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import {
  ArrowLeft,
  User,
  FileText,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Copy,
  X,
} from "lucide-react";

type CadastroFicha = {
  id: string;
  protocolo: string;
  data_hora: string;
  nome: string;
  cpf: string;
  rg: string | null;
  data_nascimento: string | null;
  email: string | null;
  telefone1: string | null;
  telefone2: string | null;
  telefone3: string | null;
  cidade: string | null;
  bairro: string | null;
  rua: string | null;
  numero: string | null;
  cep: string | null;
  complemento: string | null;
  latitude: string | null;
  longitude: string | null;
  plano: string | null;
  streaming: string | null;
  vencimento: string | null;
  vendedor: string | null;
  vendedor_email: string | null;
  cupom: string | null;
  desconto: string | null | number;
  is_empresa: boolean;
  created_at: string;
};

type CopyButtonProps = {
  value?: string | null;
  label: string;
  enabled: boolean;
  onCopied?: (label: string) => void;
};

type ToastState = {
  open: boolean;
  message: string;
};

// --- Toast no canto superior direito ---
function CopyToast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast.open) return null;

  return (
    <div className="fixed top-8 right-4 z-50">
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-white/95 px-3 py-2 shadow-lg min-w-[220px]">
        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Copy className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-800">Copiado</p>
          <p className="text-[11px] text-slate-500">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 inline-flex rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// --- Botão de copiar (chama o toast) ---
function CopyButton({ value, label, enabled, onCopied }: CopyButtonProps) {
  if (!enabled || !value) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      onCopied?.(label);
    } catch (err) {
      console.error("Erro ao copiar para a área de transferência:", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-medium text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
      title={`Copiar ${label}`}
    >
      <Copy className="w-3 h-3" />
      Copiar
    </button>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR");
}

function formatShortDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function formatBool(value: boolean) {
  return value ? "Sim" : "Não";
}

function formatCurrency(value: string | number | null) {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ClienteFichaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<CadastroFicha | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyEnabled, setCopyEnabled] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
  });

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setError(null);
        setLoading(true);
        const res = await api.get<CadastroFicha>(`/cadastro-fichas/${id}`);
        setFicha(res.data);
      } catch (err: any) {
        console.error("Erro ao buscar ficha:", err);
        if (err?.response?.status === 404) {
          setError("Ficha não encontrada.");
        } else {
          setError("Erro ao carregar dados da ficha.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function showCopyToast(fieldLabel: string) {
    setToast({
      open: true,
      message: `${fieldLabel} copiado para a área de transferência.`,
    });

    // fecha automático depois de 2.2s
    setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2200);
  }

  return (
    <div className="space-y-6">
      {/* Toast de cópia */}
      <CopyToast
        toast={toast}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />

      {/* HEADER */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </button>

          <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-emerald-500 text-white shadow">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Detalhes da ficha
            </h1>
            {ficha && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-slate-500">
                  Protocolo{" "}
                  <span className="font-mono text-emerald-700">
                    {ficha.protocolo}
                  </span>
                </span>

                {ficha.cupom && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 border border-amber-200">
                    Cupom: {ficha.cupom}
                  </span>
                )}

                {ficha.desconto && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200">
                    Desconto: {formatCurrency(ficha.desconto)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TOGGLE HABILITAR CÓPIA */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Habilitar cópia
          </span>
          <button
            type="button"
            onClick={() => setCopyEnabled((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
              copyEnabled
                ? "border-emerald-500 bg-emerald-500/90"
                : "border-slate-300 bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                copyEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </header>

      {/* ESTADO */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-500">
          Carregando dados da ficha...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && ficha && (
        <div className="space-y-4">
          {/* Card principal tipo "notificação" */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex gap-3 items-start">
            <div className="mt-1">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white text-emerald-600 border border-emerald-200">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                Nova ficha recebida
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {ficha.nome}
              </h2>
              <p className="text-xs text-slate-700 flex flex-wrap items-center gap-2">
                <span>CPF {ficha.cpf}</span>
                {ficha.plano && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                      Plano: {ficha.plano}
                    </span>
                  </>
                )}
                {ficha.streaming && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 border border-violet-200">
                      Streaming: {ficha.streaming}
                    </span>
                  </>
                )}
                {ficha.vencimento && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-600/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Vencimento: dia {ficha.vencimento}
                    </span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-500">
                Criada em {formatDateTime(ficha.data_hora)}
              </p>
            </div>
          </div>

          {/* GRID COM OS BLOCOS DE INFO */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Dados pessoais */}
            <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Dados pessoais
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Informações básicas do cliente.
                  </p>
                </div>
              </div>

              <dl className="mt-1 grid grid-cols-1 gap-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Nome</dt>
                  <dd className="flex items-center gap-2 text-slate-800 font-medium">
                    <span>{ficha.nome}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.nome}
                      label="Nome completo"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">CPF</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.cpf}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.cpf}
                      label="CPF"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">RG</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.rg || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.rg}
                      label="RG"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">
                    Data de nascimento
                  </dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{formatShortDate(ficha.data_nascimento)}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={
                        ficha.data_nascimento
                          ? formatShortDate(ficha.data_nascimento)
                          : null
                      }
                      label="Data de nascimento"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Empresa?</dt>
                  <dd className="text-slate-800">
                    {formatBool(ficha.is_empresa)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Contato */}
            <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Contato
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    E-mail e telefones cadastrados.
                  </p>
                </div>
              </div>

              <dl className="mt-1 grid grid-cols-1 gap-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 flex items-center gap-1 mt-[2px]">
                    <Mail className="w-3 h-3 text-slate-400" />
                    E-mail
                  </dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.email || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.email}
                      label="E-mail"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Telefone 1</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.telefone1 || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.telefone1}
                      label="Telefone 1"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Telefone 2</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.telefone2 || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.telefone2}
                      label="Telefone 2"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Telefone 3</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.telefone3 || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.telefone3}
                      label="Telefone 3"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>
              </dl>
            </section>

            {/* Endereço */}
            <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Endereço
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Localização informada na ficha.
                  </p>
                </div>
              </div>

              <dl className="mt-1 grid grid-cols-1 gap-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Rua / Número</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>
                      {(ficha.rua || "-") + " " + (ficha.numero || "")}
                    </span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={
                        ficha.rua
                          ? `${ficha.rua} ${ficha.numero || ""}`.trim()
                          : null
                      }
                      label="Rua e número"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Bairro</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.bairro || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.bairro}
                      label="Bairro"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">Cidade</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.cidade || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.cidade}
                      label="Cidade"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500 mt-[2px]">CEP</dt>
                  <dd className="flex items-center gap-2 text-slate-800">
                    <span>{ficha.cep || "-"}</span>
                    <CopyButton
                      enabled={copyEnabled}
                      value={ficha.cep}
                      label="CEP"
                      onCopied={showCopyToast}
                    />
                  </dd>
                </div>

                {ficha.complemento && (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500 mt-[2px]">Complemento</dt>
                    <dd className="flex items-center gap-2 text-slate-800">
                      <span>{ficha.complemento}</span>
                      <CopyButton
                        enabled={copyEnabled}
                        value={ficha.complemento}
                        label="Complemento"
                        onCopied={showCopyToast}
                      />
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Plano / Vendedor / Metadados */}
            <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm space-y-4 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-3 text-xs">
                {/* Plano / Oferta */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Oferta escolhida
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Detalhes do plano e serviços.
                      </p>
                    </div>
                  </div>

                  <div className="mt-1 space-y-1.5">
                    <p className="text-sm font-semibold text-slate-900">
                      {ficha.plano || "Plano não informado"}
                    </p>

                    {ficha.streaming && (
                      <p className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 border border-violet-200">
                        Streaming: {ficha.streaming}
                      </p>
                    )}

                    {ficha.vencimento && (
                      <p className="inline-flex items-center rounded-full bg-emerald-600/95 px-2 py-0.5 text-[11px] font-semibold text-white">
                        Vencimento: dia {ficha.vencimento}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {ficha.cupom && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                          Cupom aplicado: {ficha.cupom}
                        </span>
                      )}
                      {ficha.desconto && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          Desconto: {formatCurrency(ficha.desconto)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vendedor */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-900 text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Vendedor responsável
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Quem cadastrou esta ficha.
                      </p>
                    </div>
                  </div>

                  <div className="mt-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {ficha.vendedor || "Não informado"}
                    </p>
                    {ficha.vendedor_email && (
                      <p className="flex items-center gap-1 text-xs text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">
                          {ficha.vendedor_email}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadados */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Metadados
                  </h3>
                  <div className="space-y-1 text-slate-600">
                    <p>
                      <span className="font-medium">Data/hora ficha:</span>{" "}
                      {formatDateTime(ficha.data_hora)}
                    </p>
                    <p>
                      <span className="font-medium">Criado em:</span>{" "}
                      {formatDateTime(ficha.created_at)}
                    </p>
                    {ficha.latitude && ficha.longitude && (
                      <p>
                        <span className="font-medium">Lat/Lng:</span>{" "}
                        {ficha.latitude}, {ficha.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
