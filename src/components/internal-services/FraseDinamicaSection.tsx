// src/components/internal-services/FraseDinamicaSection.tsx
import { useEffect, useState, FormEvent } from "react";
import { api } from "../../lib/api";
import { Type, RefreshCcw, Save } from "lucide-react";

type FraseDinamica = {
  id: string;
  Part_Frase_Sem_Efeito: string;
  Part_Frase_Com_Efeito: string;
  Efeito: string;
  colorTextAnimado: string;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
};

export function FraseDinamicaSection() {
  const [frase, setFrase] = useState<FraseDinamica | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchFrase(showReloadToast = false) {
    try {
      if (!showReloadToast) {
        setLoading(true);
      }
      setError(null);
      const res = await api.get<FraseDinamica | null>("/site/frase-dinamica");
      if (res.data) {
        setFrase(res.data);
      } else {
        setFrase({
          id: "",
          Part_Frase_Sem_Efeito: "",
          Part_Frase_Com_Efeito: "",
          Efeito: "",
          colorTextAnimado: "",
        });
      }
    } catch (err: any) {
      console.error("[FraseDinamica] Erro ao buscar:", err);
      setError("Não foi possível carregar a frase dinâmica.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFrase();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!frase) return;

    if (!frase.id) {
      setError(
        "Nenhum registro existente no NocoDB. Crie a linha manualmente na tabela FRASE DINAMICA e recarregue."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        Part_Frase_Sem_Efeito: frase.Part_Frase_Sem_Efeito,
        Part_Frase_Com_Efeito: frase.Part_Frase_Com_Efeito,
        Efeito: frase.Efeito,
        colorTextAnimado: frase.colorTextAnimado,
      };

      const res = await api.patch<FraseDinamica>(
        `/site/frase-dinamica/${frase.id}`,
        payload
      );

      setFrase(res.data);
      setSuccess("Frase dinâmica atualizada com sucesso!");
    } catch (err: any) {
      console.error("[FraseDinamica] Erro ao salvar:", err);
      setError("Erro ao salvar a frase dinâmica.");
    } finally {
      setSaving(false);
    }
  }

  // estilo de cor opcional
  const customStyle =
    frase?.colorTextAnimado && frase.colorTextAnimado.trim().length > 0
      ? { color: frase.colorTextAnimado }
      : {};

  // letras individuais para jump / spin
  function renderAnimatedText(text: string, effect: string) {
    return text.split("").map((char, index) => (
      <span
        key={index}
        className={`effect-${effect}`}
        style={customStyle}
      >
        {char}
      </span>
    ));
  }

  // valor seguro pro input type=color
  const colorInputValue =
    frase?.colorTextAnimado &&
    /^#([0-9A-Fa-f]{6})$/.test(frase.colorTextAnimado)
      ? frase.colorTextAnimado
      : "#10b981";

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Type className="w-4 h-4" />
            </span>
            Frase dinâmica do site
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Essa frase é usada no seu site público e pode ter uma parte fixa e
            uma parte com efeito/estilo animado, vinda direto do serviço
            interno (NocoDB).
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchFrase(true)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          disabled={loading || saving}
        >
          <RefreshCcw className="w-3 h-3" />
          Recarregar
        </button>
      </div>

      <div className="rounded-2xl bg-white/90 p-5 shadow-md border border-slate-200">
        {loading && (
          <p className="text-sm text-slate-500">Carregando frase dinâmica...</p>
        )}

        {!loading && frase && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Parte da frase (sem efeito)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  value={frase.Part_Frase_Sem_Efeito}
                  onChange={(e) =>
                    setFrase((old) =>
                      old
                        ? { ...old, Part_Frase_Sem_Efeito: e.target.value }
                        : old
                    )
                  }
                  placeholder="Ex: Internet fibra óptica..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Parte da frase (com efeito)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  value={frase.Part_Frase_Com_Efeito}
                  onChange={(e) =>
                    setFrase((old) =>
                      old
                        ? { ...old, Part_Frase_Com_Efeito: e.target.value }
                        : old
                    )
                  }
                  placeholder="Ex: com a melhor experiência da cidade!"
                />
              </div>

              {/* SELECT DE EFEITO */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Efeito / tipo de animação
                </label>

                <select
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  value={frase.Efeito}
                  onChange={(e) =>
                    setFrase((old) =>
                      old ? { ...old, Efeito: e.target.value } : old
                    )
                  }
                >
                  <option value="">Nenhum efeito</option>

                  {/* básicos */}
                  <option value="green">Cor Verde</option>
                  <option value="italic">Itálico</option>
                  <option value="underline">Sublinhado</option>
                  <option value="blink">Piscando</option>
                  <option value="shadow">Sombra</option>
                  <option value="big">Texto Grande</option>

                  {/* animações extras */}
                  <option value="fade">Fade In</option>
                  <option value="pulse">Pulse</option>
                  <option value="slide-left">Slide da esquerda</option>
                  <option value="slide-right">Slide da direita</option>
                  <option value="rotate">Rotação contínua</option>

                  {/* special ones */}
                  <option value="jump">Jump (letra por letra)</option>
                  <option value="typewriter">Máquina de escrever</option>
                  <option value="shake">Tremor</option>
                  <option value="slow-shake">Tremor lento</option>
                  <option value="explode">Explosão de entrada</option>
                  <option value="flash">Flash</option>
                  <option value="speed">Entrada rápida</option>
                  <option value="spin">Spin (letra por letra)</option>
                </select>
              </div>

              {/* COR DO TEXTO - COLOR PICKER + INPUT */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Cor do texto animado
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-9 w-12 cursor-pointer rounded-md border border-slate-300 bg-white"
                    value={colorInputValue}
                    onChange={(e) =>
                      setFrase((old) =>
                        old ? { ...old, colorTextAnimado: e.target.value } : old
                      )
                    }
                  />

                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    value={frase.colorTextAnimado}
                    onChange={(e) =>
                      setFrase((old) =>
                        old
                          ? { ...old, colorTextAnimado: e.target.value }
                          : old
                      )
                    }
                    placeholder="#10b981"
                  />
                </div>

                <p className="text-[11px] text-slate-400">
                  Use um valor hexadecimal (ex: <span className="font-mono">#10b981</span>).
                </p>
              </div>
            </div>

            {/* PREVIEW IGUAL AO SITE */}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Pré-visualização:
              </p>

              <p className="text-base md:text-lg font-medium text-slate-800 dynamic-phrase">
                {frase.Part_Frase_Sem_Efeito}{" "}
                {frase.Efeito === "jump" || frase.Efeito === "spin" ? (
                  <span
                    className={`effect-${frase.Efeito}`}
                    style={customStyle}
                  >
                    {renderAnimatedText(
                      frase.Part_Frase_Com_Efeito,
                      frase.Efeito
                    )}
                  </span>
                ) : (
                  <span
                    className={
                      frase.Efeito ? `effect-${frase.Efeito}` : undefined
                    }
                    style={customStyle}
                  >
                    {frase.Part_Frase_Com_Efeito}
                  </span>
                )}
              </p>

              {frase.Efeito && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Efeito configurado:{" "}
                  <span className="font-semibold">{frase.Efeito}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => fetchFrase(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                disabled={loading || saving}
              >
                <RefreshCcw className="w-3 h-3" />
                Desfazer alterações
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-60"
                disabled={saving || loading}
              >
                <Save className="w-3 h-3" />
                {saving ? "Salvando..." : "Salvar frase"}
              </button>
            </div>
          </form>
        )}

        {!loading && !frase && (
          <p className="text-sm text-slate-500">
            Nenhuma frase encontrada. Crie uma linha na tabela FRASE DINAMICA no
            NocoDB e depois clique em <strong>Recarregar</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
