import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "../type/pagination";

interface PaginationProps {
  meta: PaginationMeta;
  isLoading?: boolean;
  perPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

const buildPageItems = (currentPage: number, lastPage: number) => {
  const pages: Array<number | "..."> = [];

  for (let page = 1; page <= lastPage; page += 1) {
    const isEdge = page === 1 || page === lastPage;
    const isNearCurrent = Math.abs(page - currentPage) <= 1;

    if (isEdge || isNearCurrent) {
      pages.push(page);
      continue;
    }

    if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return pages;
};

export const Pagination = ({
  meta,
  isLoading = false,
  perPageOptions = [10, 20, 50],
  onPageChange,
  onPerPageChange,
}: PaginationProps) => {
  if (meta.total === 0) return null;

  const pages = buildPageItems(meta.currentPage, meta.lastPage);
  const canGoPrevious = meta.currentPage > 1 && !isLoading;
  const canGoNext = meta.currentPage < meta.lastPage && !isLoading;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-center">

      <div className="flex flex-wrap items-center gap-3">
        {onPerPageChange && (
          <select
            value={meta.perPage}
            disabled={isLoading}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-600 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={!canGoPrevious}
            onClick={() => onPageChange(meta.currentPage - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          {pages.map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-sm font-bold text-gray-300"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                disabled={isLoading || page === meta.currentPage}
                onClick={() => onPageChange(page)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${
                  page === meta.currentPage
                    ? "bg-primary text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                } disabled:cursor-not-allowed`}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            aria-label="Next page"
            disabled={!canGoNext}
            onClick={() => onPageChange(meta.currentPage + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
