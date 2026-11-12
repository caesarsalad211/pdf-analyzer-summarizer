import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult, AnalysisMode, ImageInlinePart } from "./types";

export function parseGeminiError(err: unknown): {
  message: string;
  isRateLimit: boolean;
  retryAfter?: number;
} {
  const errMsg = err instanceof Error ? err.message : String(err);

  if (
    errMsg.includes("429") ||
    errMsg.includes("Too Many Requests") ||
    errMsg.includes("Quota exceeded") ||
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("ResourceExhausted")
  ) {
    const delayMatch =
      errMsg.match(/retryDelay["']?:\s*["']?(\d+)s/i) ||
      errMsg.match(/Please retry in\s+([\d.]+)s/i);
    const retrySeconds = delayMatch ? Math.ceil(parseFloat(delayMatch[1])) : 60;

    return {
      message: `Gemini Free Tier rate limit reached. Please wait ${retrySeconds}s before retrying.`,
      isRateLimit: true,
      retryAfter: retrySeconds,
    };
  }

  if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("overloaded")) {
    return {
      message: "The AI model is experiencing temporary high demand on Google servers. Please wait a few seconds and try again, or switch models.",
      isRateLimit: false,
    };
  }

  if (
    errMsg.includes("API_KEY_INVALID") ||
    errMsg.includes("API key not valid") ||
    errMsg.includes("PERMISSION_DENIED")
  ) {
    return {
      message: "Your Gemini API key is invalid or unauthorized. Please verify your key in the 🔑 menu.",
      isRateLimit: false,
    };
  }

  const clean = errMsg
    .replace(/^\[GoogleGenerativeAI Error\]:\s*/i, "")
    .replace(/\[\{[\s\S]*?\}\]/g, "")
    .replace(/\[\d+\s+[\s\S]*?\]\s*/g, "")
    .trim();

  return {
    message: clean.slice(0, 250) || "An unexpected error occurred while communicating with Gemini.",
    isRateLimit: false,
  };
}

function getModel(modelId?: string, clientApiKey?: string) {
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please paste your API key using the 🔑 icon at the top or set it in .env.local"
    );
  }
  const modelName = modelId || process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });
}

function getModeInstructions(mode: AnalysisMode): string {
  switch (mode) {
    case "summary":
      return `ANALYSIS MODE: SUMMARY FOCUS
Focus on creating an excellent executive summary and TLDR. Provide a shorter list of only the most critical key points (top 5-8). 
Keep section breakdowns brief (just titles and 1-2 sentence summaries). Skip study tips.`;

    case "keypoints":
      return `ANALYSIS MODE: KEY POINTS FOCUS
Focus on extracting the maximum number of key points and must-know facts. Be exhaustive — capture every important concept, fact, formula, date, name, and principle.
Group them by importance (critical, important, good-to-know). Include relevant terms/definitions. Keep the executive summary brief.`;

    case "study-guide":
      return `ANALYSIS MODE: STUDY GUIDE
Create a comprehensive study guide. Emphasize terms & definitions, provide detailed section breakdowns with study-ready bullet points, and include study tips.
Key points should be formatted as things a student must memorize or understand. Include actionable takeaways as study strategies.`;

    case "comprehensive":
    default:
      return `ANALYSIS MODE: COMPREHENSIVE
Provide a thorough, balanced analysis covering all sections equally. Include a strong executive summary, detailed key points sorted by importance, 
complete section breakdowns, all relevant terms/definitions, and actionable takeaways.`;
  }
}

