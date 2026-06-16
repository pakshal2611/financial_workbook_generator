import { CheckCircle, XCircle, Info, X } from "lucide-react";
import type { ToastMessage } from "../../types";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLOR_MAP = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500",
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = ICON_MAP[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg animate-in slide-in-from-right-5 dark:border-gray-700 dark:bg-gray-900"
            style={{ animation: "slideIn 0.2s ease-out" }}
          >
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${COLOR_MAP[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
