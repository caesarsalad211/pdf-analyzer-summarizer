"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SavedAnalysis } from "@/lib/types";
import { getSavedAnalyses, exportAnalysisAsMarkdown, exportAnalysisAsJson } from "@/lib/storage";
import AnalysisView from "@/components/AnalysisView";

function AnalysisPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");

    // Try sessionStorage first
    const sessionData = sessionStorage.getItem("current_analysis");
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (!id || parsed.id === id) {
          setAnalysis(parsed);
          return;
        }
      } catch {
        // fall through
      }
    }

    // Try localStorage
    if (id) {
      const saved = getSavedAnalyses();
      const found = saved.find((a) => a.id === id);
      if (found) {
        setAnalysis(found);
        return;
      }
    }
  }, [searchParams]);

  if (!analysis) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-gray-500">Loading analysis...</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
        >
          ← Back to Home
        </button>
      </main>
    );
  }

  const modeLabels: Record<string, string> = {
    comprehensive: "📊 Comprehensive",
    summary: "📝 Summary",
    keypoints: "🎯 Key Points",
    "study-guide": "📚 Study Guide",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
      {/* Top Bar (Hidden during print) */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
        >
          ← New Analysis
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-800">
            {modeLabels[analysis.mode] || analysis.mode}
          </span>
          <span className="text-[11px] text-gray-400">{analysis.createdAt}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-all"
            title="Print entire document or save as PDF"
          >
            <span>🖨️</span>
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={() => exportAnalysisAsMarkdown(analysis)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
            title="Export as Markdown"
          >
            📥 Markdown
          </button>
          <button
            onClick={() => exportAnalysisAsJson(analysis)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
            title="Export as JSON"
          >
            📥 JSON
          </button>
        </div>
      </div>

      {/* Source Files (Hidden during print since header covers it) */}
      {analysis.fileNames && analysis.fileNames.length > 0 && (
        <div className="no-print mb-4 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
          <span className="font-semibold text-gray-500">Sources:</span>
          {analysis.fileNames.map((f, i) => (
            <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Analysis Content */}
      <AnalysisView
        result={analysis.result}
        title={analysis.title}
        fileNames={analysis.fileNames}
        createdAt={analysis.createdAt}
      />
    </main>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-gray-500">Loading analysis...</p>
      </main>
    }>
      <AnalysisPageContent />
    </Suspense>
  );
}
