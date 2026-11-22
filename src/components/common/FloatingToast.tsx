import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Trash2, Info, AlertTriangle, AlertCircle, X } from "lucide-react";

export interface FloatingToastProps {
    message: string;
    type?: "success" | "delete" | "info" | "error" | "warning";
    onClose: () => void;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function FloatingToast({
    message,
    type,
    onClose,
    duration = 5000,
    action,
}: FloatingToastProps) {
    useEffect(() => {
        if (!message) return undefined;

        const timeout = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timeout);
    }, [message, duration, onClose]);

    if (!message) return null;

    const isDelete = type === "delete" || (!type && message.toLowerCase().includes("delete"));
    const isError = type === "error" || (!type && (message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")));
    const isWarning = type === "warning" || (!type && !isError && (message.toLowerCase().includes("please") || message.toLowerCase().includes("not enough")));
    const isInfo = type === "info";

    const badgeBorder = isDelete
        ? "border-rose-200 shadow-rose-950/15"
        : isError
        ? "border-red-200 shadow-red-950/15"
        : isWarning
        ? "border-amber-200 shadow-amber-950/15"
        : isInfo
        ? "border-blue-200 shadow-blue-950/15"
        : "border-emerald-200 shadow-emerald-950/15";

    const IconComponent = isDelete
        ? Trash2
        : isError
        ? AlertCircle
        : isWarning
        ? AlertTriangle
        : isInfo
        ? Info
        : CheckCircle2;

    const iconColor = isDelete
        ? "text-rose-600"
        : isError
        ? "text-red-600"
        : isWarning
        ? "text-amber-600"
        : isInfo
        ? "text-blue-600"
        : "text-emerald-600";

    const toastNode = (
        <div
            role="status"
            aria-live="polite"
            className={`fixed right-5 top-5 z-[100000] flex max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${badgeBorder}`}
        >
            <IconComponent
                size={20}
                className={`mt-0.5 shrink-0 ${iconColor}`}
                aria-hidden="true"
            />
            <p className="pr-2 text-sm font-medium text-[#302820]">
                {message}
            </p>
            {action && (
                <button
                    type="button"
                    onClick={() => {
                        action.onClick();
                        onClose();
                    }}
                    className="shrink-0 rounded-lg bg-[#70091f] px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-[#8b1505] cursor-pointer"
                >
                    {action.label}
                </button>
            )}
            <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 rounded-md p-1 text-[#887d70] transition hover:bg-[#fcfaf6] hover:text-[#302820] cursor-pointer"
            >
                <X size={16} aria-hidden="true" />
            </button>
        </div>
    );

    if (typeof document !== "undefined") {
        return createPortal(toastNode, document.body);
    }
    return toastNode;
}

export default FloatingToast;
