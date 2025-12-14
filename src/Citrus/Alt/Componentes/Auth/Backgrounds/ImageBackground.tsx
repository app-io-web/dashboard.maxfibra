import React from "react";

type Props = {
  opacity?: number;
  objectPosition?: React.CSSProperties["objectPosition"];
  className?: string;
};

export function ImageBackground({
  opacity = 0.98,
  objectPosition = "left center",
  className = "",
}: Props) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <picture>
        {/* 4K real (16:9) */}
        <source media="(min-width: 3000px)" srcSet="/Appsystem3840x2160.gif" />

        {/* 🔥 Seu caso real: viewport ultrawide "baixo" (ex: 2560x911 = ~2.81) */}
        <source
          media="(min-width: 2300px) and (min-aspect-ratio: 2.7)"
          srcSet="/Appsystem2560x911.gif"
        />

        {/* Ultrawide 21:9 padrão (2560x1080 ~ 2.37) */}
        <source
          media="(min-width: 2300px) and (min-aspect-ratio: 2.2)"
          srcSet="/Appsystem2560x1080.gif"
        />

        {/* 16:9 grande (QHD-ish) — só se NÃO for ultrawide */}
        <source
          media="(min-width: 1920px) and (max-aspect-ratio: 2)"
          srcSet="/Appsystem2048x1440.gif"
        />

        {/* FullHD+ wide (caso exista necessidade em telas intermediárias) */}
        <source media="(min-width: 1600px)" srcSet="/Appsystem2048x1080.gif" />

        {/* fallback */}
        <img
          src="/Appsystem1920x1080.gif"
          alt=""
          className="h-full w-full object-cover"
          style={{ opacity, objectPosition }}
          draggable={false}
        />
      </picture>
    </div>
  );
}
