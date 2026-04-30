"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clipboard, Home, RefreshCw, Send } from "lucide-react";

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
          context: error.digest ? `app_error_boundary | ${error.digest}` : "app_error_boundary",
        }),
      });
    } finally {
      setReportStatus("sent");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-[280px] w-[280px] rounded-full bg-orange-400/10 blur-[90px]" />
      </div>

      <section className="glass-strong relative z-10 w-full max-w-xl rounded-3xl p-6 text-center shadow-2xl shadow-black/40 sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent glow-orange">
          <AlertTriangle size={30} />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          SnapOrder hit an unexpected issue. Try again, head home, or send this
          report to Swiggy support with the correlation ID below.
        </p>

        {process.env.NODE_ENV === "development" && (
          <pre className="mt-6 max-h-36 overflow-auto rounded-2xl border border-white/10 bg-black/50 p-4 text-left text-xs leading-5 text-orange-100">
            <code>{error.message}</code>
          </pre>
        )}

        <div className="mt-6 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-300">
            Correlation ID
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-black/35 px-3 py-2">
            <code className="text-sm font-semibold text-white">{correlationId}</code>
            <button
              type="button"
              onClick={copyCorrelationId}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-accent/50 hover:text-accent"
              aria-label="Copy correlation ID"
              title={copied ? "Copied" : "Copy correlation ID"}
            >
              <Clipboard size={14} />
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-xs font-medium text-orange-200">Copied</p>
          )}
        </div>

        {reportStatus === "sent" && (
          <p className="mt-5 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
            Thanks! We&apos;ve logged this issue.
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-accent/40 hover:bg-white/10"
          >
            <Home size={16} />
            Go Home
          </button>
          <button
            type="button"
            onClick={reportIssue}
            disabled={reportStatus !== "idle"}
            className="flex items-center justify-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-200 transition-colors hover:border-orange-300/60 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send size={16} />
            {reportStatus === "sending" ? "Reporting..." : "Report this issue"}
          </button>
        </div>
      </section>
    </main>
  );
}
