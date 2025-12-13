type EmpresaHeaderProps = {
  onOpenCreateModal: () => void;
  canCreateEmpresa: boolean;
};

export function EmpresaHeader({
  onOpenCreateModal,
  canCreateEmpresa,
}: EmpresaHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Empresa vinculada ao usuário
        </h2>
        <p className="text-sm text-slate-600">
          Aqui você vê os dados da empresa atual e pode ir para a gestão de
          usuários dessa empresa.
        </p>
      </div>

      {canCreateEmpresa && (
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1282A2] text-white text-xs font-semibold px-4 py-2 hover:bg-[#034078] transition w-full sm:w-auto"
        >
          <span className="text-base leading-none">+</span>
          <span>Criar empresa</span>
        </button>
      )}
    </header>
  );
}
