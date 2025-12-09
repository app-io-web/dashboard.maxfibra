import { EmpresaSettingsEditForm, type EmpresaSettings } from "./EmpresaSettingsEditForm";
import { api } from "../../lib/api"; // 🔥 ADICIONE ISTO

type Props = {
  empresa: EmpresaSettings;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (updated: EmpresaSettings) => void;
  onGoToUsers: () => void;
  currentRole: string | null;

  canViewEditButton: boolean;
  canViewUsersButton: boolean;
};

function buildLogoUrl(raw?: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = api.defaults.baseURL || "";
  return base.replace(/\/$/, "") + (raw.startsWith("/") ? raw : `/${raw}`);
}


export function EmpresaAtualCard({
  empresa,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaved,
  onGoToUsers,
  currentRole,
  canViewEditButton,
  canViewUsersButton,
}: Props) {
  const showActions = canViewEditButton || canViewUsersButton;



  


  
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#FEFCFB] p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#1282A2]/15 border border-[#1282A2]/40 flex items-center justify-center overflow-hidden">
            {empresa.logo_url ? (
              <img
                src={buildLogoUrl(empresa.logo_url)}
                alt="Logo da empresa"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#034078] font-semibold text-lg">
                {empresa.display_name?.[0]?.toUpperCase() || "E"}
              </span>
            )}
          </div>

  <div>
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-semibold text-[#0A1128]">
        {empresa.display_name || "Empresa sem nome"}
      </h3>

      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide">
        Empresa atual
      </span>
    </div>

    <p className="text-xs text-[#034078] mt-1">
      ID da empresa (auth_empresa_id):{" "}
      <span className="font-mono text-[11px] text-[#1282A2]">
        {empresa.auth_empresa_id}
      </span>
    </p>
  </div>
</div>

        {showActions && (
          <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
            <div className="flex flex-col gap-2 w-full md:flex-row md:w-auto">
              {canViewUsersButton && (
                <button
                  onClick={onGoToUsers}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-400 transition w-full md:w-auto"
                >
                  Gerenciar usuários da empresa
                </button>
              )}

              {canViewEditButton && (
                <button
                  onClick={onStartEdit}
                  className="inline-flex items-center justify-center rounded-lg border border-[#1282A2] px-5 py-2 text-sm font-medium text-[#1282A2] bg-white hover:bg-[#1282A2]/5 transition w-full md:w-auto"
                >
                  Editar dados da empresa
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 md:text-right">
              Os botões acima são exibidos conforme as permissões configuradas
              para este usuário.
            </p>
          </div>
        )}
      </div>

      {isEditing && (
        <EmpresaSettingsEditForm
          empresa={empresa}
          onCancel={onCancelEdit}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
