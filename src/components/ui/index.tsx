import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Search, Filter, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'ghost';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-700',
  primary:  'bg-[#ECFDF5] text-[#148922]',
  success:  'bg-[#f0fdf4] text-[#50b00a]',
  warning:  'bg-amber-50 text-amber-700',
  danger:   'bg-red-50 text-red-700',
  info:     'bg-blue-50 text-blue-700',
  outline:  'bg-white text-gray-700 border border-gray-200',
  ghost:    'bg-transparent text-gray-500',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_STYLES[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, BadgeVariant> = {
  'Đang thực hiện': 'primary',
  'Đã hoàn thành':  'success',
  'Tạm dừng':       'warning',
  'Chờ duyệt':      'warning',
  'Draft':           'ghost',
  'Đang làm việc':  'success',
  'Đang nghỉ phép': 'warning',
  'Đã nghỉ việc':   'danger',
  'Pending':        'warning',
  'Approved':       'success',
  'Rejected':       'danger',
  'Đã ký':          'success',
  'Chờ ký':         'warning',
  'Hết hạn':        'danger',
  'Đã trả':         'success',
  'Chưa trả':       'warning',
  'Chờ xử lý':      'default',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const variant = STATUS_MAP[status] ?? 'default';
  return <Badge variant={variant} className={className}>{status}</Badge>;
}

// ─── KPICard ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
}

