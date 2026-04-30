import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

const swiggyPrivacyUrl = "https://www.swiggy.com/privacy-policy";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft size={16} />
          Back to SnapOrder
        </Link>

        <header className="mt-10 border-b border-border pb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Privacy
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            SnapOrder Data Handling
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Last updated: April 2026
          </p>
        </header>

        <div className="space-y-10 py-10">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white">
              What SnapOrder Collects
            </h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-muted">
              <li>
                <span className="font-semibold text-white">Photos:</span> Food
                photos are processed to identify matching dishes and are not
                stored by SnapOrder.
              </li>
              <li>
                <span className="font-semibold text-white">
                  Location coordinates:
                </span>{" "}
                Coordinates are used during the session to find nearby
                restaurants and are not stored on SnapOrder servers.
              </li>
              <li>
                <span className="font-semibold text-white">Cart state:</span>{" "}
                Cart contents are saved only in your browser&apos;s localStorage
                so the cart can persist during your visit.
              </li>
            </ul>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white">
              What Swiggy Handles
            </h2>
            <p className="mt-5 text-sm leading-6 text-muted">
              Swiggy provides restaurant data, menu availability, pricing,
              order processing, delivery, and payment flows used by SnapOrder.
              Order data and delivery operations are governed by Swiggy&apos;s
              privacy practices.
            </p>
            <a
              href={swiggyPrivacyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition-colors hover:border-orange-300/60 hover:bg-orange-500/20 hover:text-orange-200"
            >
              Swiggy privacy policy
              <ExternalLink size={14} />
            </a>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white">Data Questions</h2>
            <p className="mt-5 text-sm leading-6 text-muted">
              For questions about Swiggy-powered data handling in this Builders
              Club experience, contact{" "}
              <a
                href="mailto:builders@swiggy.in"
                className="font-semibold text-orange-300 transition-colors hover:text-orange-200"
              >
                builders@swiggy.in
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
