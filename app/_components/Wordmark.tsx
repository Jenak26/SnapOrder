interface Props {
  className?: string;
  /** Renders light-on-dark, for use over the footer's ink field. */
  inverted?: boolean;
}

/**
 * The mark is a lens and a plate at once: an aperture ring with a bite taken
 * out of it. It says "camera" and "food" in one shape, which a stock camera
 * glyph in a rounded square does not.
 */
export default function Wordmark({ className = "", inverted = false }: Props) {
  const ink = inverted ? "#f2ece1" : "#16120e";

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-500 group-hover:rotate-[24deg]"
      >
        {/* aperture ring */}
        <circle cx="13" cy="13" r="11.1" stroke={ink} strokeWidth="1.6" />
        {/* the plate */}
        <circle cx="13" cy="13" r="6.2" fill="#ce3a17" />
        {/* the bite — a notch out of the ring at 1 o'clock */}
        <circle cx="21.4" cy="5.2" r="3.9" fill={inverted ? "#16120e" : "#f2ece1"} />
        <circle cx="21.4" cy="5.2" r="1.5" fill={ink} />
      </svg>

      <span
        className="serif text-[19px] leading-none tracking-[-0.02em]"
        style={{ color: ink }}
      >
        Snap
        <span className="italic" style={{ color: "#ce3a17" }}>
          Order
        </span>
      </span>
    </span>
  );
}
