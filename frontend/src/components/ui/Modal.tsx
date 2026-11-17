"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
}

const maxWidthMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  closeOnOverlayClick = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="region" aria-label="Modal container">
      {/* Fullscreen Backdrop Blur */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity modal-overlay-enter cursor-pointer"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Viewport Centering Container (always centered relative to browser window) */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        {/* Dialog Card */}
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full ${maxWidthMap[maxWidth]} bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-slate-950/25 border border-slate-200/80 text-left flex flex-col my-8 modal-dialog-enter overflow-hidden`}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs sm:text-[13px] text-slate-500 mt-1 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="shrink-0 p-1.5 -mt-1 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Body (smooth scrollable) */}
          <div className="px-6 py-5 overflow-y-auto flex-1 max-h-[75vh]">{children}</div>

          {/* Footer (sticky bottom) */}
          {footer && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, loading]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="region" aria-label="Konfirmasi Aksi">
      {/* Fullscreen Backdrop Blur */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity modal-overlay-enter cursor-pointer"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Viewport Centering Container (screen-centered) */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        {/* Dialog Card */}
        <div
          role="alertdialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-950/25 border border-slate-200/80 text-left my-8 modal-dialog-enter overflow-hidden p-6 sm:p-7"
        >
          {/* Close button */}
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Tutup"
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-4 sm:gap-5">
            {/* Warning / Danger Icon Badge */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                variant === "danger"
                  ? "bg-gradient-to-br from-red-50 to-rose-100 border-red-200 text-red-600 shadow-inner shadow-red-500/10"
                  : "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 text-amber-600 shadow-inner"
              }`}
            >
              {variant === "danger" ? (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008z" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.75} />
                </svg>
              )}
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                {message}
              </p>
            </div>
          </div>

          {/* Destructive Warning Callout */}
          {variant === "danger" && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-50/70 border border-rose-100/90 flex items-start gap-2.5 text-xs text-rose-700">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="leading-relaxed">
                Tindakan ini permanen. Data yang dihapus tidak dapat dipulihkan kembali.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                variant === "danger"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 shadow-red-500/25"
                  : "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:from-amber-700 active:to-yellow-700 shadow-amber-500/25"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  {variant === "danger" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}