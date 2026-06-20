import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, BarChart3, BookOpen, ArrowRight, Search } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { SearchInput } from "../components/ui/SearchInput";
import { UploadModal } from "../components/documents/UploadModal";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { getDocuments, uploadDocument } from "../api/client";
import type { DocumentListItem } from "../types";

export function DashboardPage() {
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Search state (Dashboard: search only, no pagination)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch {
      addToast("error", "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const init = async () => {
      await fetchDocuments();
    };
    void init();
  }, [fetchDocuments]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      addToast("success", "Document uploaded", doc.filename);
      setUploadOpen(false);
      navigate(`/documents/${doc.id}`);
    } catch {
      addToast("error", "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Computed stats
  const total = documents.length;
  const analyzed = documents.filter(
    (d) => d.status === "analyzed" || d.status === "workbook"
  ).length;
  const workbooks = documents.filter((d) => d.status === "workbook").length;
  const recent = useMemo(() => documents.slice(-10).reverse(), [documents]);

  // Filter recent documents by search
  const filteredRecent = useMemo(() => {
    if (!debouncedQuery) return recent;
    return recent.filter((doc) =>
      doc.filename.toLowerCase().includes(debouncedQuery)
    );
  }, [recent, debouncedQuery]);

  const stats = [
    { label: "Total Documents", value: total, icon: FileText, color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
    { label: "Analyzed", value: analyzed, icon: BarChart3, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    { label: "Workbooks", value: workbooks, icon: BookOpen, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" },
  ];

  return (
    <>
      <Navbar
        title="Dashboard"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setUploadOpen(true)}
          >
            Upload PDF
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Workflow Overview */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            AI Financial Workbook Builder
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Upload financial PDFs, extract data, analyze statements, and generate Excel workbooks.
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
            {["Upload PDF", "Extract Text", "Extract Statements", "Generate Analysis", "Generate Workbook"].map(
              (step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-md bg-gray-100 px-2.5 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {step}
                  </span>
                  {i < 4 && <ArrowRight className="h-3 w-3 text-gray-400" />}
                </span>
              )
            )}
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <LoadingSpinner label="Loading dashboard…" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                      {s.label}
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Documents */}
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Recent Documents
                </h3>
                <button
                  onClick={() => navigate("/documents")}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                >
                  View all →
                </button>
              </div>

              {/* Search bar for recent documents */}
              {recent.length > 0 && (
                <div className="px-6 pt-4">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search recent documents…"
                  />
                </div>
              )}

              {recent.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-5 w-5" />}
                  title="No documents yet"
                  description="Upload your first PDF to get started with the workflow."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setUploadOpen(true)}
                    >
                      Upload PDF
                    </Button>
                  }
                />
              ) : filteredRecent.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title="No matching documents found"
                  description="Try adjusting your search query."
                />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRecent.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.filename}
                        </span>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <UploadModal
        open={uploadOpen}
        loading={uploading}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
