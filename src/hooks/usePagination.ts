import { useCallback, useMemo, useState } from "react";

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginationActions {
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

export interface PaginationInfo {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPageItems: number;
}

export interface UsePaginationReturn {
  state: PaginationState;
  actions: PaginationActions;
  info: PaginationInfo;
}

export function usePagination(
  totalItems: number,
  initialItemsPerPage: number = 10,
  initialPage: number = 1,
): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const info = useMemo((): PaginationInfo => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const currentPageItems = endIndex - startIndex;

    return {
      totalPages,
      startIndex,
      endIndex,
      hasNextPage,
      hasPreviousPage,
      currentPageItems,
    };
  }, [totalItems, itemsPerPage, currentPage]);

  const handleSetCurrentPage = useCallback(
    (page: number) => {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const clampedPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clampedPage);
    },
    [totalItems, itemsPerPage],
  );

  const handleSetItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalItems, itemsPerPage]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    setCurrentPage(totalPages);
  }, [totalItems, itemsPerPage]);

  const actions = useMemo(
    (): PaginationActions => ({
      setCurrentPage: handleSetCurrentPage,
      setItemsPerPage: handleSetItemsPerPage,
      nextPage,
      previousPage,
      goToFirstPage,
      goToLastPage,
    }),
    [
      handleSetCurrentPage,
      handleSetItemsPerPage,
      nextPage,
      previousPage,
      goToFirstPage,
      goToLastPage,
    ],
  );

  return {
    state: {
      currentPage,
      itemsPerPage,
      totalItems,
    },
    actions,
    info,
  };
}
