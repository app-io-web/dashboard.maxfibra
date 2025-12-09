type EmpresaHeaderProps = {
  onOpenCreateModal: () => void;
  canCreateEmpresa: boolean;
};

export function EmpresaHeader({ onOpenCreateModal, canCreateEmpresa }: EmpresaHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Empresa vinculada ao usuário
        </h2>
        <p className="text-sm text-slate-600">
          Aqui você vê os dados da empresa atual e pode ir para a gestão de usuários dessa empresa.
        </p>
      </div>

      {canCreateEmpresa && (
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#1282A2] text-white text-xs font-semibold px-3 py-1.5 hover:bg-[#034078] transition"
        >
          <span className="text-base leading-none">+</span>
          Criar empresa
        </button>
      )}
    </div>
  );
}