// ===== Analysis Types =====

export interface UploadedFile {
  name: string;
  text: string;
  charCount: number;
  rawCharCount: number;
  totalPages: number;
  selectedPageRange?: string;
}

export interface KeyPoint {
  point: string;
  importance: "critical" | "important" | "good-to-know";
  category?: string;
}

export interface TermDefinition {
  term: string;
  definition: string;
  category?: string;
}

export interface SectionBreakdown {
  title: string;
  summary: string;
  keyDetails: string[];
}

export interface AnalysisResult {
  documentTitle: string;
  documentType: string;
  executiveSummary: string;
  keyPoints: KeyPoint[];
  sectionBreakdowns: SectionBreakdown[];
  termsAndDefinitions: TermDefinition[];
  actionableTakeaways: string[];
  studyTips?: string[];
  tldr: string;
}

export type AnalysisMode = "comprehensive" | "summary" | "keypoints" | "study-guide";

export interface SavedAnalysis {
  id: string;
  title: string;
  createdAt: string;
  fileNames: string[];
  mode: AnalysisMode;
  result: AnalysisResult;
  pageCount: number;
  tokenEstimate: number;
}

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  costTier: "cheapest" | "balanced" | "flagship";
  inputPricePerM: number;
  outputPricePerM: number;
  outputTokensPerAnalysis: number;
  speedRating: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    badge: "⚡ Flagship Flash (Recommended)",
    description: "Google's newest Flash model. High intelligence, excellent structured output, and fast.",
    costTier: "cheapest",
    inputPricePerM: 0.10,
    outputPricePerM: 0.40,
    outputTokensPerAnalysis: 2000,
    speedRating: "⚡⚡⚡ Ultra Fast (< 10s)",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    badge: "🚀 Highest Quota & Speed",
    description: "Ultra-fast response time, lowest latency, and most generous request rate limit.",
    costTier: "cheapest",
    inputPricePerM: 0.05,
    outputPricePerM: 0.20,
    outputTokensPerAnalysis: 1800,
    speedRating: "⚡⚡⚡ Blazing Fast (< 8s)",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    badge: "🧠 Deep Knowledge",
    description: "High-capacity multimodal preview model for complex multi-page documents.",
    costTier: "balanced",
    inputPricePerM: 0.10,
    outputPricePerM: 0.40,
    outputTokensPerAnalysis: 2200,
    speedRating: "⚡ Fast (~12s)",
  },
  {
    id: "gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash-Lite",
    badge: "⚖️ Balanced Lite",
    description: "Lightweight, reliable alternative for standard summaries and key points.",
    costTier: "cheapest",
    inputPricePerM: 0.05,
    outputPricePerM: 0.20,
    outputTokensPerAnalysis: 1800,
    speedRating: "⚡⚡ Very Fast (~10s)",
  },
];

export interface ImageInlinePart {
  mimeType: string;
  data: string;
}

export interface AnalyzeRequest {
  texts: string[];
  model?: string;
  apiKey?: string;
  mode: AnalysisMode;
  images?: ImageInlinePart[];
}

export interface ExtractResponse {
  files: UploadedFile[];
}

export interface AnalyzeResponse {
  analysis: AnalysisResult;
}

export interface UploadedPhoto {
  id: string;
  name: string;
  mimeType: string;
  base64Data: string;
  previewUrl: string;
}
