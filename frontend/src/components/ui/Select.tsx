"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────
   Context
───────────────────────────────────────────── */
interface SelectCtx {
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  setOpen: (b: boolean) => void;
  disabled?: boolean;
  labelMap: React.MutableRefObject<Map<string, string>>;
}

const Ctx = createContext<SelectCtx | null>(null);
function useSelectCtx() {
  const c = useContext(Ctx);
  if (!c) throw new Error("SelectOption must be inside Select");
  return c;
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface SelectProps {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  /** children: <option> elements */
  children: React.ReactNode;
}

/* ─────────────────────────────────────────────
   Helpers – parse <option> children
───────────────────────────────────────────── */
function parseOptions(children: React.ReactNode): { value: string; label: string; disabled?: boolean }[] {
  const opts: { value: string; label: string; disabled?: boolean }[] = [];
  const traverse = (node: React.ReactNode) => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(traverse); return; }
    const el = node as React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>;
    if (el?.type === "option") {
      opts.push({
        value: String(el.props.value ?? ""),
        label: String(el.props.children ?? ""),
        disabled: el.props.disabled,
      });
    }
  };
  traverse(children);
  return opts;
}

/* ─────────────────────────────────────────────
   Select – main wrapper (API-compatible with <select>)
───────────────────────────────────────────── */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ label, error, placeholder, children, className = "", id, value: valueProp, onChange, disabled, name }, ref) => {
    const value = String(valueProp ?? "");
    const uid = useId();
    const selectId = id || uid;

    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const labelMap = useRef(new Map<string, string>());

    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    useEffect(() => { setMounted(true); }, []);

    // Parse options once to build labelMap + options list
    const options = parseOptions(children);
    options.forEach(o => labelMap.current.set(o.value, o.label));

    const selectedLabel = labelMap.current.get(value) ?? value;
    const hasValue = value !== "" && value !== undefined && value !== null;

    // Position dropdown
    const positionMenu = useCallback(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuH = Math.min(options.length * 44, 280);
      const openUpward = spaceBelow < menuH + 8 && spaceAbove > spaceBelow;
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        zIndex: 9999,
      });
    }, [options.length]);

    const handleOpen = () => {
      if (disabled) return;
      positionMenu();
      setOpen(true);
    };

    // Simulate native onChange
    const handleChange = useCallback((v: string) => {
      const fakeEvent = {
        target: { value: v, name: name ?? "" },
        currentTarget: { value: v, name: name ?? "" },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(fakeEvent);
      setOpen(false);
    }, [onChange, name]);

    // Close on click outside / Escape
    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      const handleClick = (e: MouseEvent) => {
        if (
          !triggerRef.current?.contains(e.target as Node) &&
          !menuRef.current?.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClick);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClick);
      };
    }, [open]);

    const ctxValue: SelectCtx = { value, onChange: handleChange, open, setOpen, disabled, labelMap };

    return (
      <Ctx.Provider value={ctxValue}>
        <div className={`space-y-1.5 ${className}`}>
          {label && (
            <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
              {label}
            </label>
          )}

          {/* Trigger button */}
          <button
            ref={(node) => {
              (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            type="button"
            id={selectId}
            disabled={disabled}
            onClick={handleOpen}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={[
              "w-full flex items-center justify-between gap-2",
              "px-3.5 py-2.5 text-sm rounded-xl border transition-all duration-150",
              "bg-white/75 backdrop-blur-sm",
              open
                ? "border-emerald-500 ring-3 ring-emerald-500/20 shadow-sm"
                : error
                ? "border-red-400 ring-3 ring-red-400/15"
                : "border-slate-300 hover:border-slate-400",
              disabled
                ? "opacity-50 cursor-not-allowed bg-slate-50/80"
                : "cursor-pointer",
              !hasValue ? "text-slate-400" : "text-slate-800",
            ].join(" ")}
          >
            <span className="truncate">
              {hasValue ? selectedLabel : (placeholder ?? "Pilih…")}
            </span>
            {/* Chevron */}
            <svg
              className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Dropdown menu – rendered in portal */}
          {mounted && open && createPortal(
            <div
              ref={menuRef}
              role="listbox"
              style={menuStyle}
              className={[
                "overflow-hidden rounded-2xl",
                "bg-white/95 backdrop-blur-xl",
                "border border-slate-200/80",
                "shadow-xl shadow-slate-900/15",
                "select-dropdown-enter",
              ].join(" ")}
            >
              <div className="overflow-y-auto max-h-[280px] p-1.5">
                {options.map((opt) => (
                  <SelectOptionItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </SelectOptionItem>
                ))}
                {options.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-slate-400">
                    Tidak ada pilihan
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      </Ctx.Provider>
    );
  }
);

Select.displayName = "Select";

/* ─────────────────────────────────────────────
   SelectOptionItem (internal)
───────────────────────────────────────────── */
function SelectOptionItem({
  value,
  children,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const ctx = useSelectCtx();
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && ctx.onChange(value)}
      className={[
        "w-full flex items-center justify-between gap-3",
        "px-3 py-2.5 rounded-xl text-sm text-left transition-colors duration-100",
        "cursor-pointer",
        isActive
          ? "bg-emerald-500/10 text-emerald-800 font-semibold"
          : disabled
          ? "text-slate-300 cursor-not-allowed"
          : "text-slate-700 hover:bg-slate-50 active:bg-slate-100",
      ].join(" ")}
    >
      <span>{children}</span>
      {isActive && (
        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </button>
  );
}
