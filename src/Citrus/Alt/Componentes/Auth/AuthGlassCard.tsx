import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthGlassCard({ title, subtitle, children, footer, className = "" }: Props) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/12 bg-white/95 shadow-2xl shadow-black/40",
        "backdrop-blur-xl p-6",
        className,
      ].join(" ")}
    >
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}

      {children}

      {footer && <div className="mt-5">{footer}</div>}
    </div>
  );
}
