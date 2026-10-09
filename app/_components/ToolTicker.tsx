const TOOLS = [
  "search_restaurants",
  "search_menu",
  "get_addresses",
  "update_food_cart",
  "get_food_cart",
  "fetch_food_coupons",
  "apply_food_coupon",
  "place_food_order",
  "track_food_order",
  "report_error",
];

/** One pass of the tool list. Hoisted so it isn't redefined on every render. */
function ToolRow({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul className="flex items-center" aria-hidden={duplicate || undefined}>
      {TOOLS.map((tool) => (
        <li key={tool} className="flex items-center">
          <span className="mono px-7 text-[12px] font-medium tracking-tight text-paper/85">
            {tool}
            <span className="text-chilli">()</span>
          </span>
          <span className="h-1 w-1 rounded-full bg-chilli" />
        </li>
      ))}
    </ul>
  );
}

/**
 * The ten Swiggy MCP tools SnapOrder actually calls, scrolling on an ink band.
 *
 * The list is doubled so the -50% translate loops seamlessly; `aria-hidden` on
 * the second copy keeps screen readers from reading it twice.
 */
export default function ToolTicker() {
  return (
    <div className="marquee-mask relative -mx-5 overflow-hidden bg-ink py-3.5 lg:-mx-10">
      <div className="marquee-track">
        <ToolRow />
        <ToolRow duplicate />
      </div>

      {/* Fade the band into the page at both ends. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
