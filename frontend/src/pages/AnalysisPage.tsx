import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, FileText } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { getDocuments } from "../api/client";
import type { DocumentListItem } from "../types";

export function AnalysisPage() {
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDocuments();
        // Show documents that have reached at least "analyzed" status
        const analyzed = data.filter(
          (d) => d.status === "analyzed" || d.status === "workbook"
        );
        setDocuments(analyzed);
      } catch {
        addToast("error", "Failed to load analysis data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  return (
    <>
      <Navbar title="Analysis" />

      <div className="p-6">
        {loading ? (
          <LoadingSpinner label="Loading analysis…" />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-5 w-5" />}
            title="No analysis available"
            description="Generate analysis on a document to see results here."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {documents.length} document{documents.length !== 1 && "s"} with analysis
            </p>
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Document #{doc.id}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