export function KPICard({ title, value, change, isPositive, icon: Icon, iconBg = '#ECFDF5', iconColor = '#148922', onClick }: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-[8px] flex items-center justify-center" style={{ background: iconBg }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
        {change && (
          <span className={`text-xs font-bold ${isPositive ? 'text-[#50b00a]' : 'text-red-500'}`}>
            {isPositive ? '▲' : '▼'} {change}
          </span>
        )}
      </div>
      <p className="text-[12px] text-[#718096] font-medium mb-1">{title}</p>
      <p className="text-[22px] font-bold text-[#1A202C] leading-tight">{value}</p>
    </div>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T, rowIndex: number) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({ columns, data, keyExtractor, emptyState, onRowClick, pageSize: initialPageSize = 10 }: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...data].sort((a: any, b: any) => {
    if (!sortKey) return 0;
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);
  const showPagination = data.length > 10;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [data.length]);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`px-4 py-3 text-left text-[11px] font-bold text-[#718096] uppercase tracking-wide whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-[#1A202C]' : ''}`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  {col.header}
                  {col.sortable && sortKey === String(col.key) && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  {emptyState ?? <EmptyState title="Không có dữ liệu" description="Chưa có bản ghi nào để hiển thị." />}
                </td>
              </tr>
            ) : paged.map((row, i) => (
              <tr
                key={keyExtractor(row, i)}
                className={`hover:bg-[#F8FAFC] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={String(col.key)} className="px-4 py-3 text-[#1A202C]">
                    {col.render ? col.render(row, i) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-[13px] text-[#718096]">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-[#E2E8F0] rounded-[6px] px-2 py-1 text-[13px] text-[#1A202C] focus:outline-none focus:border-[#148922]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>/ {data.length} bản ghi</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-[6px] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pg = i + 1;
              if (totalPages > 5 && page > 3) pg = page - 2 + i;
              if (pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-[6px] text-[13px] font-medium transition-colors ${
                    page === pg
                      ? 'bg-[#148922] text-white'
                      : 'hover:bg-[#F1F5F9] text-[#718096]'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-[6px] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  footer?: React.ReactNode;
}

const MODAL_SIZE: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-[95vw]',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-[12px] shadow-2xl w-full ${MODAL_SIZE[size]} slide-in-right`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-[16px] font-bold text-[#1A202C]">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-[8px] hover:bg-[#F1F5F9] text-[#718096] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  width?: string;
}

export function Drawer({ isOpen, onClose, title, children, side = 'right', width = 'w-96' }: DrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute ${side === 'right' ? 'right-0 top-0 bottom-0' : 'left-0 top-0 bottom-0'} ${width} bg-white shadow-2xl transition-transform ${
          isOpen
            ? 'translate-x-0'
            : side === 'right'
            ? 'translate-x-full'
            : '-translate-x-full'
        }`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-[16px] font-bold text-[#1A202C]">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-[8px] hover:bg-[#F1F5F9] text-[#718096] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto h-full">{children}</div>
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

const CONFIRM_BTN: Record<string, string> = {
  danger:  'bg-[#EF4444] hover:bg-red-600',
  warning: 'bg-[#F59E0B] hover:bg-amber-600',
  primary: 'bg-[#148922] hover:bg-[#0f6b1b]',
};

export function ConfirmModal({ isOpen, onClose, onConfirm, title = 'Xác nhận', message, confirmText = 'Xác nhận', cancelText = 'Hủy', variant = 'danger' }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-[#E2E8F0] text-[14px] font-semibold text-[#4A5568] hover:bg-[#F8FAFC] transition-colors">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 rounded-[8px] text-[14px] font-semibold text-white transition-colors ${CONFIRM_BTN[variant]}`}>
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
        </div>
        <p className="text-[14px] text-[#4A5568] leading-relaxed pt-1.5">{message}</p>
      </div>
    </Modal>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  actions?: React.ReactNode;
}

export function FilterBar({ searchValue, onSearchChange, searchPlaceholder = 'Tìm kiếm...', filters = [], actions }: FilterBarProps) {
  const activeCount = filters.filter(f => f.value && f.value !== '').length + (searchValue ? 1 : 0);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] px-4 py-3 shadow-sm flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
        <input
          type="text"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[14px] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#148922]/20 focus:border-[#148922] transition-all"
        />
        {searchValue && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#4A5568]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {filters.map(f => (
        <div key={f.key} className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider whitespace-nowrap">{f.label}:</span>
          <select
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            className="bg-transparent text-[13px] font-semibold text-[#1A202C] focus:outline-none cursor-pointer border-0"
          >
            {f.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}

      {activeCount > 0 && (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#EF4444] text-white rounded-full text-[11px] font-bold">
          <Filter className="w-3 h-3" />
          {activeCount}
        </span>
      )}

      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: string;
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        {breadcrumb && <p className="text-[12px] text-[#718096] mb-1">{breadcrumb}</p>}
        <h1 className="text-[24px] font-bold text-[#1A202C]">{title}</h1>
        {description && <p className="text-[14px] text-[#718096] mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title = 'Không có dữ liệu', description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-full flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[#A0AEC0]" />
        </div>
      )}
      <p className="text-[16px] font-semibold text-[#1A202C] mb-1">{title}</p>
      {description && <p className="text-[14px] text-[#718096] max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#E2E8F0] animate-pulse rounded-[8px] ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#F1F5F9]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Toast Helpers ────────────────────────────────────────────────────────────

export const showToast = {
  success: (msg: string) => toast.success(msg, {
    style: { background: '#fff', color: '#1A202C', border: '1px solid #E2E8F0', borderRadius: '10px' },
    iconTheme: { primary: '#148922', secondary: '#fff' },
  }),
  error: (msg: string) => toast.error(msg, {
    style: { background: '#fff', color: '#1A202C', border: '1px solid #E2E8F0', borderRadius: '10px' },
    iconTheme: { primary: '#EF4444', secondary: '#fff' },
  }),
  info: (msg: string) => toast(msg, {
    icon: 'ℹ️',
    style: { background: '#fff', color: '#1A202C', border: '1px solid #E2E8F0', borderRadius: '10px' },
  }),
};

// ─── Btn ──────────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

const BTN_STYLES: Record<BtnVariant, string> = {
  primary:   'bg-[#148922] text-white hover:bg-[#0f6b1b] shadow-sm shadow-[#148922]/20',
  secondary: 'bg-[#F8FAFC] text-[#1A202C] border border-[#E2E8F0] hover:bg-[#F1F5F9]',
  danger:    'bg-[#EF4444] text-white hover:bg-red-600',
  ghost:     'bg-transparent text-[#718096] hover:bg-[#F8FAFC]',
  outline:   'bg-white text-[#148922] border border-[#148922] hover:bg-[#ECFDF5]',
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
}

const BTN_SIZE: Record<string, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[14px]',
  lg: 'px-5 py-2.5 text-[14px]',
};

export function Btn({ variant = 'primary', size = 'md', icon: Icon, children, className = '', ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 font-semibold rounded-[8px] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES[variant]} ${BTN_SIZE[size]} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
}
