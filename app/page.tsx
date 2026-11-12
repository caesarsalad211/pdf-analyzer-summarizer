"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Uploader from "@/components/Uploader";
import AnalysisHistory from "@/components/AnalysisHistory";
import ApiKeyModal, { getClientApiKey, openApiKeyModal } from "@/components/ApiKeyModal";
import AboutModal from "@/components/AboutModal";
import {
  UploadedFile,
  UploadedPhoto,
  AVAILABLE_MODELS,
  AnalysisMode,
} from "@/lib/types";
import { estimateTokens } from "@/lib/textCleaner";
import { saveAnalysisToHistory, getTodayUsage, recordTokenUsage, DailyUsage } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-3.8-flash");
  const [mode, setMode] = useState<AnalysisMode>("comprehensive");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);

  useEffect(() => {
    setDailyUsage(getTodayUsage());
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const activeModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const totalChars = files.reduce((acc, f) => acc + (f.charCount || 0), 0);
  const photoTokens = photos.length * 300;
  const estInputTokens = estimateTokens(totalChars) + photoTokens;
  const estOutputTokens = activeModel.outputTokensPerAnalysis;
  const estTotalTokens = estInputTokens + estOutputTokens;
  const estCostUSD =
    (estInputTokens / 1_000_000) * activeModel.inputPricePerM +
    (estOutputTokens / 1_000_000) * activeModel.outputPricePerM;

  const totalPages = files.reduce((acc, f) => acc + (f.totalPages || 0), 0);

  async function handleAnalyze() {
    if (files.length === 0 && photos.length === 0) return;
    setAnalyzing(true);
    setError(null);
    try {
      const clientApiKey = getClientApiKey();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: files.map((f) => f.text),
          model: selectedModel,
          apiKey: clientApiKey || undefined,
          mode,
          images: photos.map((p) => ({ mimeType: p.mimeType, data: p.base64Data })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.isRateLimit && data.retryAfter) {
          setRateLimitSeconds(data.retryAfter);
        }
        if (data.error && data.error.includes("GEMINI_API_KEY")) {
          openApiKeyModal();
        }
        throw new Error(data.error || "Analysis failed");
      }

      // Record usage
      const updatedUsage = recordTokenUsage(estTotalTokens);
      setDailyUsage(updatedUsage);

      const defaultTitle = files[0]
        ? files[0].name.replace(/\.pdf$/i, "")
        : photos[0]
        ? `Photo Analysis`
        : `Document Analysis`;

      const fileNames = [
        ...files.map((f) => f.name),
        ...photos.map((p) => `📸 ${p.name}`),
      ];

      const savedAnalysis = saveAnalysisToHistory(
        defaultTitle,
        fileNames,
        data.analysis,
        mode,
        totalPages,
        estTotalTokens
      );

      // Navigate to analysis view
      sessionStorage.setItem("current_analysis", JSON.stringify(savedAnalysis));
      router.push(`/analysis?id=${encodeURIComponent(savedAnalysis.id)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze =
    (files.length > 0 || photos.length > 0) &&
    !uploading &&
    !analyzing &&
    (rateLimitSeconds === null || rateLimitSeconds <= 0);

  const modeOptions: { id: AnalysisMode; label: string; icon: string; sub: string }[] = [
    { id: "comprehensive", label: "Comprehensive", icon: "📊", sub: "Full deep analysis" },
    { id: "summary", label: "Summary Only", icon: "📝", sub: "Quick overview & TL;DR" },
    { id: "keypoints", label: "Key Points", icon: "🎯", sub: "Exhaustive fact extraction" },
    { id: "study-guide", label: "Study Guide", icon: "📚", sub: "Terms, tips & study-ready" },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Top Navbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-teal-600">🔍 PDFAnalyzer</span>
        </div>
        <div className="flex items-center gap-2">
          <AboutModal />
          <ApiKeyModal />
        </div>
      </div>

      {/* Hero Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-md">
          <span className="text-2xl">📄</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          PDF Analyzer & Summarizer
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Upload any PDF — get instant summaries, key points, section breakdowns, terms & definitions, and everything you need to know.
        </p>
      </div>

      <div className="space-y-6">
        {/* Saved Analyses */}
        <AnalysisHistory />

        {/* Upload Section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            1. Upload Documents
          </h2>
          <Uploader
            files={files}
            onFilesExtracted={setFiles}
            photos={photos}
            onPhotosExtracted={setPhotos}
            loading={uploading}
            setLoading={setUploading}
          />
        </section>

        {/* Settings Section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            2. Choose Analysis Mode & Model
          </h2>
          <div className="space-y-5">
            {/* Analysis Mode */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Analysis Mode:
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {modeOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`rounded-xl border p-2.5 text-center transition-all
                      ${
                        mode === item.id
                          ? "border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 shadow-xs"
                          : "border-gray-200 bg-white hover:border-teal-200 hover:bg-slate-50"
                      }`}
                  >
                    <p className="text-lg">{item.icon}</p>
                    <p className="text-xs font-bold text-gray-900">{item.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model Selector */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Select AI Model:
                </label>
                <span className="text-[11px] font-medium text-emerald-600">
                  💡 Token estimation updates live
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {AVAILABLE_MODELS.slice(0, 3).map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all
                        ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20 shadow-sm"
                            : "border-gray-200 bg-white hover:border-teal-300 hover:bg-slate-50"
                        }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-gray-900">{m.name}</p>
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]
                              ${
                                isSelected
                                  ? "border-teal-600 bg-teal-600 text-white"
                                  : "border-gray-300"
                              }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                        </div>
                        <span
                          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold
                            ${
                              m.costTier === "cheapest"
                                ? "bg-emerald-100 text-emerald-800"
                                : m.costTier === "balanced"
                                ? "bg-teal-100 text-teal-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {m.badge}
                        </span>
                        <p className="mt-2 text-[11px] leading-snug text-gray-500">{m.description}</p>
                      </div>
                      <div className="mt-3 border-t border-gray-100 pt-2 text-[10px] text-gray-400">
                        <div className="flex justify-between text-teal-600 font-medium">
                          <span>Speed:</span>
                          <span>{m.speedRating}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show more models toggle */}
              {AVAILABLE_MODELS.length > 3 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-teal-600 font-medium hover:text-teal-800">
                    Show {AVAILABLE_MODELS.length - 3} more models…
                  </summary>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 mt-2">
                    {AVAILABLE_MODELS.slice(3).map((m) => {
                      const isSelected = selectedModel === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedModel(m.id)}
                          className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all
                            ${
                              isSelected
                                ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20 shadow-sm"
                                : "border-gray-200 bg-white hover:border-teal-300 hover:bg-slate-50"
                            }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-xs font-bold text-gray-900">{m.name}</p>
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]
                                  ${
                                    isSelected
                                      ? "border-teal-600 bg-teal-600 text-white"
                                      : "border-gray-300"
                                  }`}
                              >
                                {isSelected ? "✓" : ""}
                              </span>
                            </div>
                            <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold bg-gray-100 text-gray-700">
                              {m.badge}
                            </span>
                            <p className="mt-2 text-[11px] leading-snug text-gray-500">{m.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>

            {/* Token Estimation */}
            <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-base font-bold">
                    📊
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Estimated Tokens: ~{estTotalTokens.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      In: ~{estInputTokens.toLocaleString()} {photos.length > 0 ? `(${photos.length} photo${photos.length > 1 ? "s" : ""})` : ""} | Out: ~{estOutputTokens.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-xs">
                  {activeModel.name}
                </span>
              </div>

              {/* Daily Quota */}
              {dailyUsage && (
                <div className="rounded-xl border border-emerald-100 bg-white/80 p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-600">⚡</span>
                      <span className="font-bold text-gray-800">Today:</span>
                      <span className="font-bold text-emerald-700">
                        ~{dailyUsage.remainingTokens.toLocaleString()} / 1,000,000
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800">
                      {dailyUsage.percentRemaining}% remaining
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${dailyUsage.percentRemaining}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-sm">💵</span>
                  <span>Cost:</span>
                  <span className="font-bold text-emerald-700">
                    {estCostUSD < 0.001 ? "< $0.001 USD" : `$${estCostUSD.toFixed(4)} USD`}
                  </span>
                  <span className="text-[10px] text-gray-400">(Free on AI Studio)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rate Limit / Error */}
        {rateLimitSeconds !== null && rateLimitSeconds > 0 ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⏳</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-amber-950">Rate Limit Active</h4>
                  <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-900 border border-amber-300">
                    ⏱️ {rateLimitSeconds}s
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-800">
                  Please wait for the cooldown, or switch to a higher-quota model.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel("gemini-3.8-flash");
                    setRateLimitSeconds(null);
                    setError(null);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
                >
                  ⚡ Switch to Gemini 3.8 Flash
                </button>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        ) : null}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className={`w-full rounded-2xl py-4 text-base font-bold tracking-wide shadow-lg transition-all
            ${canAnalyze
              ? "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-200 active:scale-[0.99]"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing with {activeModel.name}…
            </span>
          ) : rateLimitSeconds !== null && rateLimitSeconds > 0 ? (
            `⏳ Cooldown Active (${rateLimitSeconds}s)`
          ) : (
            `🔍 Analyze Document`
          )}
        </button>

        {files.length === 0 && photos.length === 0 && (
          <p className="text-center text-xs text-gray-400">
            Upload at least one PDF or photo above to start analysis.
          </p>
        )}
      </div>
    </main>
  );
}
