import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Wordmark from "../_components/Wordmark";

const swiggyPrivacyUrl = "https://www.swiggy.com/privacy-policy";

const sections = [
  {
    n: "01",
    heading: "What SnapOrder collects",
    rows: [
      {
        k: "Photographs",
        v: "Your photo is sent to Gemini for identification and discarded once the dish is named. SnapOrder never writes it to disk.",
      },
      {
        k: "Location",
        v: "Coordinates are held for the length of your session to find nearby kitchens. They are not persisted on any SnapOrder server.",
      },
      {
        k: "Cart contents",
        v: "Kept in your own browser's localStorage so your bill survives a refresh. It never leaves the device except as part of an order you place.",
      },
    ],
  },
  {
    n: "02",
    heading: "What Swiggy handles",
    rows: [
      {
        k: "Restaurants & menus",
        v: "All restaurant data, availability and pricing come from Swiggy's live network.",
      },
      {
        k: "Orders & delivery",
        v: "Order processing, payment and delivery are carried out by Swiggy and governed by their privacy practices.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="group">
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="link-draw inline-flex items-center gap-2 text-[13px] font-medium text-ink-2 hover:text-ink"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
        </div>

        <header className="mt-20 border-b border-ink/25 pb-10">
          <div className="flex items-center gap-4">
            <span className="mono text-[11px] text-chilli">00</span>
            <span className="label">Data handling</span>
            <span className="rule-h" />
          </div>
          <h1 className="display mt-6 text-[3rem] leading-[0.92] sm:text-[4.5rem]">
            What we keep.
            <br />
            <span className="display-em">Almost nothing.</span>
          </h1>
          <p className="mono mt-6 text-[11px] text-ink-3">
            LAST UPDATED — APRIL 2026
          </p>
        </header>

        {sections.map((section) => (
          <section key={section.n} className="mt-14">
            <div className="flex items-center gap-4">
              <span className="mono text-[11px] text-chilli">{section.n}</span>
              <h2 className="label label-ink whitespace-nowrap">
                {section.heading}
              </h2>
              <span className="rule-h" />
            </div>

            <dl className="mt-6 border-t border-rule">
              {section.rows.map((row) => (
                <div
                  key={row.k}
                  className="grid gap-2 border-b border-rule py-5 sm:grid-cols-3 sm:gap-6"
                >
                  <dt className="serif text-[17px] text-ink">{row.k}</dt>
                  <dd className="text-[14px] leading-relaxed text-ink-2 sm:col-span-2">
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section className="mt-14 bg-card p-7">
          <p className="label label-chilli">Questions</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            For anything about Swiggy-powered data handling in this Builders
            Club experience, write to{" "}
            <a
              href="mailto:builders@swiggy.in"
              className="link-draw font-semibold text-ink"
            >
              builders@swiggy.in
            </a>
            .
          </p>
          <a
            href={swiggyPrivacyUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-press-sm mt-6 inline-flex items-center gap-2 rounded-full border border-ink bg-card px-5 py-2.5 text-[13px] font-semibold text-ink"
          >
            Swiggy privacy policy
            <ArrowUpRight size={14} />
          </a>
        </section>

        <div className="perf mt-16" />
        <p className="mono py-6 text-[10px] text-ink-3">
          © 2026 SNAPORDER · BUILT FOR SWIGGY BUILDERS CLUB
        </p>
      </div>
    </main>
  );
}
