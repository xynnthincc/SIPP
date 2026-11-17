import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{description}</p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
