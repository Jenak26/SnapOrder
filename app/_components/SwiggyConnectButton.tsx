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
      nextToast = { type: "success", message: "Swiggy account connected." };
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
          className={`animate-rise absolute right-0 top-12 z-50 w-72 border-l-2 px-4 py-3 text-[13px] font-medium shadow-[0_16px_40px_-16px_rgba(22,18,14,0.6)] ${
            toast.type === "success"
              ? "border-cardamom bg-card text-cardamom"
              : "border-danger bg-card text-danger"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/*
        Deliberately a ghost control, not a filled CTA. This is a connection
        *status* affordance; "Snap a dish" is the page's single primary action.
      */}
      {!isConnected && (
        <button
          type="button"
          onClick={connect}
          className="flex h-10 items-center gap-2 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink hover:bg-card hover:text-ink"
        >
          <LinkIcon size={13} />
          Connect Swiggy
        </button>
      )}

      {isConnected && isExpiringSoon && (
        <button
          type="button"
          onClick={connect}
          className="flex h-10 items-center gap-2 rounded-full border border-turmeric bg-turmeric/12 px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-turmeric/20"
        >
          <RefreshCw size={13} />
          Reconnect
        </button>
      )}

      {isConnected && !isExpiringSoon && (
        <div className="group relative">
          <div className="flex h-10 items-center gap-2 rounded-full border border-cardamom/40 bg-cardamom/10 px-4 text-[13px] font-semibold text-cardamom">
            <Check size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">Swiggy connected</span>
          </div>
          <a
            href="/api/auth/logout"
            className="absolute right-0 top-12 hidden items-center gap-2 whitespace-nowrap border border-rule bg-card px-3 py-2 text-[12px] font-semibold text-ink shadow-[0_12px_30px_-12px_rgba(22,18,14,0.5)] transition-colors hover:text-danger group-hover:flex group-focus-within:flex"
          >
            <LogOut size={12} />
            Disconnect
            <span className="label ml-2 text-[9px]">
              {formatExpiry(data?.expiresInMinutes ?? null)}
            </span>
          </a>
        </div>
      )}
    </div>
  );
}

