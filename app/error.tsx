"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, Home, RefreshCw, Send, Check } from "lucide-react";
import Wordmark from "./_components/Wordmark";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const [correlationId, setCorrelationId] = useState("ERR_PENDING");
  const [copied, setCopied] = useState(false);
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent">(
    "idle"
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setCorrelationId(`ERR_${Date.now()}`), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const copyCorrelationId = async () => {
    await navigator.clipboard.writeText(correlationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const reportIssue = async () => {
    if (reportStatus === "sending" || reportStatus === "sent") return;

    setReportStatus("sending");

    try {
      await fetch("/api/mcp/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorMessage: error.message || "Unhandled SnapOrder error",
          correlationId,
          context: error.digest
            ? `app_error_boundary | ${error.digest}`
            : "app_error_boundary",
        }),
      });
    } finally {
      setReportStatus("sent");
    }
  };

  return (
    <main className="flex min-h-screen flex-col px-5 py-10 lg:px-10">
      <div className="w-fit">
        <Wordmark />
      </div>

      <div className="flex flex-1 items-center">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-4">
            <span className="mono text-[11px] text-chilli">!!</span>
            <span className="label">Something burned</span>
            <span className="rule-h" />
          </div>

          <h1 className="display mt-7 text-[3rem] leading-[0.9] sm:text-[5rem]">
            The order
            <br />
            <span className="display-em">didn&apos;t go through.</span>
          </h1>

          <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-ink-2">
            SnapOrder hit an unexpected problem. Try again, head back to the
            start, or send this docket number to Swiggy support.
          </p>

          {process.env.NODE_ENV === "development" && (
            <pre className="mono mt-8 max-h-40 overflow-auto border-l-2 border-danger bg-card p-4 text-left text-[12px] leading-5 text-danger">
              <code>{error.message}</code>
            </pre>
          )}

          {/* Docket number */}
          <div className="mt-8 flex max-w-md items-center justify-between gap-4 bg-card px-5 py-4">
            <div className="min-w-0">
              <p className="label">Docket number</p>
              <code className="mono mt-1.5 block truncate text-[15px] font-semibold text-ink">
                {correlationId}
              </code>
            </div>
            <button
              type="button"
              onClick={copyCorrelationId}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-ink hover:bg-paper-2"
              aria-label="Copy docket number"
              title={copied ? "Copied" : "Copy docket number"}
            >
              {copied ? (
                <Check size={14} strokeWidth={2.5} className="text-cardamom" />
              ) : (
                <Clipboard size={14} />
              )}
            </button>
          </div>

          {reportStatus === "sent" && (
            <p className="mt-4 max-w-md border-l-2 border-cardamom bg-cardamom/8 px-4 py-3 text-[13px] font-medium text-cardamom">
              Logged — thank you.
            </p>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="btn-press inline-flex items-center gap-2 rounded-full bg-chilli px-6 py-3.5 text-[14px] font-semibold text-card hover:bg-chilli-2"
            >
              <RefreshCw size={15} />
              Try again
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn-press inline-flex items-center gap-2 rounded-full border border-ink bg-card px-6 py-3.5 text-[14px] font-semibold text-ink"
            >
              <Home size={15} />
              Start over
            </button>
            <button
              type="button"
              onClick={reportIssue}
              disabled={reportStatus !== "idle"}
              className="inline-flex items-center gap-2 rounded-full border border-rule px-6 py-3.5 text-[14px] font-medium text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              <Send size={15} />
              {reportStatus === "sending" ? "Reporting…" : "Report this"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
