"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Upload,
  ImagePlus,
  X,
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import type { MatchResult, AnalyzeImageResult, AnalyzeResult } from "@/app/_lib/types";
import { useGeolocation } from "@/app/_hooks/useGeolocation";
import LocationBadge from "./LocationBadge";

// ── Constants ────────────────────────────────────────────
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = { "image/*": [".jpg", ".jpeg", ".png", ".webp"] };

type UploadStatus = "idle" | "previewing" | "analyzing" | "success" | "error" | "compressing";

const LOADING_STEPS = [
  "Scanning your food photo...",
  "Detecting dish and cuisine...",
  "Finding best nearby restaurants...",
  "Optimizing delivery options...",
];

// ── Compression Helper ───────────────────────────────────
async function compressImage(file: File, maxWidth = 1600): Promise<File> {
  return new Promise((resolve, reject) => {
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

  // Detect mobile (touch device with narrow viewport)
  useEffect(() => {
    const check = () => {
      setIsMobile(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
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
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(incoming.type)
      ) {
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
    noClick: status === "analyzing" || status === "compressing" || isMobile, // Disable standard click on mobile
  });

  // ── Camera capture (mobile) ────────────────────────────
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const captured = e.target.files?.[0];
    if (captured) {
      await handleFile(captured);
      // Let the previewing effect settle, but don't auto-analyze here anymore 
      // as it might be confusing if they didn't like the photo.
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
      await new Promise(resolve => setTimeout(resolve, 600));

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

  return (
    <section id="upload" className="relative py-24 sm:py-36">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 lg:px-8">
        {/* Section header */}
        <div className="mb-12 flex max-w-2xl flex-col items-start">
          <LocationBadge
            status={geoStatus}
            city={city}
            onRequestRefresh={() => requestLocation(true)}
          />
          <h2 className="display mt-5 text-4xl sm:text-5xl">
            Upload your <span className="display-em">food photo</span>
          </h2>
          <p className="mt-4 text-base text-muted">
            We identify the dish, then find who makes it closest to you.
          </p>
        </div>

        {/* Upload zone */}
        <div className="glass rounded-3xl p-3 shadow-2xl shadow-accent/20 transition-transform duration-500 hover:scale-[1.015] hover:shadow-accent/30">
          <div
            {...getRootProps()}
            id="upload-dropzone"
            className={`upload-zone relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-2xl transition-all ${
              isDragActive ? "active" : ""
            } ${preview ? "p-0" : "p-12 sm:p-14"}`}
          >
            <input {...getInputProps()} id="upload-input" />

            {preview ? (
              /* ── Preview state ── */
              <div className="relative w-full overflow-hidden rounded-2xl">
                <Image
                  src={preview}
                  alt="Uploaded food"
                  width={800}
                  height={500}
                  className="h-auto w-full object-cover"
                  unoptimized
                />

                {/* Processing overlays */}
                {(status === "analyzing" || status === "compressing") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <div className="glass rounded-3xl p-8 flex flex-col items-center max-w-[280px] w-11/12 animate-fade-up text-center shadow-2xl">
                      <Loader2
                        size={40}
                        className="animate-spin text-accent mb-6"
                      />
                      <div className="relative h-6 w-full overflow-hidden mb-5">
                        {LOADING_STEPS.map((step, idx) => (
                          <p
                            key={step}
                            className={`absolute inset-0 text-sm font-medium text-white transition-all duration-500 ease-in-out ${
                              status === "compressing"
                                ? (idx === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
                                : loadingStep === idx
                                ? "opacity-100 translate-y-0"
                                : loadingStep > idx
                                ? "opacity-0 -translate-y-4"
                                : "opacity-0 translate-y-4"
                            }`}
                          >
                            {status === "compressing" ? "Optimizing image..." : step}
                          </p>
                        ))}
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-accent via-amber-400 to-accent transition-all duration-700 ease-out"
                          style={{
                            width: status === "compressing"
                              ? "15%"
                              : `${Math.max(15, ((loadingStep + 1) / LOADING_STEPS.length) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Success overlay */}
                {status === "success" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 animate-fade-up z-20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white shadow-lg shadow-green-500/20">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          We found your perfect match
                        </p>
                        <p className="text-xs text-white/60">
                          Scrolling to recommendations...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error overlay */}
                {status === "error" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Analysis Failed
                        </p>
                        <p className="text-xs text-white/60">
                          {error ?? "Something went wrong"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Previewing overlay */}
                {status === "previewing" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white">
                        <ImagePlus size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Photo Ready!
                        </p>
                        <p className="text-xs text-white/60">
                          Click &quot;Find Matches&quot; or drop another photo
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clear button (always visible unless processing) */}
                {status !== "analyzing" && status !== "compressing" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAll();
                    }}
                    id="upload-clear"
                    className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-500 active:scale-95"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : isMobile ? (
              /* ── Mobile Action State ── */
              <div className="flex w-full flex-col gap-4 p-5 sm:p-0">
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
                  className="flex w-full items-center justify-center gap-3 rounded-3xl bg-accent px-8 py-6 text-lg font-bold text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
                >
                  <Camera size={24} />
                  Take Photo
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    galleryInputRef.current?.click();
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-border bg-surface px-8 py-6 text-lg font-bold text-foreground transition-all active:scale-[0.98]"
                >
                  <ImageIcon size={24} />
                  Upload from Gallery
                </button>
              </div>
            ) : (
              /* ── Desktop Drag Drop State ── */
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Upload size={28} />
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {isDragActive
                    ? "Drop your food photo here"
                    : "Drag & drop a food photo"}
                </p>
                <p className="mt-2 text-sm text-muted">
                  or{" "}
                  <span className="font-medium text-accent underline underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="mt-4 text-xs text-muted/60">
                  Supports JPG, PNG, WebP • Max 10 MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && status !== "error" && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 animate-fade-up">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {/* Find Matches (visible in previewing or error state) */}
          {(status === "previewing" || status === "error") && (
            <button
              id="upload-find-matches"
              onClick={(e) => {
                e.preventDefault();
                analyzeImage();
              }}
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-accent px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/25 active:scale-[0.97] sm:w-auto animate-fade-up"
            >
              {status === "error" ? "Retry Analysis" : "Find Matching Dishes"}
              <ImagePlus
                size={16}
                className="transition-transform group-hover:scale-110"
              />
            </button>
          )}

          {/* Upload new photo (visible in success state) */}
          {status === "success" && (
            <button
              id="upload-new"
              onClick={(e) => {
                e.preventDefault();
                clearAll();
              }}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border px-8 py-4 text-base font-medium text-muted transition-all duration-300 hover:border-accent/40 hover:text-foreground active:scale-[0.97] sm:w-auto animate-fade-up"
            >
              Upload Another Photo
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
