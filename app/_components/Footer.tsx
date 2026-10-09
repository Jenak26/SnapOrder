import { ArrowUpRight } from "lucide-react";
import Wordmark from "./Wordmark";

/**
 * The previous footer advertised Pricing, API, Blog, Careers and Press, five
 * links that all pointed at "#". Dead navigation is worse than no navigation,
 * so this lists only destinations that exist.
 */
const columns = [
  {
    heading: "The page",
    links: [
      { label: "Upload a photo", href: "#upload" },
      { label: "Your matches", href: "#demo" },
      { label: "Kitchens nearby", href: "#restaurants" },
      { label: "How it works", href: "#method" },
    ],
  },
  {
    heading: "Data",
    links: [
      { label: "How we handle your data", href: "/privacy" },
      {
        label: "Swiggy privacy policy",
        href: "https://www.swiggy.com/privacy-policy",
        external: true,
      },
      { label: "Swiggy", href: "https://www.swiggy.com", external: true },
    ],
  },
  {
    heading: "Built by",
    links: [
      {
        label: "Janak Kabra",
        href: "https://github.com/jenak26",
        external: true,
      },
      { label: "Source on GitHub", href: "https://github.com/jenak26/SnapOrder", external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative overflow-hidden bg-ink pt-20 text-paper"
    >
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
        <div className="grid gap-12 border-b border-paper/12 pb-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Wordmark inverted />
            <p className="mt-6 max-w-sm text-[15px] leading-[1.7] text-paper/65">
              Photograph a dish anywhere, a menu, a feed, someone else&apos;s
              plate, and order the closest thing to it from a kitchen near you.
            </p>

            <a
              href="#upload"
              className="btn-press-sm mt-8 inline-flex items-center gap-2.5 rounded-full bg-chilli px-6 py-3 text-[14px] font-semibold text-card hover:bg-chilli-2"
              style={{ boxShadow: "2px 2px 0 #f2ece1" }}
            >
              Snap a dish
              <ArrowUpRight size={15} />
            </a>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} className="lg:col-span-2 lg:col-start-auto">
              <h4 className="label text-paper/45">{col.heading}</h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...("external" in link && link.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="link-draw inline-flex items-start gap-1 py-1.5 text-[14px] text-paper/70 transition-colors hover:text-paper"
                    >
                      {link.label}
                      {"external" in link && link.external ? (
                        <ArrowUpRight size={11} className="mt-1 opacity-50" />
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Colophon */}
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-[11px] text-paper/45">
            © 2026 SnapOrder · Built for Swiggy Builders Club
          </p>
          <p className="mono text-[11px] text-paper/45">
            Find your next favourite.
          </p>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the page edge. Typography as the
          closing image rather than a row of social glyphs. */}
      <div
        aria-hidden
        className="pointer-events-none select-none overflow-hidden px-5 lg:px-10"
      >
        <p className="display -mb-[0.16em] whitespace-nowrap text-[19vw] leading-[0.78] text-paper/8">
          SnapOrder
        </p>
      </div>
    </footer>
  );
}

