"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/types";

interface AnalysisViewProps {
  result: AnalysisResult;
  title: string;
  fileNames?: string[];
  createdAt?: string;
}

type TabId = "summary" | "keypoints" | "sections" | "terms" | "takeaways";

export default function AnalysisView({
  result,
  title,
  fileNames,
  createdAt,
}: AnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [termsViewMode, setTermsViewMode] = useState<"cards" | "table">("cards");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tabs: { id: TabId; label: string; icon: string; count?: number }[] = [
    { id: "summary", label: "Summary", icon: "📝" },
    { id: "keypoints", label: "Key Points", icon: "🎯", count: result.keyPoints?.length },
    { id: "sections", label: "Sections", icon: "📑", count: result.sectionBreakdowns?.length },
    { id: "terms", label: "Terms & Definitions", icon: "📖", count: result.termsAndDefinitions?.length },
    { id: "takeaways", label: "Takeaways", icon: "✅", count: (result.actionableTakeaways?.length || 0) + (result.studyTips?.length || 0) },
  ];

  const q = searchQuery.toLowerCase().trim();

  // Key Points filtering
  const filteredKeyPoints = (result.keyPoints || []).filter((k) =>
    !q || k.point.toLowerCase().includes(q) || (k.category && k.category.toLowerCase().includes(q))
  );
  const criticalPoints = filteredKeyPoints.filter((k) => k.importance === "critical");
  const importantPoints = filteredKeyPoints.filter((k) => k.importance === "important");
  const goodToKnowPoints = filteredKeyPoints.filter((k) => k.importance === "good-to-know");

  // Terms & Definitions sorting & filtering
  const allTerms = (result.termsAndDefinitions || []).slice().sort((a, b) =>
    a.term.localeCompare(b.term, undefined, { sensitivity: "base" })
  );

  // Available unique letters for terms
  const availableLetters = Array.from(
    new Set(allTerms.map((t) => (t.term[0] || "").toUpperCase()).filter((c) => /^[A-Z]$/.test(c)))
  ).sort();

  // Available categories for terms
  const availableCategories = Array.from(
    new Set(allTerms.map((t) => t.category).filter(Boolean) as string[])
  ).sort();

  const filteredTerms = allTerms.filter((t) => {
    const matchesQuery = !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
    const matchesLetter = selectedLetter === "ALL" || t.term.toUpperCase().startsWith(selectedLetter);
    const matchesCat = selectedCategory === "ALL" || t.category === selectedCategory;
    return matchesQuery && matchesLetter && matchesCat;
  });

  function toggleSection(index: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div>
      {/* =========================================================================
          SCREEN-ONLY VIEW (Interactive Tabs, Live Search, Copy Buttons)
         ========================================================================= */}
      <div className="screen-only space-y-4">
        {/* Document Header */}
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-cyan-50/60 to-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-xl shadow">
                🔍
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
                  {result.documentTitle || title}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                    {result.documentType || "Document"}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {result.keyPoints?.length || 0} key points • {result.sectionBreakdowns?.length || 0} sections • {result.termsAndDefinitions?.length || 0} terms
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="shrink-0 flex items-center gap-1 rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-xs hover:bg-teal-50 transition-colors"
                title="Print or Save as PDF"
              >
                <span>🖨️ Print</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const fullText = `# ${result.documentTitle}\n\nTL;DR: ${result.tldr}\n\nSummary:\n${result.executiveSummary}\n\nKey Points:\n${(result.keyPoints || []).map((k) => `- [${k.importance.toUpperCase()}] ${k.point}`).join("\n")}\n\nTerms & Definitions:\n${allTerms.map((t) => `- **${t.term}**${t.category ? ` (${t.category})` : ""}: ${t.definition}`).join("\n")}`;
                  handleCopy(fullText, "all");
                }}
                className="shrink-0 flex items-center gap-1 rounded-xl border border-teal-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-xs hover:bg-teal-50 transition-colors"
              >
                {copiedKey === "all" ? "✓ Copied All" : "📋 Copy All"}
              </button>
            </div>
          </div>

          {/* TL;DR */}
          {result.tldr && (
            <div className="mt-4 rounded-xl bg-white/85 border border-teal-100 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">⚡ TL;DR</p>
                <button
                  type="button"
                  onClick={() => handleCopy(result.tldr, "tldr")}
                  className="text-[11px] font-medium text-teal-600 hover:text-teal-800"
                >
                  {copiedKey === "tldr" ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{result.tldr}</p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all
                  ${
                    activeTab === tab.id
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id ? "bg-teal-800/50 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search within points & terms */}
          {(activeTab === "keypoints" || activeTab === "terms") && (
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${activeTab === "keypoints" ? "points" : "terms"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 rounded-xl border border-gray-200 bg-white px-3 py-1.5 pl-7 text-xs text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
              />
              <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* SUMMARY TAB */}
          {activeTab === "summary" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-sm">📝</span>
                  Executive Summary
                </h2>
                <button
                  type="button"
                  onClick={() => handleCopy(result.executiveSummary, "summary")}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  {copiedKey === "summary" ? "✓ Copied" : "📋 Copy Summary"}
                </button>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-3">
                {result.executiveSummary}
              </div>
            </div>
          )}

          {/* KEY POINTS TAB */}
          {activeTab === "keypoints" && (
            <div className="space-y-4">
              {searchQuery && (
                <p className="text-xs text-gray-500">
                  Found {filteredKeyPoints.length} matching points for &ldquo;{searchQuery}&rdquo;
                </p>
              )}

              {criticalPoints.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-200 text-red-800 text-xs">🔴</span>
                      Critical — Must Know ({criticalPoints.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(criticalPoints.map((p, i) => `${i + 1}. ${p.point}`).join("\n"), "critical")}
                      className="text-[11px] font-semibold text-red-700 hover:text-red-900"
                    >
                      {copiedKey === "critical" ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {criticalPoints.map((kp, i) => (
                      <div key={i} className="flex gap-2.5 rounded-xl bg-white border border-red-100 p-3 shadow-2xs">
                        <span className="shrink-0 text-red-500 text-xs font-bold mt-0.5">{i + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 leading-relaxed">{kp.point}</p>
                          {kp.category && (
                            <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                              {kp.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importantPoints.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-200 text-amber-800 text-xs">🟡</span>
                      Important ({importantPoints.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(importantPoints.map((p, i) => `${i + 1}. ${p.point}`).join("\n"), "important")}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-900"
                    >
                      {copiedKey === "important" ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {importantPoints.map((kp, i) => (
                      <div key={i} className="flex gap-2.5 rounded-xl bg-white border border-amber-100 p-3 shadow-2xs">
                        <span className="shrink-0 text-amber-600 text-xs font-bold mt-0.5">{i + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 leading-relaxed">{kp.point}</p>
                          {kp.category && (
                            <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              {kp.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {goodToKnowPoints.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-200 text-emerald-800 text-xs">🟢</span>
                      Good to Know ({goodToKnowPoints.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(goodToKnowPoints.map((p, i) => `${i + 1}. ${p.point}`).join("\n"), "goodtoknow")}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      {copiedKey === "goodtoknow" ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {goodToKnowPoints.map((kp, i) => (
                      <div key={i} className="flex gap-2.5 rounded-xl bg-white border border-emerald-100 p-3 shadow-2xs">
                        <span className="shrink-0 text-emerald-600 text-xs font-bold mt-0.5">{i + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 leading-relaxed">{kp.point}</p>
                          {kp.category && (
                            <span className="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {kp.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredKeyPoints.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
                  No key points matched your search.
                </div>
              )}
            </div>
          )}

          {/* SECTIONS TAB */}
          {activeTab === "sections" && (
            <div className="space-y-3">
              <div className="flex justify-end gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setExpandedSections(new Set((result.sectionBreakdowns || []).map((_, i) => i)))}
                  className="text-xs text-teal-600 hover:text-teal-800 font-semibold"
                >
                  Expand All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setExpandedSections(new Set())}
                  className="text-xs text-teal-600 hover:text-teal-800 font-semibold"
                >
                  Collapse All
                </button>
              </div>

              {(result.sectionBreakdowns || []).map((section, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{section.title}</span>
                    </div>
                    <span className={`text-gray-400 transition-transform ${expandedSections.has(i) ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {expandedSections.has(i) && (
                    <div className="border-t border-gray-100 p-4 pt-3">
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{section.summary}</p>
                      {section.keyDetails && section.keyDetails.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Key Details:</p>
                          {section.keyDetails.map((detail, j) => (
                            <div key={j} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-teal-500 mt-1 shrink-0">•</span>
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TERMS & DEFINITIONS TAB (ENHANCED) */}
          {activeTab === "terms" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              {/* Header and Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-base">📖</span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">
                      Terms & Definitions Glossary
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      {filteredTerms.length} of {allTerms.length} terms captured • Alphabetical order
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setTermsViewMode("cards")}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                        termsViewMode === "cards"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Card view"
                    >
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setTermsViewMode("table")}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                        termsViewMode === "table"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      title="Compact table view"
                    >
                      Table
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(filteredTerms.map((t) => `${t.term}${t.category ? ` [${t.category}]` : ""}: ${t.definition}`).join("\n\n"), "terms")}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    {copiedKey === "terms" ? "✓ Copied" : "📋 Copy Terms"}
                  </button>
                </div>
              </div>

              {/* Alphabet Filter Bar */}
              {availableLetters.length > 1 && (
                <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 pb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-1">Jump to:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLetter("ALL")}
                    className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-colors ${
                      selectedLetter === "ALL"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    ALL
                  </button>
                  {availableLetters.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedLetter(letter)}
                      className={`h-6 w-6 rounded-lg text-xs font-bold transition-colors ${
                        selectedLetter === letter
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}

              {/* Category Filter Pills (if any exist) */}
              {availableCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-1">Category:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                      selectedCategory === "ALL"
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All Types
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                        selectedCategory === cat
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Terms Content: Cards View */}
              {termsViewMode === "cards" && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {filteredTerms.map((item, i) => (
                    <div
                      key={i}
                      className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-teal-900 group-hover:text-purple-900 transition-colors">
                            {item.term}
                          </h4>
                          {item.category && (
                            <span className="shrink-0 rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-100">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-gray-700 leading-relaxed">
                          {item.definition}
                        </p>
                      </div>

                      <div className="mt-2.5 flex justify-end border-t border-gray-50 pt-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(`${item.term}: ${item.definition}`, `term_${i}`)}
                          className="text-[10px] font-semibold text-gray-400 hover:text-teal-700"
                        >
                          {copiedKey === `term_${i}` ? "✓ Copied" : "📋 Copy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Terms Content: Compact Table View */}
              {termsViewMode === "table" && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="py-2.5 px-3 w-1/4">Term</th>
                        <th className="py-2.5 px-3 w-1/6">Category</th>
                        <th className="py-2.5 px-3">Definition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredTerms.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2 px-3 font-bold text-teal-950 align-top">
                            {item.term}
                          </td>
                          <td className="py-2 px-3 align-top">
                            {item.category ? (
                              <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                                {item.category}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-700 leading-relaxed align-top">
                            {item.definition}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredTerms.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">
                  No terms matched your filter.
                </p>
              )}
            </div>
          )}

          {/* TAKEAWAYS TAB */}
          {activeTab === "takeaways" && (
            <div className="space-y-4">
              {result.actionableTakeaways && result.actionableTakeaways.length > 0 && (
                <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-200 text-teal-800 text-xs">✅</span>
                      Actionable Takeaways ({result.actionableTakeaways.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.actionableTakeaways.map((a, i) => `${i + 1}. ${a}`).join("\n"), "takeaways")}
                      className="text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                    >
                      {copiedKey === "takeaways" ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {result.actionableTakeaways.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white border border-teal-100 p-3 shadow-2xs">
                        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-800 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.studyTips && result.studyTips.length > 0 && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-200 text-indigo-800 text-xs">💡</span>
                      Study Tips ({result.studyTips.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy((result.studyTips || []).map((t, i) => `${i + 1}. ${t}`).join("\n"), "tips")}
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      {copiedKey === "tips" ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {result.studyTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white border border-indigo-100 p-3 shadow-2xs">
                        <span className="text-indigo-500 text-sm shrink-0">💡</span>
                        <p className="text-sm text-gray-800 leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          PRINT-ONLY PUBLICATION VIEW
          Renders seamlessly when window.print() or Ctrl+P is triggered.
          Includes EVERY section continuously with clean page-break formatting!
         ========================================================================= */}
      <div className="print-only text-gray-900 space-y-6">
        {/* Document Print Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-black">
                {result.documentTitle || title}
              </h1>
              <p className="text-xs font-semibold text-gray-600 mt-1">
                Type: {result.documentType || "Comprehensive Analysis"} • Analysis Generated by PDFAnalyzer
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{createdAt || new Date().toLocaleDateString()}</p>
              {fileNames && fileNames.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Source: {fileNames.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TL;DR */}
        {result.tldr && (
          <div className="avoid-break rounded-lg border-2 border-teal-800 bg-teal-50/40 p-3.5">
            <h2 className="text-xs font-black text-teal-900 uppercase tracking-wider mb-1">
              ⚡ Executive TL;DR
            </h2>
            <p className="text-xs text-gray-900 leading-relaxed">
              {result.tldr}
            </p>
          </div>
        )}

        {/* Executive Summary */}
        <div className="avoid-break">
          <h2 className="text-sm font-black uppercase tracking-wider border-b border-gray-300 pb-1 mb-2 text-black">
            📝 Executive Summary
          </h2>
          <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line space-y-2">
            {result.executiveSummary}
          </div>
        </div>

        {/* Key Points */}
        {result.keyPoints && result.keyPoints.length > 0 && (
          <div className="avoid-break space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider border-b border-gray-300 pb-1 text-black">
              🎯 Key Points & Must-Know Facts ({result.keyPoints.length})
            </h2>

            {/* Critical */}
            {criticalPoints.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-red-900 uppercase">
                  🔴 Critical (Must Know):
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-800">
                  {criticalPoints.map((kp, i) => (
                    <li key={i} className="leading-snug">
                      <strong>{kp.point}</strong>
                      {kp.category && <span className="text-gray-500 text-[10px]"> — [{kp.category}]</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important */}
            {importantPoints.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <h3 className="text-xs font-bold text-amber-900 uppercase">
                  🟡 Important:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-800">
                  {importantPoints.map((kp, i) => (
                    <li key={i} className="leading-snug">
                      <span>{kp.point}</span>
                      {kp.category && <span className="text-gray-500 text-[10px]"> — [{kp.category}]</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Good to Know */}
            {goodToKnowPoints.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <h3 className="text-xs font-bold text-emerald-900 uppercase">
                  🟢 Good to Know:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-800">
                  {goodToKnowPoints.map((kp, i) => (
                    <li key={i} className="leading-snug">
                      <span>{kp.point}</span>
                      {kp.category && <span className="text-gray-500 text-[10px]"> — [{kp.category}]</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Section Breakdowns */}
        {result.sectionBreakdowns && result.sectionBreakdowns.length > 0 && (
          <div className="avoid-break space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider border-b border-gray-300 pb-1 text-black">
              📑 Section-by-Section Breakdowns
            </h2>
            <div className="space-y-3">
              {result.sectionBreakdowns.map((section, i) => (
                <div key={i} className="avoid-break rounded border border-gray-200 p-3 bg-gray-50/30">
                  <h3 className="text-xs font-bold text-black mb-1">
                    {i + 1}. {section.title}
                  </h3>
                  <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                    {section.summary}
                  </p>
                  {section.keyDetails && section.keyDetails.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] text-gray-600 space-y-0.5">
                      {section.keyDetails.map((detail, j) => (
                        <li key={j}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms & Definitions Glossary */}
        {allTerms.length > 0 && (
          <div className="avoid-break space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider border-b border-gray-300 pb-1 text-black">
              📖 Terms & Definitions Glossary ({allTerms.length} Terms)
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {allTerms.map((item, i) => (
                <div key={i} className="avoid-break border border-gray-200 rounded p-2 bg-gray-50/20">
                  <p className="font-bold text-black text-[11px]">
                    {item.term}
                    {item.category && (
                      <span className="font-normal text-gray-500 text-[9px] ml-1">
                        [{item.category}]
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-700 leading-snug mt-0.5">
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Takeaways & Study Tips */}
        {((result.actionableTakeaways && result.actionableTakeaways.length > 0) ||
          (result.studyTips && result.studyTips.length > 0)) && (
          <div className="avoid-break space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider border-b border-gray-300 pb-1 text-black">
              ✅ Actionable Takeaways & Study Tips
            </h2>

            {result.actionableTakeaways && result.actionableTakeaways.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-teal-950 uppercase">Key Takeaways:</h3>
                <ol className="list-decimal list-inside text-xs text-gray-800 space-y-1">
                  {result.actionableTakeaways.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            )}

            {result.studyTips && result.studyTips.length > 0 && (
              <div className="space-y-1 pt-2">
                <h3 className="text-xs font-bold text-indigo-950 uppercase">Study & Memorization Tips:</h3>
                <ul className="list-disc list-inside text-xs text-gray-800 space-y-1">
                  {result.studyTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-3 text-center text-[10px] text-gray-400">
          PDF Analyzer & Summarizer — Page 1 of Analysis Report
        </div>
      </div>
    </div>
  );
}
