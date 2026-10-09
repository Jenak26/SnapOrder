"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  X,
  Camera,
  AlertCircle,
  Check,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import type { MatchResult, AnalyzeImageResult, AnalyzeResult } from "@/app/_lib/types";
import { useGeolocation } from "@/app/_hooks/useGeolocation";
import LocationBadge from "./LocationBadge";
import SectionHead from "./SectionHead";

// ── Constants ────────────────────────────────────────────
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = { "image/*": [".jpg", ".jpeg", ".png", ".webp"] };

type UploadStatus = "idle" | "previewing" | "analyzing" | "success" | "error" | "compressing";

const LOADING_STEPS = [
  "Reading the photograph",
  "Naming the dish and cuisine",
  "Searching kitchens near you",
  "Ranking by match and distance",
];

const INSTRUCTIONS = [
  "Choose a clear food photo from your gallery, or take a new one.",
  "We identify the dish and find similar food near you.",
  "Compare your matches and choose what you want to order.",
];

// ── Compression Helper ───────────────────────────────────
async function compressImage(file: File, maxWidth = 1600): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        // Output as high quality WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            }));
          },
          "image/webp",
          0.85
        );
      };
      img.onerror = () => resolve(file); // fallback to original on error
    };
    reader.onerror = () => resolve(file);
  });
}

interface Props {
  onResults?: (results: MatchResult[]) => void;
  onAnalysis?: (analysis: AnalyzeImageResult) => void;
}

