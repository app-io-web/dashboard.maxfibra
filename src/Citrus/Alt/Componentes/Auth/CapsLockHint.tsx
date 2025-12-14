import React from "react";

type Props = {
  show: boolean;
};

export function CapsLockHint({ show }: Props) {
  if (!show) return null;

  return (
    <div className="mt-2 text-[11px] rounded-xl border border-amber-500/40 bg-amber-50 text-amber-700 px-3 py-2">
      Caps Lock ativado.
    </div>
  );
}
