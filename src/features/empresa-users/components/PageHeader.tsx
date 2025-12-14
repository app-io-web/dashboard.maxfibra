import { useNavigate } from "react-router-dom";

export function PageHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Usuários da empresa
        </h2>
        <p className="text-sm text-slate-600">
          Crie novos usuários vinculados à empresa atual. Este é um pré-cadastro:
          o usuário irá definir e-mail e senha depois, na tela de &quot;Primeiro
          acesso&quot;.
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate("/empresa-settings")}
        className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-blue-500 hover:text-blue-500 shadow-sm transition"
      >
        ← Voltar para Empresa
      </button>
    </div>
  );
}
