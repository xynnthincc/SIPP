import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin] ${className}`}>
      <table className="w-full text-sm min-w-[600px] sm:min-w-[640px]">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-200/60 bg-slate-50/40">{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`text-left px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm text-slate-700 align-middle ${className}`}>{children}</td>
  );
}

export function TableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={`hover:bg-white/40 transition-colors ${className}`}>
      {children}
    </tr>
  );
}
