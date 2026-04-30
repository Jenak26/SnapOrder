type SwiggyAttributionVariant = "inline" | "footer" | "powered-by";

interface Props {
  variant: SwiggyAttributionVariant;
  className?: string;
}

const SWIGGY_URL = "https://www.swiggy.com";

export default function SwiggyAttribution({ variant, className = "" }: Props) {
  if (variant === "inline") {
    return (
      <a
        href={SWIGGY_URL}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={`inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[11px] font-semibold leading-none text-orange-300 transition-colors hover:border-orange-300/60 hover:bg-orange-500/20 hover:text-orange-200 ${className}`}
        aria-label="Restaurant data powered by Swiggy"
      >
        <span aria-hidden="true">🍊</span>
        <span>Swiggy</span>
      </a>
    );
  }

  if (variant === "powered-by") {
    return (
      <a
        href={SWIGGY_URL}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-white/55 transition-colors hover:text-orange-300 ${className}`}
        aria-label="Powered by Swiggy MCP"
      >
        <span className="h-1 w-1 rounded-full bg-orange-400" aria-hidden="true" />
        <span>
          Powered by <span className="font-semibold text-orange-300">Swiggy MCP</span>
        </span>
      </a>
    );
  }

  return (
    <a
      href={SWIGGY_URL}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-center gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-3 py-2 text-center text-[11px] font-medium leading-snug text-white/70 transition-colors hover:border-orange-300/50 hover:bg-orange-500/15 hover:text-white ${className}`}
      aria-label="Restaurant data, pricing and delivery powered by Swiggy"
    >
      <span className="text-sm font-extrabold tracking-tight text-orange-300">
        Swiggy
      </span>
      <span>Restaurant data, pricing &amp; delivery powered by Swiggy</span>
    </a>
  );
}
