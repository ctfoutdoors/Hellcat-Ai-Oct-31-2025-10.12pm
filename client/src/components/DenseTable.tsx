import { useDensity } from '@/contexts/DensityContext';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DenseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  selectedRows?: Set<string>;
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  getRowId?: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DenseTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  selectedRows,
  onSelectRow,
  onSelectAll,
  getRowId,
  emptyMessage = 'No data available',
  className,
}: DenseTableProps<T>) {
  const { density } = useDensity();

  const hasSelection = selectedRows !== undefined && onSelectRow !== undefined;
  const allSelected = hasSelection && data.length > 0 && data.every((item) => selectedRows.has(getRowId?.(item) || ''));

  // Density-specific row height
  const rowHeightClass = {
    compact: 'h-8',
    normal: 'h-10',
    detailed: 'h-13',
  }[density];

  // Density-specific padding
  const cellPaddingClass = {
    compact: 'px-2 py-1',
    normal: 'px-3 py-2',
    detailed: 'px-4 py-3',
  }[density];

  // Density-specific text size
  const textSizeClass = {
    compact: 'text-xs',
    normal: 'text-sm',
    detailed: 'text-base',
  }[density];

  return (
    <div className={cn('w-full overflow-auto rounded-lg border border-gray-300', className)}>
      <table className="dense-table w-full">
        <thead>
          <tr>
            {hasSelection && (
              <th className={cn('w-10', cellPaddingClass)}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  cellPaddingClass,
                  column.width,
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasSelection ? 1 : 0)}
                className={cn('text-center text-gray-500', cellPaddingClass, textSizeClass)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => {
              const rowId = getRowId?.(item) || String(idx);
              const isSelected = selectedRows?.has(rowId);

              return (
                <tr
                  key={rowId}
                  className={cn(
                    'table-row transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-blue-50'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {hasSelection && (
                    <td className={cn(cellPaddingClass)} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(rowId)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'table-cell',
                        cellPaddingClass,
                        textSizeClass,
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// Status Badge Component
export function StatusBadge({
  status,
  variant = 'default',
  size = 'normal',
}: {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  size?: 'compact' | 'normal' | 'detailed';
}) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    muted: 'badge-muted',
  };

  const sizeClasses = {
    compact: 'text-[10px] px-1.5 py-0.5',
    normal: 'text-xs px-2 py-1',
    detailed: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {status}
    </span>
  );
}

// Action Menu Component for table rows
export function TableActionMenu({
  actions,
}: {
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: 'default' | 'danger';
  }>;
}) {
  return (
    <div className="flex items-center gap-1">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 transition-colors',
            action.variant === 'danger' && 'hover:bg-red-50 text-red-600'
          )}
          title={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
