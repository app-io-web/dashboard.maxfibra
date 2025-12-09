import React from "react";

type NoteContentRendererProps = {
  content: string;
  interactive?: boolean;
  onToggleChecklistItem?: (newContent: string) => void;

  /**
   * preview = usado em cards (dashboard, lista)
   * full = usado em modal / editor
   */
  variant?: "full" | "preview";

  /**
   * Limite de caracteres de TEXTO para renderizar.
   * Se não passar, não limita.
   */
  charLimit?: number;

  /**
   * Controla se imagens markdown devem ser exibidas.
   * - true (default): mostra normalmente
   * - false: linhas de imagem são ignoradas
   */
  showImages?: boolean;
};

function toggleLineChecklist(
  content: string,
  lineIndex: number,
  currentChecked: boolean
): string {
  const lines = content.split("\n");
  const line = lines[lineIndex] ?? "";

  const uncheckedPrefix = "- [ ] ";
  const checkedPrefixLower = "- [x] ";
  const checkedPrefixUpper = "- [X] ";

  let newLine = line;

  if (!currentChecked) {
    // marcar como feito
    if (line.startsWith(uncheckedPrefix)) {
      newLine = checkedPrefixLower + line.slice(uncheckedPrefix.length);
    } else {
      // fallback se o prefixo estiver estranho
      newLine = line.replace(/^-\s\[\s\]\s/, "- [x] ");
    }
  } else {
    // desmarcar
    if (line.startsWith(checkedPrefixLower)) {
      newLine = uncheckedPrefix + line.slice(checkedPrefixLower.length);
    } else if (line.startsWith(checkedPrefixUpper)) {
      newLine = uncheckedPrefix + line.slice(checkedPrefixUpper.length);
    } else {
      newLine = line.replace(/^-\s\[[xX]\]\s/, "- [ ] ");
    }
  }

  lines[lineIndex] = newLine;
  return lines.join("\n");
}

export function NoteContentRenderer({
  content,
  interactive = false,
  onToggleChecklistItem,
  variant = "full",
  charLimit,
  showImages = true,
}: NoteContentRendererProps) {
  if (!content.trim()) {
    return (
      <p className="mt-1 text-xs text-slate-400">
        (Sem detalhes na anotação)
      </p>
    );
  }

  const isPreview = variant === "preview";
  const lines = content.split("\n");

  // controle de limite de caracteres só para texto
  let remaining = typeof charLimit === "number" ? charLimit : Infinity;
  let reachedLimit = false;

  return (
    <div className="mt-1 space-y-1">
      {lines.map((line, index) => {
        if (reachedLimit) return null;

        const checklistMatch = line.match(/^-\s\[(.| )\]\s(.*)$/);
        const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);

        // linha de checklist
        if (checklistMatch) {
          const marker = checklistMatch[1];
          const text = checklistMatch[2] || "";
          const checked = marker.toLowerCase() === "x";

          let displayText = text;

          if (isPreview && remaining <= 0) {
            reachedLimit = true;
            return null;
          }

          if (isPreview) {
            if (displayText.length > remaining) {
              displayText = displayText.slice(0, remaining) + "…";
              remaining = 0;
              reachedLimit = true;
            } else {
              remaining -= displayText.length;
            }
          }

          const handleChange = () => {
            if (!interactive || !onToggleChecklistItem) return;
            const newContent = toggleLineChecklist(content, index, checked);
            onToggleChecklistItem(newContent);
          };

          return (
            <div
              key={index}
              className="flex items-start gap-2 text-xs text-slate-700"
            >
              <input
                type="checkbox"
                className="mt-[2px] h-3 w-3 rounded border-slate-300"
                checked={checked}
                onChange={handleChange}
                disabled={!interactive}
              />
              <span
                className={
                  checked ? "line-through text-slate-400" : "text-slate-700"
                }
              >
                {displayText}
              </span>
            </div>
          );
        }

        // imagem markdown
        if (imageMatch) {
          // se estiver com showImages = false, ignora totalmente a linha
          if (!showImages) {
            return null;
          }

          const alt = imageMatch[1] || "imagem";
          const src = imageMatch[2];

          return (
            <div key={index} className="mt-2">
              <img
                src={src}
                alt={alt}
                className={
                  // preview = bem menor
                  isPreview
                    ? "max-h-20 max-w-full rounded-lg border border-slate-200 object-contain"
                    : "max-h-48 max-w-full rounded-lg border border-slate-200 object-contain"
                }
              />
              {alt && (
                <p className="mt-1 text-[10px] text-slate-400">{alt}</p>
              )}
            </div>
          );
        }

        // linha em branco
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }

        // texto normal
        let displayLine = line;

        if (isPreview && remaining <= 0) {
          reachedLimit = true;
          return null;
        }

        if (isPreview) {
          if (displayLine.length > remaining) {
            displayLine = displayLine.slice(0, remaining) + "…";
            remaining = 0;
            reachedLimit = true;
          } else {
            remaining -= displayLine.length;
          }
        }

        return (
          <p key={index} className="text-xs text-slate-700 whitespace-pre-wrap">
            {displayLine}
          </p>
        );
      })}
    </div>
  );
}