export async function analyzeDocument(
  combinedText: string,
  mode: AnalysisMode = "comprehensive",
  modelId?: string,
  clientApiKey?: string,
  images?: ImageInlinePart[]
): Promise<AnalysisResult> {
  const modeInstructions = getModeInstructions(mode);

  const imageInstruction =
    images && images.length > 0
      ? `\nIMPORTANT: The user has attached ${images.length} photo(s)/diagram(s) of study materials. Analyze the visual content (diagrams, charts, formulas, tables, handwritten notes) and incorporate your findings into the analysis.`
      : "";

  const prompt = `You are an expert document analyst and knowledge extractor. Analyze the provided document thoroughly and extract everything important.

${modeInstructions}
${imageInstruction}

Return a JSON object with this EXACT schema:
{
  "documentTitle": "string — inferred title or topic of the document",
  "documentType": "string — e.g. 'Academic Paper', 'Lecture Notes', 'Textbook Chapter', 'Report', 'Manual', 'Legal Document', etc.",
  "executiveSummary": "string — a clear, comprehensive 3-5 paragraph summary covering the main message, purpose, and conclusions of the document",
  "keyPoints": [
    {
      "point": "string — a clear, concise key fact or concept",
      "importance": "critical | important | good-to-know",
      "category": "string — optional grouping label like 'Definition', 'Formula', 'Process', 'Date/Event', 'Concept', 'Rule', 'Example'"
    }
  ],
  "sectionBreakdowns": [
    {
      "title": "string — section or topic heading",
      "summary": "string — 2-4 sentence summary of this section",
      "keyDetails": ["string — specific important details, data points, or facts from this section"]
    }
  ],
  "termsAndDefinitions": [
    {
      "term": "string — exact key term, scientific concept, formula name, acronym, metric, or vocabulary word",
      "definition": "string — complete, accurate, domain-specific definition directly grounded in the text",
      "category": "string — optional classification like 'Core Concept', 'Acronym', 'Formula / Law', 'Method / Algorithm', 'Component', 'Metric', or 'Standard'"
    }
  ],
  "actionableTakeaways": ["string — practical conclusions, recommendations, or things to remember"],
  "studyTips": ["string — specific strategies for studying or remembering this material (optional, include 3-5 if relevant)"],
  "tldr": "string — a single 2-3 sentence 'too long; didn't read' ultra-brief summary"
}

Requirements:
- Extract ALL important information — don't skip details that someone studying or referencing this material would need.
- Key points should be self-contained and understandable without reading the full document.
- Sort key points with "critical" first, then "important", then "good-to-know".
- Include at least 10-20 key points for comprehensive mode.
- EXHAUSTIVE TERMS & DEFINITIONS EXTRACTION:
  * You MUST thoroughly capture and define EVERY single specialized term, technical acronym, domain formula, law, algorithm, metric, and core concept introduced or used in the text.
  * Do NOT provide merely a few basic words. Extract all relevant vocabulary comprehensively (typically 15 to 40+ terms for substantial texts).
  * For acronyms, provide the full spelled-out name plus what it represents.
  * Definitions must be 100% accurate, precise, and faithful to the document's domain context.
- Section breakdowns should follow the document's natural organization.
- TLDR must be extremely concise but capture the absolute essence.

${combinedText ? `\nDocument Content:\n${combinedText.slice(0, 100000)}` : ""}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [prompt];
  if (images && images.length > 0) {
    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        },
      });
    }
  }

  // Model fallback chain: requested model first, then verified active models
  const requestedModel = modelId || process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const fallbackModels = [
    requestedModel,
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let raw = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastError: any = null;

  for (const m of fallbackModels) {
    // Retry each model up to 3 attempts with exponential backoff on 503 (overloaded)
    const MAX_ATTEMPTS = 3;
    let modelSucceeded = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`[Gemini] Attempting generation with model "${m}" (attempt ${attempt}/${MAX_ATTEMPTS})...`);
        const model = getModel(m, clientApiKey);
        const result = await model.generateContent(parts);
        raw = result.response.text().trim();
        modelSucceeded = true;
        console.log(`[Gemini] Model "${m}" succeeded!`);
        break;
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        const is503 = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("overloaded");
        const isRateLimit = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota");
        const isNotFound = errMsg.includes("404") || errMsg.includes("not found");
        const isAuthError = errMsg.includes("API_KEY_INVALID") || errMsg.includes("PERMISSION_DENIED");

        console.warn(`[Gemini] Model "${m}" (attempt ${attempt}) failed: ${errMsg.slice(0, 120)}`);

        // Auth errors should terminate immediately
        if (isAuthError) {
          throw err;
        }

        // If 404 (model doesn't exist), don't retry this model, move to next
        if (isNotFound) {
          break;
        }

        // If 503 or 429, wait with exponential backoff before retrying
        if ((is503 || isRateLimit) && attempt < MAX_ATTEMPTS) {
          const waitMs = attempt * 1800; // 1.8s, 3.6s
          console.log(`[Gemini] Waiting ${waitMs}ms before retrying "${m}"...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        // On last attempt or non-retriable error, break and try next fallback model
        break;
      }
    }

    if (modelSucceeded) {
      break;
    }

    // Small delay before trying next fallback model
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  if (!raw) {
    throw lastError || new Error("All AI models are currently busy. Please try again in a moment.");
  }

  // Strip markdown code fences
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON. Raw: " + raw.slice(0, 300));
  }

  // Normalize importance values
  if (parsed.keyPoints) {
    parsed.keyPoints = parsed.keyPoints.map((kp) => ({
      ...kp,
      importance: (["critical", "important", "good-to-know"].includes(kp.importance)
        ? kp.importance
        : "important") as "critical" | "important" | "good-to-know",
    }));
  }

  return parsed;
}
