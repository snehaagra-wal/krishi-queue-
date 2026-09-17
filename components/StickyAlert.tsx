"use client";

import React from "react";
import { AlertCircle, X, ArrowRight } from "lucide-react";

interface StickyAlertProps {
  message: string | null;
  onClose: () => void;
  actionText?: string;
  onAction?: () => void;
  type?: "error" | "warning" | "success";
}

/**
 * StickyAlert: Viewport-locked floating alert banner.
 * Stays permanently pinned at the top-center of the screen (z-index 9999)
 * so users never miss validation or submission errors even on long scrollable pages.
 */
export default function StickyAlert({
  message,
  onClose,
  actionText,
  onAction,
  type = "error",
}: StickyAlertProps) {
  if (!message) return null;

  const typeStyles = {
    error: {
      bg: "bg-rose-700/95",
      border: "border-rose-800",
      shadow: "shadow-2xl shadow-rose-950/30",
      iconColor: "text-rose-200",
      btnHover: "hover:bg-rose-800/80",
    },
    warning: {
      bg: "bg-amber-600/95",
      border: "border-amber-700",
      shadow: "shadow-2xl shadow-amber-950/30",
      iconColor: "text-amber-100",
      btnHover: "hover:bg-amber-700/80",
    },
    success: {
      bg: "bg-emerald-700/95",
      border: "border-emerald-800",
      shadow: "shadow-2xl shadow-emerald-950/30",
      iconColor: "text-emerald-200",
      btnHover: "hover:bg-emerald-800/80",
    },
  }[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[92%] animate-in slide-in-from-top-4 fade-in duration-200"
    >
      <div
        className={`p-3.5 sm:p-4 ${typeStyles.bg} backdrop-blur-md text-white rounded-2xl ${typeStyles.border} border ${typeStyles.shadow} flex items-start justify-between gap-3`}
      >
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="p-1 rounded-lg bg-white/15 shrink-0 mt-0.5">
            <AlertCircle className={`w-4 h-4 ${typeStyles.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs sm:text-sm font-bold block leading-snug break-words">
              {message}
            </span>
            {actionText && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="mt-2 px-3 py-1 bg-white text-zinc-900 font-bold rounded-full text-xs shadow-xs hover:bg-zinc-100 transition cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
              >
                <span>{actionText}</span>
                <ArrowRight className="w-3 h-3 text-zinc-900" />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`text-white/80 hover:text-white p-1 rounded-lg ${typeStyles.btnHover} transition cursor-pointer shrink-0 ml-1`}
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
