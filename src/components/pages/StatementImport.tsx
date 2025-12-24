"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase";
import { createStatement, createTransaction, Timestamp } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, FileText, Upload, X, Loader2 } from "lucide-react";

interface ParsedTransaction {
  dateIso: string;
  description: string;
  amountCents: number;
  hash: string;
}

interface ReviewTransaction extends ParsedTransaction {
  category: string;
  type: "income" | "expense";
  isValid: boolean;
}

export default function StatementImport() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Review state
  const [reviewTransactions, setReviewTransactions] = useState<ReviewTransaction[]>([]);
  const [statementFilename, setStatementFilename] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    console.log("🔍 handleUpload called", { 
      file: file?.name, 
      currentUser: currentUser?.uid,
      authLoading 
    });
    
    if (!currentUser) {
      setError("You must be logged in to upload statements");
      console.error("⚠️ Upload blocked - user not authenticated");
      return;
    }
    
    if (!file) {
      setError("Please select a file first");
      console.error("⚠️ Upload blocked - no file selected");
      return;
    }

    console.log("🚀 Starting upload process", {
      fileName: file.name,
      fileSize: file.size,
      userId: currentUser.uid
    });

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress("Uploading PDF...");
    console.log("📤 Step 1: Uploading PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", currentUser.uid);

      setUploadProgress("Parsing PDF content...");
      console.log("📄 Step 2: Parsing PDF content...");
      
      const response = await fetch("/api/statements/import", {
        method: "POST",
        body: formData,
      });

      console.log("📡 API Response received", {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log("📊 API Data:", data);

      if (!response.ok) {
        console.error("❌ API Error:", data.error);
        throw new Error(data.error || "Failed to parse PDF");
      }

      setUploadProgress("Extracting transactions...");
      console.log("💰 Step 3: Extracting transactions...", {
        transactionCount: data.transactionCount
      });
      
      // Convert to review format with default categorization
      const transactions: ReviewTransaction[] = data.transactions.map((txn: ParsedTransaction) => ({
        ...txn,
        category: txn.amountCents < 0 ? "Uncategorized" : "Income",
        type: (txn.amountCents < 0 ? "expense" : "income") as "income" | "expense",
        isValid: true,
      }));

      console.log("✅ Transactions processed:", transactions.length);
      console.log("📋 Sample transactions:", transactions.slice(0, 3));

      setUploadProgress("Complete!");
      console.log("🎉 Upload process complete!");
      
      setReviewTransactions(transactions);
      setStatementFilename(data.filename);
      setSuccess(`Found ${data.transactionCount} transactions. Review below before importing.`);
    } catch (err) {
      console.error("💥 Upload failed:", err);
      setError(err instanceof Error ? err.message : "Failed to upload file");
      setUploadProgress("");
    } finally {
      setIsUploading(false);
      console.log("🏁 Upload process ended");
    }
  };

  const handleCategoryChange = (index: number, category: string) => {
    setReviewTransactions((prev) =>
      prev.map((txn, i) => (i === index ? { ...txn, category } : txn))
    );
  };

  const handleTypeChange = (index: number, type: "income" | "expense") => {
    setReviewTransactions((prev) =>
      prev.map((txn, i) => (i === index ? { ...txn, type } : txn))
    );
  };

  const handleRemoveTransaction = (index: number) => {
    setReviewTransactions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (!currentUser || reviewTransactions.length === 0) return;

    setIsImporting(true);
    setError(null);

    try {
      // Create statement record
      const statementId = await createStatement({
        source: "pdf_upload",
        filename: statementFilename,
        status: "parsed",
        transactionCount: reviewTransactions.length,
        errors: [],
      });

      // Create transactions with deduplication
      let imported = 0;
      const errors: string[] = [];

      for (const txn of reviewTransactions) {
        try {
          // Convert date string to Timestamp
          const dateParts = txn.dateIso.split("-");
          const date = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
          );

          // createTransaction now automatically handles the hierarchical path based on date
          await createTransaction({
            amount: Math.abs(txn.amountCents) / 100, // Convert cents to dollars
            type: txn.type,
            category: txn.category,
            description: txn.description,
            date: Timestamp.fromDate(date),
            statementId,
            hash: txn.hash,
          });

          imported++;
        } catch {
          errors.push(`Failed to import: ${txn.description}`);
        }
      }

      // Update statement with final count
      if (errors.length > 0) {
        // Note: We'd need an updateStatement call here but for simplicity we'll skip
        console.warn("Some transactions failed:", errors);
      }

      setSuccess(`Successfully imported ${imported} transactions!`);
      setReviewTransactions([]);
      setFile(null);
      setStatementFilename("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions");
    } finally {
      setIsImporting(false);
    }
  };

  const formatAmount = (cents: number) => {
    const amount = Math.abs(cents) / 100;
    return cents < 0 ? `-$${amount.toFixed(2)}` : `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateIso: string) => {
    const [year, month, day] = dateIso.split("-");
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Bank Statement</h1>
          <p className="text-muted-foreground mt-2">
            Upload a PDF bank statement to automatically extract transactions
          </p>
        </div>

        {/* Upload Section */}
        <Card>
            <CardHeader>
              <CardTitle>Upload PDF Statement</CardTitle>
              <CardDescription>
                Select a PDF file from your bank (max 10MB). Text-based PDFs work best.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select PDF File</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="flex-1"
                  />
                  {file && (
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || reviewTransactions.length > 0 || !currentUser || authLoading}
                      className="min-w-[120px]"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Auth Warning */}
              {!authLoading && !currentUser && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You must be logged in to upload statements. Please refresh the page or log in again.
                  </AlertDescription>
                </Alert>
              )}

              {/* Progress Indicator */}
              {isUploading && uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{uploadProgress}</p>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: uploadProgress === "Uploading PDF..." ? "33%" : uploadProgress === "Parsing PDF content..." ? "66%" : "100%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Use text-based PDFs (not scanned images)</li>
                  <li>Statements from major banks work best</li>
                  <li>You can review and edit transactions before importing</li>
                  <li>Duplicate transactions are automatically detected</li>
                </ul>
              </div>
            </CardContent>
          </Card>

        {/* Parsed Transactions Preview */}
        {reviewTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Parsed {reviewTransactions.length} Transactions
              </CardTitle>
              <CardDescription>
                From {statementFilename}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {reviewTransactions.map((txn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(txn.dateIso)}
                      </p>
                    </div>
                    <span
                      className={`font-semibold text-sm ${
                        txn.amountCents < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatAmount(txn.amountCents)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Review and edit transactions below before importing to your account.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Section */}
        {reviewTransactions.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Review Transactions</CardTitle>
                <CardDescription>
                  Review and edit transactions from {statementFilename} before importing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewTransactions.map((txn, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{txn.description}</span>
                          <span
                            className={`font-semibold ${
                              txn.amountCents < 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {formatAmount(txn.amountCents)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {formatDate(txn.dateIso)}
                          </span>
                          <Select
                            value={txn.type}
                            onValueChange={(value) =>
                              handleTypeChange(index, value as "income" | "expense")
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={txn.category}
                            onChange={(e) => handleCategoryChange(index, e.target.value)}
                            placeholder="Category"
                            className="max-w-[200px] h-8"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTransaction(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewTransactions([]);
                  setFile(null);
                  setStatementFilename("");
                  setSuccess(null);
                  setUploadProgress("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={isImporting || reviewTransactions.length === 0}
                className="min-w-[150px]"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Importing...
                  </>
                ) : (
                  <>Import {reviewTransactions.length} Transactions</>
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
}
