import { SavedAnalysis, AnalysisResult, AnalysisMode } from "./types";

const STORAGE_KEY = "pdf_analyzer_saved_v1";

export function getSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAnalysisToHistory(
  title: string,
  fileNames: string[],
  result: AnalysisResult,
  mode: AnalysisMode,
  pageCount: number,
  tokenEstimate: number
): SavedAnalysis {
  const analyses = getSavedAnalyses();
  const newAnalysis: SavedAnalysis = {
    id: "analysis_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    title: title || result.documentTitle || "Document Analysis",
    createdAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    fileNames,
    mode,
    result,
    pageCount,
    tokenEstimate,
  };

  const updated = [newAnalysis, ...analyses];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save analysis to localStorage", err);
  }

  return newAnalysis;
}

export function deleteSavedAnalysis(id: string): SavedAnalysis[] {
  const analyses = getSavedAnalyses().filter((a) => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch (err) {
    console.error("Failed to delete analysis from localStorage", err);
  }
  return analyses;
}

export function exportAnalysisAsJson(analysis: SavedAnalysis): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  const filename = (analysis.title || "analysis").replace(/[^a-z0-9_-]/gi, "_") + ".json";
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportAnalysisAsMarkdown(analysis: SavedAnalysis): void {
  const r = analysis.result;
  let md = `# ${r.documentTitle}\n\n`;
  md += `**Type:** ${r.documentType}\n\n`;
  md += `---\n\n`;

  md += `## TL;DR\n\n${r.tldr}\n\n`;

  md += `## Executive Summary\n\n${r.executiveSummary}\n\n`;

  md += `## Key Points\n\n`;
  const criticalPoints = r.keyPoints.filter((k) => k.importance === "critical");
  const importantPoints = r.keyPoints.filter((k) => k.importance === "important");
  const goodToKnow = r.keyPoints.filter((k) => k.importance === "good-to-know");

  if (criticalPoints.length > 0) {
    md += `### 🔴 Critical (Must Know)\n\n`;
    criticalPoints.forEach((k) => {
      md += `- ${k.point}${k.category ? ` *(${k.category})*` : ""}\n`;
    });
    md += `\n`;
  }
  if (importantPoints.length > 0) {
    md += `### 🟡 Important\n\n`;
    importantPoints.forEach((k) => {
      md += `- ${k.point}${k.category ? ` *(${k.category})*` : ""}\n`;
    });
    md += `\n`;
  }
  if (goodToKnow.length > 0) {
    md += `### 🟢 Good to Know\n\n`;
    goodToKnow.forEach((k) => {
      md += `- ${k.point}${k.category ? ` *(${k.category})*` : ""}\n`;
    });
    md += `\n`;
  }

  if (r.sectionBreakdowns.length > 0) {
    md += `## Section Breakdowns\n\n`;
    r.sectionBreakdowns.forEach((s) => {
      md += `### ${s.title}\n\n${s.summary}\n\n`;
      s.keyDetails.forEach((d) => {
        md += `- ${d}\n`;
      });
      md += `\n`;
    });
  }

  if (r.termsAndDefinitions.length > 0) {
    md += `## Key Terms & Definitions (${r.termsAndDefinitions.length})\n\n`;
    r.termsAndDefinitions.forEach((t) => {
      md += `- **${t.term}**${t.category ? ` *[${t.category}]*` : ""}: ${t.definition}\n`;
    });
    md += `\n`;
  }

  if (r.actionableTakeaways.length > 0) {
    md += `## Actionable Takeaways\n\n`;
    r.actionableTakeaways.forEach((a) => {
      md += `- ${a}\n`;
    });
    md += `\n`;
  }

  if (r.studyTips && r.studyTips.length > 0) {
    md += `## Study Tips\n\n`;
    r.studyTips.forEach((t) => {
      md += `- ${t}\n`;
    });
    md += `\n`;
  }

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = url;
  const filename = (analysis.title || "analysis").replace(/[^a-z0-9_-]/gi, "_") + ".md";
  downloadAnchor.download = filename;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

// Daily usage tracking
const DAILY_LIMIT = 1_000_000;

export interface DailyUsage {
  date: string;
  tokensUsed: number;
  analysesGenerated: number;
  limit: number;
  remainingTokens: number;
  percentRemaining: number;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getTodayUsage(): DailyUsage {
  if (typeof window === "undefined") {
    return {
      date: "",
      tokensUsed: 0,
      analysesGenerated: 0,
      limit: DAILY_LIMIT,
      remainingTokens: DAILY_LIMIT,
      percentRemaining: 100,
    };
  }

  const today = getTodayDateString();
  const storageKey = `pdf_analyzer_usage_${today}`;
  try {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : { tokensUsed: 0, analysesGenerated: 0 };
    const tokensUsed = data.tokensUsed || 0;
    const analysesGenerated = data.analysesGenerated || 0;
    const remainingTokens = Math.max(0, DAILY_LIMIT - tokensUsed);
    const percentRemaining = Math.max(0, Math.round((remainingTokens / DAILY_LIMIT) * 100));

    return {
      date: today,
      tokensUsed,
      analysesGenerated,
      limit: DAILY_LIMIT,
      remainingTokens,
      percentRemaining,
    };
  } catch {
    return {
      date: today,
      tokensUsed: 0,
      analysesGenerated: 0,
      limit: DAILY_LIMIT,
      remainingTokens: DAILY_LIMIT,
      percentRemaining: 100,
    };
  }
}

export function recordTokenUsage(tokens: number): DailyUsage {
  if (typeof window === "undefined") return getTodayUsage();

  const today = getTodayDateString();
  const storageKey = `pdf_analyzer_usage_${today}`;
  const current = getTodayUsage();

  const updatedData = {
    tokensUsed: current.tokensUsed + tokens,
    analysesGenerated: current.analysesGenerated + 1,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  } catch (err) {
    console.error("Failed to record daily usage", err);
  }

  return getTodayUsage();
}
