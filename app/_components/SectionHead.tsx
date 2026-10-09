import type { ReactNode } from "react";

interface Props {
  /** Two-digit section index, printed like a page number. */
  index: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Optional slot pinned to the right of the rule on wide viewports. */
  aside?: ReactNode;
}

/**
 * Index numeral, hairline rule, label — then the headline beneath it.
 *
 * Every section on the page opens this way. The repetition is the point:
 * a consistent masthead reads as an edited publication, where a centred
 * title-plus-subtitle on each section reads as generated.
 */
export default function SectionHead({
  index,
  eyebrow,
  title,
  lede,
  aside,
}: Props) {
  return (
    <header data-reveal className="section-heading mb-8 sm:mb-10">
      <div className="flex items-center gap-4">
        <span className="mono text-[11px] font-medium text-chilli">{index}</span>
        <span className="label whitespace-nowrap">{eyebrow}</span>
        <span className="rule-h" />
        {aside ? <div className="hidden shrink-0 sm:block">{aside}</div> : null}
      </div>

      <h2 className="display mt-6 max-w-[16ch] text-[2rem] leading-[1.12] sm:text-[2.75rem]">
        {title}
      </h2>

      {lede ? (
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-2">
          {lede}
        </p>
      ) : null}
    </header>
  );
}

