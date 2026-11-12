"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SavedAnalysis } from "@/lib/types";
import { getSavedAnalyses, deleteSavedAnalysis, exportAnalysisAsMarkdown } from "@/lib/storage";

export default function AnalysisHistory() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setAnalyses(getSavedAnalyses());
  }, []);

  if (analyses.length === 0) return null;

  const displayList = expanded ? analyses : analyses.slice(0, 3);

  const modeLabels: Record<string, string> = {
    comprehensive: "📊 Comprehensive",
    summary: "📝 Summary",
    keypoints: "🎯 Key Points",
    "study-guide": "📚 Study Guide",
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          📂 Previous Analyses ({analyses.length})
        </h2>
        {analyses.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-teal-600 hover:text-teal-800"
          >
            {expanded ? "Show Less" : `Show All (${analyses.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayList.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-all hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-bold text-gray-800">{a.title}</p>
                <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">
                  {modeLabels[a.mode] || a.mode}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                <span>{a.createdAt}</span>
                <span>•</span>
                <span>{a.result.keyPoints?.length || 0} key points</span>
                <span>•</span>
                <span>{a.pageCount} pages</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("current_analysis", JSON.stringify(a));
                  router.push(`/analysis?id=${encodeURIComponent(a.id)}`);
                }}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => exportAnalysisAsMarkdown(a)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                title="Export as Markdown"
              >
                📥 MD
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this analysis?")) {
                    const updated = deleteSavedAnalysis(a.id);
                    setAnalyses(updated);
                  }
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
