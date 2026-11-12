import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument, parseGeminiError } from "@/lib/gemini";
import { AnalyzeRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { texts, model, apiKey, mode, images } = body;

    if ((!texts || texts.length === 0) && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: "No text or images provided for analysis" },
        { status: 400 }
      );
    }

    const combinedText = texts.join("\n\n---\n\n");

    const analysis = await analyzeDocument(
      combinedText,
      mode || "comprehensive",
      model,
      apiKey,
      images
    );

    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const parsed = parseGeminiError(err);
    return NextResponse.json(
      {
        error: parsed.message,
        isRateLimit: parsed.isRateLimit,
        retryAfter: parsed.retryAfter,
      },
      { status: parsed.isRateLimit ? 429 : 500 }
    );
  }
}
