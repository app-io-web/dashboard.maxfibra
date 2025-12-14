import React from "react";

type Props = {
  label: string;
  disabled?: boolean;
};

export function AuthActionButton({ label, disabled }: Props) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full inline-flex items-center justify-center rounded-xl bg-blue-500 text-white text-sm font-medium py-2.5 mt-2 hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}
