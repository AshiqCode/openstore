'use client';

import { useEffect, useMemo, useState } from 'react';

// Splits an already-loaded list into pages.
//
// Deliberately client-side: the admin's search and status filters run over the
// whole list in memory, and paging on the server would mean a search only ever
// looked inside the current page. Chunking the display keeps that behaviour
// exactly as it is.
export type Paged<T> = {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  pageItems: T[];
  start: number; // 0-based index of the first item shown
  total: number;
};

export function usePagination<T>(items: T[], pageSize = 10): Paged<T> {
  const [page, setPage] = useState(1);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // The list can shrink under us — a filter narrows it, or a row is deleted.
  // Without this you'd be stranded on an empty page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  return { page: safePage, setPage, totalPages, pageItems, start, total };
}
