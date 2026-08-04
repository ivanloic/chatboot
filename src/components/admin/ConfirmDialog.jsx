import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  destructive = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              destructive ? "bg-red-50 text-red-500" : "bg-copper-50 text-copper-600"
            }`}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
            <p className="mt-1 text-sm text-ink-700/70">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-black/10 px-3.5 py-2 text-sm font-medium text-ink-700/70 transition hover:bg-black/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium text-white transition ${
              destructive ? "bg-red-500 hover:bg-red-600" : "bg-ink-900 hover:bg-ink-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
