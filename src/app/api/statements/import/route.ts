import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createHash } from "crypto";
import path from "path";

export const runtime = "nodejs";

// Helper functions
function toCents(amountStr: string): number {
  // Handles "1,234.56" and "-123.45" and "$123.45"
  const cleaned = amountStr.replace(/[$,]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(`Bad amount: ${amountStr}`);
  return Math.round(n * 100);
}

function isoDateFromMMDDYYYY(s: string): string {
  // expects MM/DD/YYYY or MM/DD/YY
  const parts = s.split("/");
  if (parts.length !== 3) throw new Error(`Invalid date format: ${s}`);
  
  const [mm, dd, yy] = parts.map((x) => x.trim());
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export function hashTransaction(
  userId: string,
  dateIso: string,
  desc: string,
  cents: number
): string {
  const key = `${userId}|${dateIso}|${desc.toLowerCase().replace(/\s+/g, " ").trim()}|${cents}`;
  return createHash("sha256").update(key).digest("hex").slice(0, 24);
}

interface ParsedTransaction {
  dateIso: string;
  description: string;
  amountCents: number;
}

// Baseline parser - works for most standard bank statements
function parseTransactionsFromText(text: string): ParsedTransaction[] {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Match date at start of line: MM/DD/YYYY or MM/DD/YY
  const dateRe = /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.*)$/;
  // Match money amount: -$1,234.56 or $1234.56 or -123.45 or 123.45
  const moneyRe = /(-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2}))/;

  const txns: ParsedTransaction[] = [];

  for (const line of lines) {
    const m = line.match(dateRe);
    if (!m) continue;

    try {
      const dateIso = isoDateFromMMDDYYYY(m[1]);
      const rest = m[2];

      // Find all money-looking numbers in the line
      const allMoney = rest.match(new RegExp(moneyRe.source, "g"));
      if (!allMoney || allMoney.length === 0) continue;

      // Take last amount (usually the transaction amount, not balance)
      const amountStr = allMoney[allMoney.length - 1];
      const amountCents = toCents(amountStr);

      // Description is what's before the last amount match
      const idx = rest.lastIndexOf(amountStr);
      const description = rest.slice(0, idx).trim();

      // Filter obvious non-transaction lines
      if (!description || /beginning balance|ending balance|total|subtotal|page \d+/i.test(description)) {
        continue;
      }

      txns.push({ dateIso, description, amountCents });
    } catch {
      // Skip malformed lines
      continue;
    }
  }

  return txns;
}

export async function POST(req: NextRequest) {
  try {
    // Get file from form data
    const form = await req.formData();
    const file = form.get("file");
    const userId = form.get("userId");

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing PDF file" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF file too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const bytes = Buffer.from(await file.arrayBuffer());
    
    // Set up PDF.js worker
    const workerPath = path.join(
      process.cwd(),
      'node_modules',
      'pdfjs-dist',
      'legacy',
      'build',
      'pdf.worker.mjs'
    );
    PDFParse.setWorker(workerPath);
    
    const parser = new PDFParse({ data: bytes });
    const textResult = await parser.getText();
    const text = textResult.text?.trim() || "";

    if (text.length < 50) {
      // This is usually a scanned PDF that needs OCR
      return NextResponse.json(
        {
          error: "This statement appears to be scanned. Text-based PDFs work best. OCR support coming soon.",
        },
        { status: 422 }
      );
    }

    // Parse transactions from text
    const transactions = parseTransactionsFromText(text);

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error: "Could not find any transactions in this PDF. Please check the format.",
          extractedText: text.slice(0, 500), // First 500 chars for debugging
        },
        { status: 422 }
      );
    }

    // Add hash for deduplication
    const transactionsWithHash = transactions.map((txn) => ({
      ...txn,
      hash: hashTransaction(userId, txn.dateIso, txn.description, txn.amountCents),
    }));

    // Return parsed data - client will write to Firestore
    return NextResponse.json({
      success: true,
      filename: file.name,
      transactionCount: transactionsWithHash.length,
      transactions: transactionsWithHash,
    });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to parse PDF statement",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
