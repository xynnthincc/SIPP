import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`glass-card p-5 ${hover ? "hover:scale-[1.01] hover:shadow-xl" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-slate-200/50 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-semibold text-slate-800 ${className}`}>
      {children}
    </h3>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = "emerald",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: "emerald" | "blue" | "amber" | "red" | "purple";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    red: "bg-red-500/10 text-red-600",
    purple: "bg-purple-500/10 text-purple-600",
  };

  return (
    <div className="glass-card p-5 flex items-start gap-4">
      {icon && (
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
      )}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
