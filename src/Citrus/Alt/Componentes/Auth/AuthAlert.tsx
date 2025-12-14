import React from "react";

type Variant = "success" | "error" | "info";

type Props = {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
};

export function AuthAlert({ variant, children, className = "" }: Props) {
  const styles =
    variant === "success"
      ? "border-blue-500/40 bg-blue-50 text-blue-700"
      : variant === "error"
      ? "border-red-500/40 bg-red-50 text-red-600"
      : "border-slate-300 bg-slate-50 text-slate-600";

  return (
    <div className={`mb-3 text-xs rounded-xl border px-3 py-2 ${styles} ${className}`}>
      {children}
    </div>
  );
}
