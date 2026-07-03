import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: typeof Inbox;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  emptyIcon: EmptyIcon = Inbox,
  rowKey,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#005FB8]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div
                        className="h-4 bg-neutral-100 rounded animate-pulse"
                        style={{ width: `${60 + (i * 7) % 30}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                      <EmptyIcon className="w-7 h-7 text-neutral-400" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-600">{emptyMessage}</p>
                    <p className="text-xs text-neutral-400 mt-1">Les données apparaîtront ici une fois disponibles</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : 'hover:bg-neutral-50/80'}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 text-sm text-neutral-700 ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
          <p className="text-xs text-neutral-500">
            Affichage{' '}
            <span className="font-semibold text-neutral-700">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>
            {' '}–{' '}
            <span className="font-semibold text-neutral-700">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>
            {' '}sur{' '}
            <span className="font-semibold text-neutral-700">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-primary-50 hover:text-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-neutral-700 px-2">
              {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-primary-50 hover:text-primary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
