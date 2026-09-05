import React from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';

// Loading Spinner
export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

// Page Header
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

// Stat Card
export function StatCard({ label, value, icon, color = 'orange', change }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string; change?: string;
}) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50/80 border-orange-200/80 text-orange-600',
    blue: 'bg-sky-50/80 border-sky-200/80 text-sky-600',
    green: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-600',
    purple: 'bg-purple-50/80 border-purple-200/80 text-purple-600',
    red: 'bg-red-50/80 border-red-200/80 text-red-600',
  };
  return (
    <div className={`rounded-2xl border p-5 bg-white shadow-sm hover:shadow-md transition-all ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
          {change && <p className="text-xs mt-1 text-slate-500">{change}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100">{icon}</div>
      </div>
    </div>
  );
}

// Badge
export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) {
  const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

// Table
export function Table({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/80">
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-12 text-slate-400">
                No records found
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:bg-slate-50/80' : ''} transition-colors`}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 text-slate-700 ${className}`}>{children}</td>;
}

// Button
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const variants = {
    primary: 'bg-[#FF5E1E] hover:bg-[#E0480C] text-white shadow-md shadow-orange-500/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    ghost: 'hover:bg-slate-100 text-slate-700',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-base' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-bold transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// Input
export function Input({
  label,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">{label}</label>}
      <input
        {...props}
        className={`w-full bg-white border ${
          error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
        } rounded-xl px-3.5 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E] transition-colors ${
          props.className || ''
        }`}
      />
      {error ? (
        <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 mt-0.5">
          <span>⚠️</span> {error}
        </p>
      ) : hint ? (
        <p className="text-slate-400 text-[11px] font-medium leading-tight mt-0.5">{hint}</p>
      ) : null}
    </div>
  );
}

// Select
export function Select({ label, children, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">{label}</label>}
      <select
        {...props}
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E] transition-colors ${props.className || ''}`}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

// Modal
export function Modal({ title, children, onClose, open, maxWidth = 'max-w-lg' }: { title: string; children: React.ReactNode; onClose: () => void; open: boolean; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white border border-slate-200 rounded-3xl w-full ${maxWidth} shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-slate-900 font-extrabold text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Card
export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// Error Alert
export function Alert({ message, variant = 'error' }: { message: string; variant?: 'error' | 'success' | 'warning' }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${styles[variant]}`}>
      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
      {message}
    </div>
  );
}

// Loading page
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-8 h-8 text-[#FF5E1E]" />
    </div>
  );
}

// Status badge helpers
export function ContractStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'success', DRAFT: 'warning', EXPIRED: 'danger', CANCELLED: 'danger'
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
}

export function LeaveStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'warning', APPROVED: 'success', REFUSED: 'danger', CANCELLED: 'default'
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
}

export function PayrunStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'default', COMPUTED: 'info', VALIDATED: 'purple', PAID: 'success'
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
}

export function EmployeeStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'success', INACTIVE: 'default', ON_LEAVE: 'warning', TERMINATED: 'danger'
  };
  return <Badge variant={map[status] || 'default'}>{status}</Badge>;
}
