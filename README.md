# 📄 PDF Analyzer & Summarizer — AI Document Intelligence & Study Suite 🔍

An intelligent, token-optimized Next.js web application that transforms complex PDFs, research papers, lecture slides, and notes into **instant executive summaries**, **tiered must-know key points**, **accurate terms & definitions glossaries**, and **publication-grade printable study reports** powered by Google Gemini AI.

Forked and redesigned from the [PDF Exam Generator](https://github.com/caesarsalad211/pdf-exam-generator) architecture, tailored specifically for deep document comprehension, synthesis, and revision.

---

## 🎯 What Does It Do?

1. **Multi-Page PDF & Snapshot Ingestion**:
   - Ingests textbooks, academic papers, lecture slides, legal briefs, technical reports, and syllabus notes.
   - Accepts photos of handwritten notes, formulas, diagrams, and whiteboard snapshots via Gemini Vision.
   - Built-in token cleaner & compressor automatically strips boilerplate, page numbers, and redundant line wraps (reducing token cost by **30% – 50%**).
2. **4 Tailored Analysis Modes**:
   - 📊 **Comprehensive:** Full, balanced deep analysis covering all sections, key points, terms, and takeaways.
   - 📝 **Summary Only:** High-level executive overview and punchy TL;DR for rapid document scanning.
   - 🎯 **Key Points:** Exhaustive extraction of every must-know fact, date, formula, and concept sorted by criticality.
   - 📚 **Study Guide:** Emphasizes technical definitions, section breakdowns, and actionable study/memorization strategies.
3. **Exhaustive Terms & Definitions Glossary**:
   - Captures **15 to 40+ specialized terms**, formulas, acronyms, and proper nouns directly grounded in the text.
   - Automatic acronym expansions with contextual explanations.
   - Interactive **A-Z Jump Bar**, category filters, and dual view modes (**Cards View** or **Compact Table View**).
4. **Tiered Must-Know Key Points**:
   - 🔴 **Critical (Must Know)**: Fundamental laws, core principles, essential formulas.
   - 🟡 **Important**: Supporting facts, mechanisms, relationships, and cause-and-effect.
   - 🟢 **Good to Know**: Historical context, edge cases, examples, and supplementary details.
5. **🖨️ Publication-Grade Print & PDF Export**:
   - One-click **Print / Save PDF** button formatted specifically for physical paper or digital PDF export.
   - Automatically unrolls all sections continuously with `break-inside: avoid` to prevent mid-card page splits.
   - Clean black/white contrast with web controls hidden automatically.
6. **Local Browser Persistence & Fast Retakes**:
   - Automatically saves all past analyses in your browser's local storage.
   - Review, search, and export past analyses anytime with **0 API tokens used**.

---

## ✨ Feature Comparison & Highlights

| Feature | Description |
|---|---|
| 🖨️ **Print & Save to PDF** | Native print stylesheets (`@media print`) format all sections continuously without tabs for clean PDF or paper printing. |
| 📖 **Accurate Terms Glossary** | Exhaustively extracts domain terms and acronyms with category tags, A-Z jump bar, and Cards vs. Table view modes. |
| ⚡ **Executive TL;DR** | 2–3 sentence digest capturing the absolute essence of any document in seconds. |
| 🔴 **Tiered Key Points** | Color-coded importance levels (Critical, Important, Good to Know) with category badges (Formula, Concept, Law, etc.). |
| 📑 **Collapsible Section Breakdowns** | Structured section-by-section analysis highlighting key data, arguments, and takeaways per chapter. |
| 📋 **1-Click Copy Everywhere** | Copy buttons on TL;DR, Summary, Critical Points, Terms, or the complete document report. |
| 🔍 **Live Search Filter** | Instantly find concepts, keywords, or terms in real-time as you type. |
| 📥 **Markdown & JSON Export** | Download the full report as formatted `.md` (for Obsidian/Notion) or `.json` (for programmatic use). |
| ⚡ **Token Sanitizer** | Compresses raw PDF text to save 30%–50% on token consumption without losing study concepts. |
| 📑 **Page Range Selector** | Select specific page ranges (e.g. `1-10, 15`) per PDF to analyze only relevant chapters. |
| 🚀 **Modern Gemini 3.x Engine** | Built for `gemini-3.8-flash` and `gemini-3.5-flash-lite` with automatic exponential backoff retries. |
| 🔑 **Bring Your Own Key (BYOK)** | In-app **🔑 API Key** modal saves your key securely in browser storage with instant live testing tool. |
| 💾 **Local History** | Preserves all previous analyses in browser storage with instant reload and delete options. |

---

## 🚀 Quick Start (Local Run)

### 1. Clone & Install
```bash
git clone https://github.com/caesarsalad211/pdf-analyzer-summarizer.git
cd pdf-analyzer-summarizer
npm install
```

### 2. Start the App
Using the included batch script:
```bat
start-app.bat
```
Or via terminal:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Add Your Free Gemini API Key
1. Click the **🔑 Paste API Key** button in the top navbar.
2. Get a free API key at [Google AI Studio](https://aistudio.google.com).
3. Paste it and click **Save Key**. Your key is stored safely in your browser's local storage and never exposed.

---

## 🖨️ Printing & Saving as PDF

1. Generate or open any document analysis.
2. Click the **`🖨️ Print / Save PDF`** button in the top bar (or press <kbd>Ctrl</kbd> + <kbd>P</kbd>).
3. In the browser print dialog:
   - **Destination:** Select **"Save as PDF"** or choose your physical printer.
   - **Margins:** Default or Minimal.
   - **Options:** Enable **"Background graphics"** for clean styled badges.
4. Click **Save** or **Print**.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router + Webpack / Turbopack)
- **Styling:** Tailwind CSS v4
- **AI Engine:** Google Gemini API (`@google/generative-ai` multimodal text & vision)
- **Primary Models:** `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3-flash-preview`
- **PDF Extraction:** `pdf-parse` v2 (Server-side stream parsing)
- **Storage:** Browser `localStorage` + `sessionStorage`
- **Language:** TypeScript 5

---

## 🔒 Privacy & Security

- **No Server Tracking:** Uploaded documents are parsed in-memory during your session and are not stored permanently on any remote server.
- **Client-Side API Keys:** API keys entered via the UI are stored exclusively in your browser's local storage and sent directly to Google's official Gemini endpoint.
- **Git Ignored Credentials:** All `.env*` files are strictly gitignored to guarantee zero credential leakage.

---

## 📄 License

MIT License. Feel free to use, modify, and distribute for study, research, and productivity!
