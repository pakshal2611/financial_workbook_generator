import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText as FileTextIcon,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { WorkflowProgress } from "../components/workflow/WorkflowProgress";
import { StatementCard } from "../components/statements/StatementCard";
import { AnalysisCard } from "../components/analysis/AnalysisCard";
import { WorkbookCard } from "../components/workbook/WorkbookCard";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import {
  getDocument,
  deleteDocument,
  extractText,
  extractStatements,
  generateAnalysis,
  generateWorkbook,
} from "../api/client";
import type {
  DocumentDetail,
  FinancialAnalysis,
} from "../types";

// Statement type labels
const STATEMENT_LABELS: Record<string, string> = {
  income_statement: "Income Statement",
  balance_sheet: "Balance Sheet",
  cash_flow: "Cash Flow Statement",
};

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  // Data state — everything comes from the enriched GET /documents/{id}
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Action loading states
  const [extractingText, setExtractingText] = useState(false);
  const [extractingStatements, setExtractingStatements] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [generatingWorkbook, setGeneratingWorkbook] = useState(false);

  // UI state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [textExpanded, setTextExpanded] = useState(false);

  const documentId = Number(id);

  const fetchDocument = useCallback(async () => {
    try {
      const data = await getDocument(documentId);
      setDocument(data);
    } catch {
      addToast("error", "Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [documentId, addToast]);

  useEffect(() => {
    const init = async () => {
      await fetchDocument();
    };
    void init();
  }, [fetchDocument]);

  // ── Derived state from the API response ────────────

  const status = document?.status ?? "uploaded";
  const extraction = document?.extraction ?? null;
  const statements = document?.financial_statements ?? [];
  const analysisRecord = document?.analysis ?? null;
  const workbookRecord = document?.workbook ?? null;

  // Parse analysis_json into the structured FinancialAnalysis object
  const parsedAnalysis: FinancialAnalysis | null = useMemo(() => {
    if (!analysisRecord?.analysis_json) return null;
    try {
      return JSON.parse(analysisRecord.analysis_json) as FinancialAnalysis;
    } catch {
      return null;
    }
  }, [analysisRecord]);

  const hasExtraction = !!extraction;
  const hasStatements = statements.length > 0;
  const hasAnalysis = !!analysisRecord;
  const hasWorkbook = !!workbookRecord;
  const workbookPath = workbookRecord?.file_path ?? null;

  // ── Action handlers ───────────────────────────────

  async function handleExtractText() {
    setExtractingText(true);
    try {
      await extractText(documentId);
      addToast("success", "Text extracted successfully");
      await fetchDocument(); // Re-fetch to get updated extraction + status
    } catch {
      addToast("error", "Text extraction failed");
    } finally {
      setExtractingText(false);
    }
  }

  async function handleExtractStatements() {
    setExtractingStatements(true);
    try {
      await extractStatements(documentId);
      addToast("success", "Financial statements extracted");
      await fetchDocument(); // Re-fetch to get updated statements + status
    } catch {
      addToast("error", "Statement extraction failed");
    } finally {
      setExtractingStatements(false);
    }
  }

  async function handleGenerateAnalysis() {
    setGeneratingAnalysis(true);
    try {
      await generateAnalysis(documentId);
      addToast("success", "Analysis generated");
      await fetchDocument(); // Re-fetch to get updated analysis + status
    } catch {
      addToast("error", "Analysis generation failed");
    } finally {
      setGeneratingAnalysis(false);
    }
  }

  async function handleGenerateWorkbook() {
    setGeneratingWorkbook(true);
    try {
      await generateWorkbook(documentId);
      addToast("success", "Workbook generated");
      await fetchDocument(); // Re-fetch to get updated workbook + status
    } catch {
      addToast("error", "Workbook generation failed");
    } finally {
      setGeneratingWorkbook(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDocument(documentId);
      addToast("success", "Document deleted");
      navigate("/documents");
    } catch {
      addToast("error", "Failed to delete document");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownloadWorkbook() {
    if (!workbookPath) return;
    
    try {
      let finalUrl = workbookPath.trim();
      
      // If the URL accidentally got prefixed with a path like /api/, extract the http part
      const httpIndex = finalUrl.indexOf("http");
      if (httpIndex > 0) {
        finalUrl = finalUrl.substring(httpIndex);
      }
      
      // Fix missing double slash if the browser or a proxy collapsed it (e.g. https:/...)
      if (finalUrl.startsWith("https:/") && !finalUrl.startsWith("https://")) {
        finalUrl = finalUrl.replace("https:/", "https://");
      } else if (finalUrl.startsWith("http:/") && !finalUrl.startsWith("http://")) {
        finalUrl = finalUrl.replace("http:/", "http://");
      }

      // Ensure it opens as an external link without referrer policies interfering
      const link = window.document.createElement("a");
      link.href = finalUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch {
      addToast("error", "Failed to download workbook");
    }
  }

  // ── Render ────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Navbar title="Document" />
        <LoadingSpinner label="Loading document…" />
      </>
    );
  }

  if (!document) {
    return (
      <>
        <Navbar title="Document" />
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Document not found.
          </p>
          <Link
            to="/documents"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            ← Back to documents
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar
        title={document.filename}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/documents")}
            >
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* ── Document Info ─────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <FileTextIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {document.filename}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Document #{document.id} · {document.file_path}
                </p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* ── Workflow Progress ─────────────────────── */}
        <WorkflowProgress currentStatus={status} />

        {/* ── Actions ──────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
            Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={hasExtraction ? "secondary" : "primary"}
              size="sm"
              loading={extractingText}
              disabled={extractingText}
              onClick={handleExtractText}
            >
              {hasExtraction ? "Re-extract Text" : "Extract Text"}
            </Button>

            <Button
              variant={hasStatements ? "secondary" : "primary"}
              size="sm"
              loading={extractingStatements}
              disabled={!hasExtraction || extractingStatements}
              onClick={handleExtractStatements}
            >
              {hasStatements ? "Re-extract Statements" : "Extract Statements"}
            </Button>

            <Button
              variant={hasAnalysis ? "secondary" : "primary"}
              size="sm"
              loading={generatingAnalysis}
              disabled={!hasStatements || generatingAnalysis}
              onClick={handleGenerateAnalysis}
            >
              {hasAnalysis ? "Re-generate Analysis" : "Generate Analysis"}
            </Button>

            <Button
              variant={hasWorkbook ? "secondary" : "primary"}
              size="sm"
              loading={generatingWorkbook}
              disabled={!hasAnalysis || generatingWorkbook}
              onClick={handleGenerateWorkbook}
            >
              {hasWorkbook ? "Re-generate Workbook" : "Generate Workbook"}
            </Button>
          </div>
        </div>

        {/* ── Extracted Text ───────────────────────── */}
        {hasExtraction && extraction && (
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <button
              onClick={() => setTextExpanded(!textExpanded)}
              className="flex w-full items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Extracted Text
              </h3>
              {textExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {textExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed max-h-96 overflow-y-auto font-mono text-xs">
                  {extraction.raw_text}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── Financial Statements ─────────────────── */}
        {hasStatements && (
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Financial Statements
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {statements.map((stmt) => (
                <StatementCard
                  key={stmt.id}
                  title={STATEMENT_LABELS[stmt.statement_type] ?? stmt.statement_type}
                  dataJson={stmt.data_json}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Analysis ─────────────────────────────── */}
        {parsedAnalysis && (
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Analysis Results
            </h3>
            <AnalysisCard analysis={parsedAnalysis} />
          </div>
        )}

        {/* ── Workbook ─────────────────────────────── */}
        {(hasAnalysis || hasWorkbook) && (
          <WorkbookCard
            filePath={workbookPath}
            loading={generatingWorkbook}
            onGenerate={handleGenerateWorkbook}
            onDownload={handleDownloadWorkbook}
          />
        )}
      </div>

      {/* ── Delete Dialog ──────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete document"
        description={`Are you sure you want to delete "${document.filename}"? All associated extractions, statements, analysis, and workbooks will be lost.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
