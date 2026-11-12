"use client";

import { useState } from "react";

export default function AboutModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
      >
        <span className="text-sm">ℹ️</span>
        <span>About</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 text-lg">
                  🔍
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  About PDF Analyzer
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>PDF Analyzer & Summarizer</strong> is an AI-powered tool that takes any PDF document and extracts everything you need to know from it.
              </p>

              <div className="rounded-xl bg-teal-50 border border-teal-200 p-3">
                <p className="text-xs font-bold text-teal-900 mb-2">✨ Features:</p>
                <ul className="text-xs text-teal-800 space-y-1 list-disc list-inside">
                  <li>Executive summaries & TL;DR</li>
                  <li>Key points sorted by importance (critical → good-to-know)</li>
                  <li>Section-by-section breakdowns</li>
                  <li>Key terms & definitions glossary</li>
                  <li>Actionable takeaways & study tips</li>
                  <li>Export as Markdown or JSON</li>
                  <li>Multiple analysis modes (Comprehensive, Summary, Key Points, Study Guide)</li>
                </ul>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs font-bold text-gray-800 mb-1">🔐 Privacy:</p>
                <p className="text-xs text-gray-600">
                  Your API key is stored only in your browser&apos;s local storage. PDFs are processed server-side for text extraction but are never stored permanently. Analysis results are saved in your browser.
                </p>
              </div>

              <p className="text-xs text-gray-400 text-center pt-2">
                Built with Next.js, Tailwind CSS, and Google Gemini AI
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
