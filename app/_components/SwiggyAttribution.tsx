type SwiggyAttributionVariant = "inline" | "footer" | "powered-by";

interface Props {
  variant: SwiggyAttributionVariant;
  className?: string;
}

const SWIGGY_URL = "https://www.swiggy.com";

/**
 * Builders Club attribution. Swiggy's orange is close enough to the page's
 * chilli that a filled badge would read as SnapOrder's own accent, so the
 * attribution stays a quiet typographic credit and keeps the brand name
 * legible — which is the point of the requirement.
 */
export default function SwiggyAttribution({ variant, className = "" }: Props) {
  if (variant === "inline") {
    return (
      <a
        href={SWIGGY_URL}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={`mono inline-flex items-center gap-1.5 text-[10px] font-medium text-ink-3 transition-colors hover:text-chilli ${className}`}
        aria-label="Restaurant data powered by Swiggy"
      >
        <span className="h-1 w-1 rounded-full bg-chilli" aria-hidden="true" />
        Swiggy
      </a>
    );
  }

  if (variant === "powered-by") {
    return (
      <a
        href={SWIGGY_URL}
        target="_blank"
        rel="noreferrer"
        className={`label inline-flex items-center gap-1.5 transition-colors hover:text-chilli ${className}`}
        aria-label="Powered by Swiggy MCP"
      >
        <span className="h-1 w-1 rounded-full bg-chilli" aria-hidden="true" />
        Powered by Swiggy MCP
      </a>
    );
  }

  return (
    <a
      href={SWIGGY_URL}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-center gap-2 border-t border-rule pt-3 text-center transition-colors hover:text-ink ${className}`}
      aria-label="Restaurant data, pricing and delivery powered by Swiggy"
    >
      <span className="label text-[9px] leading-relaxed">
        Restaurant data, pricing &amp; delivery powered by{" "}
        <span className="font-semibold text-chilli">Swiggy</span>
      </span>
    </a>
  );
}
