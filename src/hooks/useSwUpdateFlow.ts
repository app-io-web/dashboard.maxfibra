import { useCallback, useEffect, useMemo, useState } from "react";

type StepId = "detect" | "clear" | "activate" | "reload";

export function useSwUpdateFlow() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<Record<StepId, boolean>>({
    detect: false,
    clear: false,
    activate: false,
    reload: false,
  });

  const steps = useMemo(
    () => [
      { id: "detect" as const, label: "Detectando nova versão…" },
      { id: "clear" as const, label: "Limpando cache antigo…" },
      { id: "activate" as const, label: "Ativando atualização…" },
      { id: "reload" as const, label: "Recarregando a aplicação…" },
    ],
    []
  );

  const stepUi = steps.map((s) => ({ label: s.label, done: done[s.id] }));

  const mark = (id: StepId) => setDone((p) => ({ ...p, [id]: true }));

  const runUpdateFlow = useCallback(async () => {
    // abre overlay
    setOpen(true);
    setDone({ detect: false, clear: false, activate: false, reload: false });

    // 1) detect
    mark("detect");

    // 2) pedir pro SW limpar caches (opcional)
    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHES" });
      }
    } catch {}
    mark("clear");

    // 3) tentar ativar SW esperando
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    } catch {}
    mark("activate");

    // 4) reload hard (o “hard” mesmo é o browser que decide, mas reload já resolve 99%)
    mark("reload");
    setTimeout(() => window.location.reload(), 350);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // escuta mensagens do SW (quando ativar, ele avisa)
    const onMsg = (event: MessageEvent) => {
      const msg = event.data || {};
      if (msg?.source === "sw" && msg?.type === "SW_ACTIVATED") {
        // Quando o SW novo ativar, executa o fluxo visual + reload
        runUpdateFlow();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMsg);

    // detecta update "silenciosamente" (quando aparece waiting)
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          // quando instalou e ficou waiting, dispara
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            runUpdateFlow();
          }
        });
      });
    })();

    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [runUpdateFlow]);

  return { open, steps: stepUi, runUpdateFlow, setOpen };
}
