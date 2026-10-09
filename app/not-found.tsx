import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Wordmark from "./_components/Wordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col px-5 py-10 lg:px-10">
      <Link href="/" className="group w-fit">
        <Wordmark />
      </Link>

      <div className="flex flex-1 items-center">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-4">
            <span className="mono text-[11px] text-chilli">404</span>
            <span className="label">Not on the menu</span>
            <span className="rule-h" />
          </div>

          <h1 className="display mt-7 text-[3.5rem] leading-[0.88] sm:text-[6rem]">
            We don&apos;t
            <br />
            serve <span className="display-em">that.</span>
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ink-2">
            This page isn&apos;t on the menu — it may have been moved, or it
            never existed. The kitchen is still open, though.
          </p>

          <Link
            href="/"
            className="btn-press mt-10 inline-flex items-center gap-2.5 rounded-full bg-chilli px-7 py-3.5 text-[15px] font-semibold text-card hover:bg-chilli-2"
          >
            <ArrowLeft size={16} />
            Back to SnapOrder
          </Link>
        </div>
      </div>
    </main>
  );
}
