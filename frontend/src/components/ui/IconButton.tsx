import { ButtonHTMLAttributes } from "react";

type IconButtonVariant = "edit" | "delete" | "print" | "default";
type IconButtonIcon = "edit" | "trash" | "print";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconButtonIcon;
  variant?: IconButtonVariant;
  label: string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  edit: "text-slate-400 hover:text-amber-600 hover:bg-amber-50",
  delete: "text-slate-400 hover:text-red-600 hover:bg-red-50",
  print: "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
  default: "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
};

const iconPaths: Record<IconButtonIcon, string> = {
  edit: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  trash: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
  print: "M6.75 7.5V3h10.5v4.5m-12 6h13.5m-13.5 0A2.25 2.25 0 002.25 15.75v4.5A2.25 2.25 0 004.5 22.5h15a2.25 2.25 0 002.25-2.25v-4.5A2.25 2.25 0 0019.5 13.5m-15 0v-1.5a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25v1.5m-10.5 4.5h6",
};

export function IconButton({
  icon,
  variant = "default",
  label,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[icon]} />
      </svg>
    </button>
  );
}