export default function UploadCard({ onResults, onAnalysis }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { lat, lng, city, status: geoStatus, requestLocation } = useGeolocation();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Detect a genuinely touch-first device.
  //
  // The old test was `"ontouchstart" in window || maxTouchPoints > 0`, which is
  // true on any touchscreen laptop · so desktops with a touch panel got the
  // camera buttons and never saw the drop zone at all. `pointer: coarse`
  // describes the *primary* pointer, which is the actual question, and the
  // width bound keeps a large tablet in the desktop layout it has room for.
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const check = () => setIsMobile(mq.matches && window.innerWidth < 1024);
    check();
    mq.addEventListener("change", check);
    window.addEventListener("resize", check);
    return () => {
      mq.removeEventListener("change", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // ── File handler (shared by dropzone + camera) ─────────
  const handleFile = useCallback(
    async (incoming: File) => {
      // Type guard
      if (!["image/jpeg", "image/png", "image/webp"].includes(incoming.type)) {
        setError("Unsupported file type. Please use JPG, PNG, or WebP.");
        return;
      }

      // Clear any previous state
      if (preview) URL.revokeObjectURL(preview);
      setError(null);
      setStatus("compressing");

      try {
        const compressedFile = await compressImage(incoming);

        // Size guard after compression
        if (compressedFile.size > MAX_SIZE) {
          setError(
            `File too large (${(compressedFile.size / 1024 / 1024).toFixed(
              1
            )} MB). Maximum is 10 MB.`
          );
          setStatus("idle");
          return;
        }

        setFile(compressedFile);
        setPreview(URL.createObjectURL(compressedFile));
        setStatus("previewing");
      } catch (err) {
        console.error("Compression failed", err);
        setError("Failed to process image.");
        setStatus("idle");
      }
    },
    [preview]
  );

  // ── Dropzone ───────────────────────────────────────────
  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const r = rejections[0];
        const msg =
          r.errors[0]?.code === "file-too-large"
            ? "File too large. Maximum is 10 MB."
            : r.errors[0]?.code === "file-invalid-type"
            ? "Unsupported file type. Use JPG, PNG, or WebP."
            : r.errors[0]?.message ?? "File rejected.";
        setError(msg);
        return;
      }
      if (accepted[0]) handleFile(accepted[0]);
    },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_SIZE,
    noClick: status === "analyzing" || status === "compressing" || isMobile,
  });

  // ── Camera capture (mobile) ────────────────────────────
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const captured = e.target.files?.[0];
    if (captured) {
      await handleFile(captured);
    }
    e.target.value = "";
  };

  // ── Analyze API call ───────────────────────────────────
  const analyzeImage = async (fileToAnalyze?: File) => {
    const target = fileToAnalyze ?? file;
    if (!target) return;

    setStatus("analyzing");
    setLoadingStep(0);
    setError(null);

    // Step progression animation
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep = Math.min(currentStep + 1, LOADING_STEPS.length - 1);
      setLoadingStep(currentStep);
    }, 1500);

    try {
      const formData = new FormData();
      formData.append("image", target);
      formData.append("lat", lat.toString());
      formData.append("lng", lng.toString());

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });

      const data: AnalyzeResult = await res.json();

      clearInterval(stepInterval);

      if (!data.success) {
        setError(data.error);
        setStatus("error");
        return;
      }

      // Fast forward to last step before resolving to success for smooth UX
      setLoadingStep(LOADING_STEPS.length - 1);
      await new Promise((resolve) => setTimeout(resolve, 600));

      setStatus("success");
      onAnalysis?.(data.analysis);
      onResults?.(data.results);

      // Auto-scroll to results
      setTimeout(() => {
        document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
      }, 800);
    } catch {
      clearInterval(stepInterval);
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  // ── Reset ──────────────────────────────────────────────
  const clearAll = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setError(null);
  };

  const isBusy = status === "analyzing" || status === "compressing";

  return (
    <section id="upload" className="relative px-5 py-24 sm:py-32 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <SectionHead
          index="01"
          eyebrow="Start here"
          title={
            <>
              What are you <span className="display-em">craving?</span>
            </>
          }
          aside={
            <LocationBadge
              status={geoStatus}
              city={city}
              onRequestRefresh={() => requestLocation(true)}
            />
          }
        />

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ── Instructions: a numbered ticket ─────────────── */}
          <aside data-reveal className="lg:col-span-4">
            <ol className="border-t border-rule">
              {INSTRUCTIONS.map((text, i) => (
                <li
                  key={text}
                  className="flex gap-5 border-b border-rule py-5"
                >
                  <span className="numeral shrink-0 text-[26px] leading-none text-chilli">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14px] leading-relaxed text-ink-2">{text}</p>
                </li>
              ))}
            </ol>

            <p className="label mt-6 leading-[1.8]">
              JPG · PNG · WEBP · max 10 MB
              <br />
              Compressed in your browser. Never stored.
            </p>

            {/* Mobile-only location badge; on desktop it rides the section rule. */}
            <div className="mt-6 sm:hidden">
              <LocationBadge
                status={geoStatus}
                city={city}
                onRequestRefresh={() => requestLocation(true)}
              />
            </div>
          </aside>

          {/* ── The sheet ───────────────────────────────────── */}
          <div data-reveal className="lg:col-span-8">
            <div className="relative bg-card p-3 shadow-[0_24px_60px_-30px_rgba(22,18,14,0.5)]">


              <div
                {...getRootProps()}
                id="upload-dropzone"
                className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center overflow-hidden ${
                  preview ? "p-0" : "dropzone"
                } ${isDragActive ? "active" : ""}`}
              >
                <input {...getInputProps()} id="upload-input" />

                {preview ? (
                  /* ── Preview state ── */
                  <div className="relative w-full">
                    <Image
                      src={preview}
                      alt="Uploaded food"
                      width={900}
                      height={560}
                      className="photo-warm h-auto max-h-[560px] w-full object-cover"
                      unoptimized
                    />

                    {/* Processing: a kitchen ticket printing itself, line by
                        line. A spinner tells you nothing; this tells you which
                        stage of the pipeline is running. */}
                    {isBusy && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/72 p-6 backdrop-blur-[3px]">
                        <div className="animate-sheet-up w-full max-w-[340px] bg-card p-6">
                          <div className="flex items-center justify-between">
                            <span className="label label-chilli">
                              {status === "compressing"
                                ? "Optimising"
                                : "Analysing"}
                            </span>
                            <span className="mono text-[10px] text-ink-3">
                              {status === "compressing"
                                ? "00 / 04"
                                : `${String(loadingStep + 1).padStart(2, "0")} / 04`}
                            </span>
                          </div>

                          <div className="perf my-4" />

                          <ol className="space-y-3">
                            {LOADING_STEPS.map((step, idx) => {
                              const done =
                                status !== "compressing" && loadingStep > idx;
                              const active =
                                status !== "compressing" && loadingStep === idx;
                              return (
                                <li
                                  key={step}
                                  className="flex items-center gap-3"
                                >
                                  <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                                      done
                                        ? "border-cardamom bg-cardamom text-card"
                                        : active
                                        ? "border-chilli bg-chilli/10"
                                        : "border-rule"
                                    }`}
                                  >
                                    {done ? (
                                      <Check size={9} strokeWidth={3.5} />
                                    ) : active ? (
                                      <span className="h-1.5 w-1.5 rounded-full bg-chilli animate-blink" />
                                    ) : null}
                                  </span>
                                  <span
                                    className={`mono text-[11px] transition-colors duration-300 ${
                                      done
                                        ? "text-ink-3 line-through"
                                        : active
                                        ? "text-ink"
                                        : "text-ink-3/60"
                                    }`}
                                  >
                                    {step}
                                  </span>
                                </li>
                              );
                            })}
                          </ol>

                          <div className="mt-5 h-[3px] w-full bg-paper-2">
                            <div
                              className="h-full bg-chilli transition-[width] duration-700 ease-out"
                              style={{
                                width:
                                  status === "compressing"
                                    ? "12%"
                                    : `${Math.max(
                                        12,
                                        ((loadingStep + 1) / LOADING_STEPS.length) * 100
                                      )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status footers */}
                    {status === "success" && (
                      <StatusBar
                        tone="good"
                        title="Match found"
                        detail="Taking you to the results…"
                      />
                    )}
                    {status === "error" && (
                      <StatusBar
                        tone="bad"
                        title="Analysis failed"
                        detail={error ?? "Something went wrong"}
                      />
                    )}
                    {status === "previewing" && (
                      <StatusBar
                        tone="neutral"
                        title="Photo ready"
                        detail="Find the matches, or drop another photo"
                      />
                    )}

                    {!isBusy && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAll();
                        }}
                        id="upload-clear"
                        className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-card text-ink shadow-md transition-colors hover:bg-chilli hover:text-card"
                        aria-label="Remove photo"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ) : isMobile ? (
                  /* ── Mobile Action State ── */
                  <div className="flex w-full flex-col gap-3 p-6">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={handleCameraCapture}
                      className="hidden"
                      id="camera-input"
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCameraCapture}
                      className="hidden"
                      id="gallery-input"
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="btn-press flex w-full items-center justify-center gap-3 rounded-full bg-chilli px-8 py-5 text-base font-semibold text-card"
                    >
                      <Camera size={20} strokeWidth={1.9} />
                      Take a photo
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        galleryInputRef.current?.click();
                      }}
                      className="btn-press flex w-full items-center justify-center gap-3 rounded-full border border-ink bg-card px-8 py-5 text-base font-semibold text-ink"
                    >
                      <ImageIcon size={20} strokeWidth={1.9} />
                      Choose from gallery
                    </button>
                  </div>
                ) : (
                  /* ── Desktop Drag Drop State ── */
                  <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
                    <PlateGlyph active={isDragActive} />
                    <p className="serif mt-7 text-[28px] leading-tight text-ink">
                      {isDragActive
                        ? "Drop it right here"
                        : "Drop your food photo here"}
                    </p>
                    <p className="mt-3 text-[14px] text-ink-2">
                      or{" "}
                      <span className="font-semibold text-chilli underline underline-offset-4">
                        browse your files
                      </span>
                    </p>
                    <p className="label mt-8">
                      JPG · PNG · WEBP · up to 10 MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Error banner ── */}
            {error && status !== "error" && (
              <div className="animate-rise mt-4 flex items-center gap-3 border-l-2 border-danger bg-chilli-tint px-5 py-3.5">
                <AlertCircle size={15} className="shrink-0 text-danger" />
                <p className="text-[13px] text-danger">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-danger/70 transition-colors hover:text-danger"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ── Action ── */}
            {(status === "previewing" || status === "error") && (
              <button
                id="upload-find-matches"
                onClick={(e) => {
                  e.preventDefault();
                  analyzeImage();
                }}
                className="btn-press animate-rise group mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-chilli px-8 py-4.5 text-[15px] font-semibold text-card hover:bg-chilli-2 sm:w-auto"
              >
                {status === "error" ? "Try that again" : "Find matching dishes"}
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            )}

            {status === "success" && (
              <button
                id="upload-new"
                onClick={(e) => {
                  e.preventDefault();
                  clearAll();
                }}
                className="btn-press animate-rise mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-card px-8 py-4 text-[15px] font-semibold text-ink sm:w-auto"
              >
                Upload another photo
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Footer strip over the preview image. */
function StatusBar({
  tone,
  title,
  detail,
}: {
  tone: "good" | "bad" | "neutral";
  title: string;
  detail: string;
}) {
  const accent =
    tone === "good"
      ? "bg-cardamom"
      : tone === "bad"
      ? "bg-danger"
      : "bg-turmeric";

  return (
    <div className="animate-rise absolute inset-x-0 bottom-0 z-20 flex items-stretch">
      <span className={`w-1.5 shrink-0 ${accent}`} />
      <div className="flex-1 bg-card/95 px-5 py-3.5 backdrop-blur-sm">
        <p className="label label-ink">{title}</p>
        <p className="mt-1 text-[13px] text-ink-2">{detail}</p>
      </div>
    </div>
  );
}

/** An empty plate with a dashed shutter ring · the drop target, drawn. */
function PlateGlyph({ active }: { active: boolean }) {
  return (
    <svg
      width="76"
      height="76"
      viewBox="0 0 76 76"
      fill="none"
      aria-hidden
      className={`transition-transform duration-500 ${
        active ? "scale-110 rotate-12" : ""
      }`}
    >
      <circle
        cx="38"
        cy="38"
        r="35"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="5 6"
        className={active ? "text-chilli" : "text-ink/30"}
      />
      <circle
        cx="38"
        cy="38"
        r="23"
        stroke="currentColor"
        strokeWidth="1.25"
        className={active ? "text-chilli" : "text-ink/25"}
      />
      <path
        d="M38 27v22M27 38h22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className={active ? "text-chilli" : "text-ink/45"}
      />
    </svg>
  );
}


