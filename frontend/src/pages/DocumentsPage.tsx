import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Search } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { DocumentTable } from "../components/documents/DocumentTable";
import { SearchInput } from "../components/ui/SearchInput";
import { Pagination } from "../components/ui/Pagination";
import { UploadModal } from "../components/documents/UploadModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useSearchAndPagination } from "../hooks/useSearchAndPagination";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  checkBackendHealth,
} from "../api/client";
import type { DocumentListItem } from "../types";

export function DocumentsPage() {
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    currentPage,
    setCurrentPage,
    filteredItems,
    paginatedItems,
    totalPages,
  } = useSearchAndPagination(documents, (d) => d.filename, 10);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error: unknown) {
      console.error("Failed to fetch documents:", error);
      const err = error as Error | { message?: string };
      addToast(
        "error",
        "Failed to load documents",
        "message" in err && err.message ? err.message : "Connection error"
      );
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    // Check backend health on component mount
    checkBackendHealth().then((healthy) => {
      setBackendHealthy(healthy);
      if (!healthy) {
        addToast(
          "error",
          "Backend Connection Failed",
          "Make sure backend is running on http://localhost:8000"
        );
      }
    });
    const init = async () => {
      await fetchDocuments();
    };
    void init();
  }, [fetchDocuments, addToast]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      addToast("success", "Document uploaded", doc.filename);
      setUploadOpen(false);
      navigate(`/documents/${doc.id}`);
    } catch (error: unknown) {
      console.error("Upload failed:", error);
      const err = error as Error | { message?: string };
      addToast(
        "error",
        "Upload failed",
        "message" in err && err.message ? err.message : "Unknown error"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      console.log(`Deleting document ${deleteTarget.id}...`);
      const result = await deleteDocument(deleteTarget.id);
      console.log("Delete successful:", result);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      addToast("success", "Document deleted", deleteTarget.filename);
      setDeleteTarget(null);
    } catch (error: unknown) {
      console.error("Delete failed:", error);
      interface ApiError extends Error {
        response?: { data?: { detail?: string }, status?: number };
      }
      const err = error as ApiError;
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      addToast(
        "error",
        "Failed to delete document",
        err.response?.data?.detail || err.message || "Unknown error"
      );
    } finally {
      setDeleting(false);
    }
  }

  if (backendHealthy === false) {
    return (
      <>
        <Navbar title="Documents" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Backend Connection Error
            </h3>
            <p className="text-red-800 dark:text-red-200 mb-4">
              Cannot connect to backend at http://localhost:8000
            </p>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300 font-mono bg-red-100 dark:bg-red-900/50 p-3 rounded">
              <p>✓ Frontend is running on http://localhost:5173</p>
              <p>✗ Backend is not responding on http://localhost:8000</p>
              <p className="mt-3">To fix:</p>
              <p>1. Open terminal in: demo_deloitte/backend</p>
              <p>2. Run: source venv/Scripts/activate</p>
              <p>3. Run: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Determine what content to show
  const hasDocuments = documents.length > 0;
  const hasSearchResults = filteredItems.length > 0;
  const isSearching = debouncedQuery.length > 0;

  return (
    <>
      <Navbar
        title="Documents"
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

      <div className="p-6">
        {loading ? (
          <LoadingSpinner label="Loading documents…" />
        ) : !hasDocuments ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No documents uploaded"
            description="Upload a financial PDF to begin the extraction and analysis workflow."
            action={
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
        ) : (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex items-center justify-between gap-4">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search documents…"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                {isSearching
                  ? `${filteredItems.length} result${filteredItems.length !== 1 ? "s" : ""} for "${searchQuery.trim()}"`
                  : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Documents table or empty search state */}
            {!hasSearchResults ? (
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No documents found"
                description="Try adjusting your search query."
              />
            ) : (
              <>
                <DocumentTable
                  documents={paginatedItems}
                  onDelete={(doc) => setDeleteTarget(doc)}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        )}
      </div>

      <UploadModal
        open={uploadOpen}
        loading={uploading}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete document"
        description={`Are you sure you want to delete "${deleteTarget?.filename}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
