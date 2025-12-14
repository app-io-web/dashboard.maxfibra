import type { ProfileItem } from "../types";

type Props = {
  value: string[]; // ids selecionados
  onChange: (next: string[]) => void;
  options: ProfileItem[];
  loading: boolean;
  error: string | null;
};

export function AllowedProfilesSelect(props: Props) {
  const { value, onChange, options, loading, error } = props;

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        Perfis (permitidos no cadastro)
      </label>

      <div className="rounded-lg border border-slate-300 bg-white p-3">
        {loading ? (
          <div className="text-xs text-slate-600">Carregando perfis...</div>
        ) : error ? (
          <div className="text-xs text-rose-700">{error}</div>
        ) : options.length === 0 ? (
          <div className="text-xs text-slate-600">
            Nenhum perfil permitido encontrado (verifique o filtro ou endpoint).
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map((p) => {
              const checked = value.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={[
                    "rounded-full border px-3 py-1 text-[11px] transition",
                    checked
                      ? "border-blue-300 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-500 hover:bg-blue-50",
                  ].join(" ")}
                  title={p.slug || p.key || p.name}
                >
                  {checked ? "✓ " : ""}
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-1 text-[11px] text-slate-500">
        Aqui só aparecem perfis permitidos (ex.: Atendente / Atendente Suporte).
      </p>
    </div>
  );
}
