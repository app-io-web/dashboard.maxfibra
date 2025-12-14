import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
};

export function FloatingSlot({ title, subtitle, onClick, children, className = "" }: Props) {
  const Wrapper: any = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "w-[320px] max-w-[85vw] rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl",
        "shadow-2xl shadow-black/40 p-4 text-left",
        onClick ? "hover:bg-white/15 active:scale-[0.99] transition" : "",
        className,
      ].join(" ")}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <div className="text-sm font-semibold text-white">{title}</div>}
          {subtitle && <div className="text-xs text-white/75 mt-1">{subtitle}</div>}
        </div>
      )}
      {children}
    </Wrapper>
  );
}
