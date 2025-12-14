import React from "react";

type BackgroundMode = "image" | "gradient" | "none";
type BackgroundFit = "cover" | "contain";

type Props = {
  backgroundImageUrl?: string;
  backgroundGradientClassName?: string;
  backgroundMode?: BackgroundMode;

  /** Mobile: mostrar só o card, sem background */
  hideBackgroundOnMobile?: boolean;

  /** (se usar backgroundImageUrl) Como o background se comporta */
  backgroundFit?: BackgroundFit;
  backgroundFit2xl?: BackgroundFit;
  backgroundPosition?: string;

  /** Card mais pra direita (respiro da borda) */
  rightGutterClassName?: string;
  /** Largura do card */
  rightWidthPx?: number;

  /** ✅ Preferencial: usar slot (Picture/Img) */
  backgroundSlot?: React.ReactNode;

  leftSlot?: React.ReactNode;
  floatingSlot?: React.ReactNode;

  children: React.ReactNode;
  className?: string;
};

export function AuthHeroLayout({
  backgroundImageUrl,
  backgroundGradientClassName = "bg-gradient-to-br from-neutral-950 via-black to-neutral-900",
  backgroundMode,
  hideBackgroundOnMobile = true,

  backgroundFit = "cover",
  backgroundFit2xl = "cover",
  backgroundPosition = "left center",

  rightGutterClassName = "md:pr-12 2xl:pr-24",
  rightWidthPx = 440,

  backgroundSlot,
  leftSlot,
  floatingSlot,
  children,
  className = "",
}: Props) {
  // ✅ Se tem backgroundSlot, a intenção é usar ele.
  const resolvedMode: BackgroundMode =
    backgroundMode ??
    (backgroundSlot
      ? "none"
      : backgroundImageUrl
      ? "image"
      : backgroundGradientClassName
      ? "gradient"
      : "none");

  const bgVisibleClass = hideBackgroundOnMobile ? "hidden md:block" : "block";

  return (
    <div className={`min-h-screen relative overflow-hidden bg-neutral-950 ${className}`}>
      {/* ✅ Background via Slot (preferido) */}
      {backgroundSlot ? (
        <div className={`absolute inset-0 ${bgVisibleClass}`}>{backgroundSlot}</div>
      ) : null}

      {/* Background via CSS (fallback) */}
      {!backgroundSlot && resolvedMode === "image" && backgroundImageUrl && (
        <div
          className={[
            "absolute inset-0 bg-no-repeat",
            bgVisibleClass,
            backgroundFit === "cover" ? "bg-cover" : "bg-contain",
            backgroundFit2xl === "cover" ? "2xl:bg-cover" : "2xl:bg-contain",
          ].join(" ")}
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundPosition,
          }}
        />
      )}

      {!backgroundSlot && resolvedMode === "gradient" && (
        <div className={`absolute inset-0 ${backgroundGradientClassName} ${bgVisibleClass}`} />
      )}

      {/* overlays (some no mobile) */}
      <div className={`absolute inset-0 bg-gradient-to-r from-black/35 via-black/15 to-black/10 ${bgVisibleClass}`} />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 ${bgVisibleClass}`} />

      {/* Conteúdo */}
      <div className="relative z-10 min-h-screen w-full">
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-[1fr_auto] items-center">
          {/* Esquerda (só no md+) */}
          <div className="hidden md:block pl-10 2xl:pl-16">
            {leftSlot ?? <div aria-hidden className="h-1" />}
          </div>

          {/* Direita (card colado na direita) */}
          <div className={`flex justify-center md:justify-end ${rightGutterClassName}`}>
            <div className="w-full max-w-sm md:max-w-none" style={{ width: rightWidthPx }}>
              {children}
            </div>
          </div>

          {floatingSlot ? <div className="hidden">{floatingSlot}</div> : null}
        </div>
      </div>
    </div>
  );
}
