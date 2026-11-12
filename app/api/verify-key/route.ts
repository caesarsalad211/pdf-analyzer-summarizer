import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const VERIFY_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
];

export async function POST(req: NextRequest) {
  try {
    const { apiKey, model } = await req.json();
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

    if (!effectiveKey || effectiveKey === "your_api_key_here") {
      return NextResponse.json(
        { valid: false, error: "No API key provided" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(effectiveKey);

    const modelsToTry = [
      ...(model ? [model] : []),
      ...VERIFY_MODELS.filter((m) => m !== model),
    ];

    let lastError: Error | null = null;
    let successfulModel: string | null = null;
    let hitRateLimit = false;

    for (const m of modelsToTry) {
      try {
        const targetModel = genAI.getGenerativeModel({ model: m });
        await targetModel.generateContent("Test connection: respond OK");
        successfulModel = m;
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;

        if (
          errMsg.includes("API_KEY_INVALID") ||
          errMsg.includes("API key not valid") ||
          errMsg.includes("PERMISSION_DENIED")
        ) {
          return NextResponse.json(
            { valid: false, error: "API key is invalid or unauthorized." },
            { status: 400 }
          );
        }

        if (
          errMsg.includes("429") ||
          errMsg.includes("Too Many Requests") ||
          errMsg.includes("Quota exceeded") ||
          errMsg.includes("RESOURCE_EXHAUSTED")
        ) {
          hitRateLimit = true;
          continue;
        }

        console.warn(`Key verification on ${m} received ${errMsg.slice(0, 70)}. Trying fallback...`);
      }
    }

    if (successfulModel) {
      const isFallback = model && successfulModel !== model;
      return NextResponse.json({
        valid: true,
        message: isFallback
          ? `✅ Key Verified! (${model || "Requested model"} was busy; verified active with ${successfulModel})`
          : `✅ Key Verified! Connection successful with ${successfulModel}.`,
        verifiedModel: successfulModel,
      });
    }

    if (hitRateLimit) {
      return NextResponse.json({
        valid: true,
        message: "✅ Key Verified! (Note: Free Tier 1-min quota reached; ready to generate shortly)",
        verifiedModel: model || "gemini-3.8-flash",
      });
    }

    const message = lastError ? lastError.message : "Service temporarily unavailable. Please try again.";
    return NextResponse.json({ valid: false, error: message }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid API key";
    return NextResponse.json({ valid: false, error: message }, { status: 400 });
  }
}
