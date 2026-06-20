import { useState, useMemo, useEffect, useRef } from "react";

const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

/**
 * Reusable hook for client-side search + pagination.
 *
 * Flow: items → filter by debounced query → paginate.
 * Changing the search query automatically resets to page 1.
 */
export function useSearchAndPagination<T>(
  items: T[],
  searchField: (item: T) => string,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Debounce the search query ──────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Reset to page 1 whenever the debounced query changes ─
  const prevQuery = useRef(debouncedQuery);
  useEffect(() => {
    if (prevQuery.current !== debouncedQuery) {
      setCurrentPage(1);
      prevQuery.current = debouncedQuery;
    }
  }, [debouncedQuery]);

  // ── Filtered items (search applied) ────────────────────
  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return items;
    return items.filter((item) =>
      searchField(item).toLowerCase().includes(debouncedQuery)
    );
  }, [items, debouncedQuery, searchField]);

  // ── Pagination math ────────────────────────────────────
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length, pageSize]
  );

  // Clamp currentPage if filteredItems shrinks
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    currentPage: safePage,
    setCurrentPage,
    filteredItems,
    paginatedItems,
    totalPages,
  };
}
