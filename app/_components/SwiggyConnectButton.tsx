"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Check, Link as LinkIcon, LogOut, RefreshCw } from "lucide-react";

interface AuthSessionResponse {
  isConnected: boolean;
  tokenExpiry: number | null;
  expiresInMinutes: number | null;
  isExpiringSoon: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then((response) => response.json() as Promise<AuthSessionResponse>);

const formatExpiry = (minutes: number | null) => {
  if (!minutes) return "Session active";
  if (minutes < 60) return `Expires in ${minutes} min`;

  const hours = Math.ceil(minutes / 60);
  return `Expires in ${hours} hour${hours === 1 ? "" : "s"}`;
};

const reasonLabel = (reason: string | null) => {
  if (reason === "state_mismatch") return "Security check failed. Please try again.";
  if (reason === "token_exchange") return "Swiggy token exchange failed. Please try again.";
  if (reason === "missing_oauth_config") return "Swiggy OAuth is not configured.";
  return reason || "Unable to connect Swiggy.";
};

export default function SwiggyConnectButton() {
  const { data, mutate } = useSWR<AuthSessionResponse>(
    "/api/auth/session",
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    const onFocus = () => mutate();
    window.addEventListener("focus", onFocus);
    mutate();

    return () => window.removeEventListener("focus", onFocus);
  }, [mutate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (!auth) return;

    let nextToast: { type: "success" | "error"; message: string } | null = null;

    if (auth === "success") {
      nextToast = { type: "success", message: "Swiggy account connected!" };
      mutate();
    } else if (auth === "error") {
      nextToast = {
        type: "error",
        message: reasonLabel(params.get("reason")),
      };
    }

    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, "", cleanUrl);
    const showTimer = nextToast
      ? window.setTimeout(() => setToast(nextToast), 0)
      : undefined;
    const timer = window.setTimeout(() => setToast(null), 4500);

    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      window.clearTimeout(timer);
    };
  }, [mutate]);

  const connect = () => {
    window.location.href = "/api/auth/login";
  };

  const isConnected = data?.isConnected;
  const isExpiringSoon = data?.isExpiringSoon;

  return (
    <div className="relative">
      {toast && (
        <div
          className={`absolute right-0 top-12 z-50 w-72 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl ${
            toast.type === "success"
              ? "border-success/30 bg-success/15 text-success"
              : "border-danger/30 bg-danger/15 text-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/*
        Deliberately a ghost control, not a filled CTA. This is a connection
        *status* affordance; "Order Now" is the page's single primary action.
      */}
      {!isConnected && (
        <button
          type="button"
          onClick={connect}
          className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-orange-400/40 hover:bg-white/10 hover:text-foreground sm:flex"
        >
          <LinkIcon size={15} />
          Connect Swiggy
        </button>
      )}

      {isConnected && isExpiringSoon && (
        <button
          type="button"
          onClick={connect}
          className="flex animate-pulse items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-400/15 px-4 py-2.5 text-sm font-semibold text-amber-200 shadow-lg shadow-amber-500/10 transition-colors hover:bg-amber-400/20"
        >
          <RefreshCw size={15} />
          Reconnect Swiggy
        </button>
      )}

      {isConnected && !isExpiringSoon && (
        <div className="group relative">
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
            <Check size={15} />
            Swiggy Connected
          </div>
          <p className="mt-1 hidden text-center text-[10px] font-medium text-muted sm:block">
            {formatExpiry(data?.expiresInMinutes ?? null)}
          </p>
          <a
            href="/api/auth/logout"
            className="absolute right-0 top-12 hidden items-center gap-2 rounded-xl border border-white/10 bg-black/85 px-3 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl transition-colors hover:border-danger/50 hover:text-red-300 group-hover:flex"
          >
            <LogOut size={13} />
            Disconnect
          </a>
        </div>
      )}
    </div>
  );
}
