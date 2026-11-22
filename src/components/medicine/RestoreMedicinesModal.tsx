import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { Modal, ConfirmationModal } from "../student-management/FieldsAndModals";
import { RotateCcw, Trash2, Search, AlertCircle, CheckCircle2, Package, Pill } from "lucide-react";

interface RestoreMedicinesModalProps {
    open: boolean;
    onClose: () => void;
    onRestored: () => void;
}

export function RestoreMedicinesModal({
    open,
    onClose,
    onRestored,
}: RestoreMedicinesModalProps) {
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [search, setSearch] = useState("");
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [medicines, setMedicines] = useState<any[]>([]);

    const fetchTrashed = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/medicines/trashed", { params: { search } });
            setMedicines(res.data?.data || []);
        } catch (err: any) {
            console.error("Failed to load deleted medicines:", err);
            setFeedback({ message: "Unable to load deleted medicine records.", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (open) {
            fetchTrashed();
        }
    }, [open, fetchTrashed]);

    const handleRestore = async (id: number) => {
        setRestoringId(id);
        setFeedback(null);
        try {
            await api.post(`/medicines/${id}/restore`);
            setFeedback({ message: "Medicine successfully restored to inventory!", type: "success" });
            await fetchTrashed();
            onRestored();
        } catch (err: any) {
            console.error("Failed to restore medicine:", err);
            setFeedback({
                message: err?.response?.data?.message || "Failed to restore medicine.",
                type: "error",
            });
        } finally {
            setRestoringId(null);
        }
    };

    const handlePermanentDelete = async (id: number) => {
        setDeletingId(id);
        setFeedback(null);
        try {
            await api.delete(`/medicines/${id}/force`);
            setFeedback({ message: "Medicine permanently deleted from the database.", type: "success" });
            setConfirmDeleteTarget(null);
            await fetchTrashed();
        } catch (err: any) {
            console.error("Failed to permanently delete medicine:", err);
            setFeedback({
                message: err?.response?.data?.message || "Failed to delete medicine record.",
                type: "error",
            });
        } finally {
            setDeletingId(null);
        }
    };

    if (!open) return null;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <Modal
            title="Restore Deleted Medicines"
            onClose={onClose}
            maxWidth="max-w-3xl"
        >
            <div className="p-4 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-[#766959] dark:text-[#c4b5a5]">
                    View and restore medicine inventory items that were previously deleted. Restoring an item returns it to active stock tracking.
                </p>

                {feedback && (
                    <div
                        className={`flex items-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-medium ${
                            feedback.type === "success"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                        }`}
                    >
                        {feedback.type === "success" ? (
                            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                        )}
                        <span>{feedback.message}</span>
                    </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search deleted medicines by name, treatment type, or unit..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/60 dark:bg-[#1f1914] dark:border-stone-800 pl-9 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#70091f]/20 focus:border-[#70091f]"
                    />
                </div>

                {/* List Container */}
                <div className="max-h-[380px] overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800/60">
                    {loading ? (
                        <div className="p-8 text-center text-xs sm:text-sm text-stone-500">
                            Loading deleted medicines...
                        </div>
                    ) : medicines.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 mb-2">
                                <Package size={22} />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300">
                                No Deleted Medicines
                            </p>
                            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                                Trashed medicines will appear here and can be restored anytime.
                            </p>
                        </div>
                    ) : (
                        medicines.map((med) => {
                            const isRestoring = restoringId === med.id;
                            const isDeleting = deletingId === med.id;

                            return (
                                <div
                                    key={med.id}
                                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/20 dark:text-red-300 mt-0.5">
                                            <Pill size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                                                    {med.medicine_name}
                                                </h4>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                                    {med.treatment_type || "Medication"}
                                                </span>
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                                                <span>
                                                    Stock: <strong className="text-stone-700 dark:text-stone-200">{med.stock ?? 0} {med.unit || "unit"}</strong>
                                                </span>
                                                {med.expiration_date && (
                                                    <span>
                                                        Exp: <strong className="text-stone-700 dark:text-stone-200">{formatDate(med.expiration_date)}</strong>
                                                    </span>
                                                )}
                                                <span>
                                                    Deleted: <strong className="text-stone-700 dark:text-stone-200">{formatDate(med.deleted_at)}</strong>
                                                </span>
                                            </div>
                                            {med.description && (
                                                <p className="mt-0.5 text-[11px] text-stone-400 line-clamp-1">
                                                    {med.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        <button
                                            type="button"
                                            disabled={isRestoring || isDeleting}
                                            onClick={() => handleRestore(med.id)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer disabled:opacity-50"
                                            title="Restore this medicine to active inventory"
                                        >
                                            <RotateCcw size={13} className={isRestoring ? "animate-spin" : ""} />
                                            <span>{isRestoring ? "Restoring..." : "Restore"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isRestoring || isDeleting}
                                            onClick={() => setConfirmDeleteTarget({ id: med.id, name: med.medicine_name })}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-stone-900 dark:text-red-400 cursor-pointer disabled:opacity-50"
                                            title="Permanently remove from database"
                                        >
                                            <Trash2 size={13} />
                                            <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-stone-200 dark:border-stone-800 px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>

            {confirmDeleteTarget && (
                <ConfirmationModal
                    open={Boolean(confirmDeleteTarget)}
                    title="Permanently Delete Medicine"
                    message={`Are you sure you want to permanently delete "${confirmDeleteTarget.name}"? This action cannot be undone.`}
                    confirmText="Delete Permanently"
                    cancelText="Cancel"
                    danger={true}
                    loading={deletingId === confirmDeleteTarget.id}
                    onConfirm={() => handlePermanentDelete(confirmDeleteTarget.id)}
                    onClose={() => setConfirmDeleteTarget(null)}
                />
            )}
        </Modal>
    );
}
