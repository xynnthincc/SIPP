"use client";

import { InputHTMLAttributes, forwardRef, MouseEvent } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, onClick, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    // Field tanggal/jam: klik di mana pun membuka picker native — bukan hanya
    // ikon kecil di kanan. Browser tanpa showPicker diabaikan (perilaku default).
    const klikBukaPicker = (e: MouseEvent<HTMLInputElement>) => {
      onClick?.(e);
      const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
      if (el.type === "date" || el.type === "time" || el.type === "datetime-local") {
        try {
          el.showPicker?.();
        } catch {
          /* terlarang/tak didukung — biarkan perilaku default */
        }
      }
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 text-sm glass-input placeholder:text-slate-400 ${
            error ? "input-error" : ""
          } ${className}`}
          onClick={klikBukaPicker}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
