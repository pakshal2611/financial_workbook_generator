import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Search } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { SearchInput } from "../components/ui/SearchInput";
import { Pagination } from "../components/ui/Pagination";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useSearchAndPagination } from "../hooks/useSearchAndPagination";
import { getDocuments } from "../api/client";
import type { DocumentListItem } from "../types";

export function WorkbooksPage() {
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDocuments();
        // Show documents that have workbooks
        const withWorkbooks = data.filter((d) => d.status === "workbook");
        setDocuments(withWorkbooks);
      } catch {
        addToast("error", "Failed to load workbooks");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

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

  const hasDocuments = documents.length > 0;
  const hasSearchResults = filteredItems.length > 0;
  const isSearching = debouncedQuery.length > 0;

  return (
    <>
      <Navbar title="Workbooks" />

      <div className="p-6">
        {loading ? (
          <LoadingSpinner label="Loading workbooks…" />
        ) : !hasDocuments ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title="No workbooks generated"
            description="Generate a workbook from a fully analyzed document to see it here."
          />
        ) : (
          <div className="space-y-3">
            {/* Search bar and result count */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search workbooks by document name…"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
                {isSearching
                  ? `${filteredItems.length} result${filteredItems.length !== 1 ? "s" : ""} for "${searchQuery.trim()}"`
                  : `${documents.length} workbook${documents.length !== 1 ? "s" : ""} generated`}
              </p>
            </div>

            {/* Workbooks list or empty search state */}
            {!hasSearchResults ? (
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No matching workbooks found"
                description="Try adjusting your search query."
              />
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                  {paginatedItems.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
