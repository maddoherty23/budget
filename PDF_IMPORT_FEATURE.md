# PDF Statement Import Feature

## Overview

This feature allows users to upload PDF bank statements and automatically extract transactions without storing the PDF file. The PDF is parsed in-memory, transactions are extracted, and only the transaction data is saved to Firestore.

## Architecture

**Flow**: Client → Next.js API route → Parse in memory → Return transactions → Client saves to Firestore

- ✅ No PDF stored permanently
- ✅ Works with text-based PDFs (most bank statements)
- ✅ Automatic deduplication via transaction hash
- ✅ Review and edit before importing

## File Structure

```
src/
├── app/
│   ├── api/statements/import/route.ts    # PDF parsing API endpoint
│   └── import-statement/page.tsx          # Page route
├── components/pages/
│   └── StatementImport.tsx                # Main UI component
└── lib/firebase/
    └── firestore.ts                       # Updated with Statement types
```

## Data Model

### Statement Collection

```typescript
{
  id: string;
  userId: string;
  createdAt: Timestamp;
  source: "pdf_upload" | "manual";
  filename: string;
  status: "parsing" | "parsed" | "failed";
  transactionCount: number;
  errors: string[];
}
```

### Transaction Updates

Transactions now include:
- `statementId?: string` - Links to the imported statement
- `hash?: string` - Deduplication hash (SHA256 of userId|date|description|amount)

## How It Works

### 1. PDF Upload & Parsing

The API route (`/api/statements/import`) receives the PDF and:
- Validates file type and size (max 10MB)
- Extracts text using `pdf-parse`
- Parses transactions using pattern matching
- Returns parsed transactions (PDF is discarded)

### 2. Transaction Parsing

The parser looks for lines matching this pattern:
```
MM/DD/YYYY MERCHANT_NAME -$123.45
```

Supported formats:
- Dates: `MM/DD/YYYY` or `MM/DD/YY`
- Amounts: `-$1,234.56`, `$1234.56`, `-123.45`, `123.45`
- Filters out: "beginning balance", "ending balance", "total"

### 3. Deduplication

Each transaction gets a hash:
```typescript
SHA256(userId|dateIso|description|amountCents).slice(0, 24)
```

Using the hash as document ID prevents duplicate imports.

### 4. Review & Import

Users can:
- Review extracted transactions
- Edit categories and types
- Remove unwanted transactions
- Confirm import to Firestore

## Usage

### Access the Feature

Navigate to: `http://localhost:3000/import-statement`

### Upload Flow

1. **Select PDF**: Choose a bank statement PDF (text-based, max 10MB)
2. **Parse**: Click "Upload" to extract transactions
3. **Review**: Edit categories, types, or remove transactions
4. **Import**: Click "Import X Transactions" to save to Firestore

## Customization

### Bank-Specific Parsers

The baseline parser works for most statements, but you can add bank-specific logic:

```typescript
// In route.ts, add bank detection
function detectBank(text: string): string {
  if (text.includes("CHASE")) return "chase";
  if (text.includes("BANK OF AMERICA")) return "boa";
  return "generic";
}

// Create parser variants
function parseChaseStatement(text: string) { ... }
function parseBOAStatement(text: string) { ... }
```

### Date Format Support

To support different date formats (e.g., `YYYY-MM-DD`):

```typescript
function parseDateFlexible(s: string): string {
  // Try MM/DD/YYYY
  if (s.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
    return isoDateFromMMDDYYYY(s);
  }
  // Try YYYY-MM-DD
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return s; // Already ISO format
  }
  throw new Error(`Unsupported date format: ${s}`);
}
```

## Future Enhancements

### OCR Support (Phase 2)

For scanned PDFs:
1. Upload bytes → Cloud Vision/Textract
2. Parse OCR response
3. Discard bytes (still no storage)

### Advanced Features

- **Auto-categorization**: ML-based category suggestions
- **Multi-line descriptions**: Stitch descriptions across lines
- **Amount/Balance distinction**: Better parsing when both appear
- **Statement metadata**: Extract date range, account number
- **Import history**: Show previously imported statements

## Firestore Security

Rules enforce user-scoped access:

```javascript
match /statements/{statementId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && hasValidUserId();
  allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}
```

## Testing

### Test with Sample PDF

1. Download a bank statement PDF (text-based)
2. Navigate to `/import-statement`
3. Upload the PDF
4. Verify transactions are extracted correctly
5. Edit any incorrect categorizations
6. Import and verify in Transactions page

### Common Issues

**"This statement appears to be scanned"**
- The PDF is an image, not text
- OCR support coming soon
- Use text-based PDFs instead

**"Could not find any transactions"**
- Parser doesn't match the format
- Check extractedText in error response
- Customize parser for this bank's format

**Duplicate transactions**
- Expected behavior! Hash prevents duplicates
- Firestore merge prevents overwriting

## Dependencies

- `pdf-parse` - PDF text extraction (no permanent storage)
- `crypto` (Node.js built-in) - Hash generation

## Deployment Notes

- API route uses Node.js runtime (`export const runtime = "nodejs"`)
- Serverless timeout: Keep parsing fast (< 10 seconds)
- Memory limit: 10MB PDF limit prevents OOM
- No external storage needed (Firebase Storage not required)

## Example Usage

```typescript
// Upload PDF
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("userId", currentUser.uid);

const response = await fetch("/api/statements/import", {
  method: "POST",
  body: formData,
});

const { transactions, filename } = await response.json();

// Save to Firestore (with deduplication)
for (const txn of transactions) {
  await createTransaction({
    amount: Math.abs(txn.amountCents) / 100,
    type: txn.type,
    category: txn.category,
    description: txn.description,
    date: Timestamp.fromDate(new Date(txn.dateIso)),
    hash: txn.hash, // Deduplication key
    statementId: statementId,
  });
}
```

## Support

For issues or feature requests:
1. Check the extractedText in error responses
2. Share 10-20 lines of statement text (redacted) for parser tuning
3. Specify bank name for custom parser development
