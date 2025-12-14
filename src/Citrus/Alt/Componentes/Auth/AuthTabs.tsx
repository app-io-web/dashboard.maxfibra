import React from "react";

export type AuthTabKey = "login" | "firstAccess";

type Props = {
  active: AuthTabKey;
  onChange: (key: AuthTabKey) => void;
};

export function AuthTabs({ active, onChange }: Props) {
  return (
    <div className="flex mb-4 rounded-xl bg-slate-100 p-1 text-xs font-medium">
      <button
        type="button"
        className={[
          "flex-1 rounded-lg py-2 transition border",
          active === "login"
            ? "bg-white shadow-sm text-blue-500 border-slate-200"
            : "bg-transparent text-slate-500 border-transparent hover:bg-white/50",
        ].join(" ")}
        onClick={() => onChange("login")}
      >
        Já tenho acesso
      </button>

      <button
        type="button"
        className={[
          "flex-1 rounded-lg py-2 transition border",
          active === "firstAccess"
            ? "bg-white shadow-sm text-blue-500 border-slate-200"
            : "bg-transparent text-slate-500 border-transparent hover:bg-white/50",
        ].join(" ")}
        onClick={() => onChange("firstAccess")}
      >
        Primeiro acesso
      </button>
    </div>
  );
}
