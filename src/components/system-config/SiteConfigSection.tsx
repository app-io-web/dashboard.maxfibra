import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { siteApi } from "../../lib/apiSite"; // ✅ AQUI


function getCentralToken() {
  return (
    localStorage.getItem("central_access_token") ||
    localStorage.getItem("central_access_token".toUpperCase()) || // opcional
    ""
  );
}


export function SiteConfigSection() {
  const [loading, setLoading] = useState(false);

  const siteBaseUrl = useMemo(() => {
    return import.meta.env.VITE_MANAGED_SITE_URL || "https://www.admin.center.appsy.app.br";
  }, []);

  async function handleOpenManagedSite() {
    console.log("[SiteConfig] clique!");

    // abre popup no clique (anti popup-blocker)
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
    console.log("[SiteConfig] popup =", popup ? "OK" : "BLOQUEADO");

    try {
      setLoading(true);

      const token = getCentralToken();
      console.log("[SiteConfig] token existe?", !!token);

      if (!token) {
        toast({ title: "Sem token", description: "Faça login novamente." });
        if (popup) popup.close();
        return;
      }

      console.log("[SiteConfig] chamando POST /auth/sso/code em:", siteApi.defaults.baseURL);

      const { data } = await siteApi.post(
        "/sso/code",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("[SiteConfig] resposta /auth/sso/code =", data);

      const code = data?.code || data?.ssoCode || data?.data?.code; // cobre formatos comuns
      console.log("[SiteConfig] code =", code);

      if (!code) {
        toast({
          title: "SSO falhou",
          description: "API não retornou 'code'. Veja console (resposta).",
        });
        if (popup) popup.close();
        return;
      }

      const url = `${siteBaseUrl}/site-manager?code=${encodeURIComponent(code)}`;
      console.log("[SiteConfig] URL FINAL =", url);

      if (!popup) {
        // fallback se popup bloqueou
        window.location.href = url;
        return;
      }

      popup.location.href = url;
    } catch (err: any) {
      console.error("[SiteConfig] erro SSO:", err?.response?.status, err?.response?.data || err);
      toast({
        title: "Erro ao gerar SSO",
        description: err?.response?.data?.error || "Ver console / Network",
      });
      if (popup) popup.close();
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-600" />
            Site Gerenciável
          </h2>
          <p className="text-sm text-slate-600">
            Abre o painel do site usando SSO (sem pedir login de novo).
          </p>
        </div>

        <Button onClick={handleOpenManagedSite} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando acesso...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Site
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Base URL: <span className="font-mono">{siteBaseUrl}</span>
      </div>
    </div>
  );
}
