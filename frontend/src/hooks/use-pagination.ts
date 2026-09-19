'use client';

import * as React from 'react';

/**
 * Client-side paging for a list already in memory.
 *
 * `resetKey` (e.g. the current search text or filters) sends the list back to
 * the first page whenever it changes, without an effect: the stored page only
 * counts while it belongs to the current key.
 */
export function usePagination<T>(items: readonly T[], pageSize = 10, resetKey = '') {
  const [state, setState] = React.useState({ key: resetKey, page: 1 });
  const requested = state.key === resetKey ? state.page : 1;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requested, pageCount);

  const pageItems = React.useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return {
    pageItems,
    pagerProps: {
      page,
      pageSize,
      total: items.length,
      onPageChange: (next: number) => setState({ key: resetKey, page: next }),
    },
  };
}
