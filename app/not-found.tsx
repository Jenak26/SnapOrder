"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      </div>

      <section className="glass-strong relative z-10 w-full max-w-lg rounded-3xl p-8 text-center shadow-2xl shadow-black/40">
        <p className="bg-gradient-to-r from-orange-300 via-accent to-orange-500 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
          404
        </p>
        <h1 className="mt-5 text-2xl font-bold text-white">Page not found</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
          This route is not on the SnapOrder menu.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <ArrowLeft size={16} />
          Go back to SnapOrder
        </button>
      </section>
    </main>
  );
}
