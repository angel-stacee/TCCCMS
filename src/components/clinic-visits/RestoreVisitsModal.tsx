import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { Modal, ConfirmationModal } from "../student-management/FieldsAndModals";
import { RotateCcw, Trash2, Search, AlertCircle, CheckCircle2, History } from "lucide-react";

interface RestoreVisitsModalProps {
    open: boolean;
    onClose: () => void;
    onRestored: () => void;
}

export function RestoreVisitsModal({
    open,
    onClose,
    onRestored,
}: RestoreVisitsModalProps) {
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [visits, setVisits] = useState<any[]>([]);

    const fetchTrashed = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/clinic-visits/trashed", { params: { search } });
            setVisits(res.data?.data || []);
        } catch (err: any) {
            console.error("Failed to load deleted visits:", err);
            setFeedback({ message: "Unable to load deleted records.", type: "error" });
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
            await api.post(`/clinic-visits/${id}/restore`);
            setFeedback({ message: "Visit successfully restored!", type: "success" });
            await fetchTrashed();
            onRestored();
        } catch (err: any) {
            console.error("Failed to restore clinic visit:", err);
            setFeedback({
                message: err?.response?.data?.message || "Failed to restore clinic visit.",
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
            await api.delete(`/clinic-visits/${id}/force`);
            setFeedback({ message: "Visit permanently deleted.", type: "success" });
            setConfirmDeleteId(null);
            await fetchTrashed();
        } catch (err: any) {
            console.error("Failed to permanently delete visit:", err);
            setFeedback({
                message: err?.response?.data?.message || "Failed to delete record.",
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

    const getPatientInfo = (visit: any) => {
        if (visit.student) {
            return {
                name: `${visit.student.first_name || ""} ${visit.student.last_name || ""}`.trim() || "Student",
                id: visit.student.student_id,
                type: "Student",
                extra: visit.student.course,
            };
        }
        if (visit.faculty) {
            return {
                name: `${visit.faculty.first_name || ""} ${visit.faculty.last_name || ""}`.trim() || "Faculty",
                id: visit.faculty.employee_id,
                type: "Faculty",
                extra: visit.faculty.department,
            };
        }
        if (visit.staff) {
            return {
                name: `${visit.staff.first_name || ""} ${visit.staff.last_name || ""}`.trim() || "Staff",
                id: visit.staff.staff_id,
                type: "Staff",
                extra: visit.staff.department,
            };
        }
        return {
            name: "Unknown Patient",
            id: "-",
            type: "Patient",
            extra: "",
        };
    };

    return (
        <Modal
            title="Restore Deleted Clinic Visits"
            onClose={onClose}
            maxWidth="max-w-3xl"
        >
            <div className="p-4 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-[#766959] dark:text-[#c4b5a5]">
                    View and restore clinic visit records that were deleted. Restoring a visit with dispensed medicine will also update medicine inventory accordingly.
                </p>

                {feedback && (
                    <div
                        className={`flex items-center gap-2 rounded-xl p-3 text-xs sm:text-sm font-medium ${
                            feedback.type === "success"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border border-red-200 bg-red-50 text-red-800"
                        }`}
                    >
                        {feedback.type === "success" ? (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle size={16} className="text-red-600 shrink-0" />
                        )}
                        <span>{feedback.message}</span>
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search deleted visits by patient name, reason, medicine..."
                        className="w-full rounded-xl border border-[#e8dfd4] bg-white py-2 pl-9 pr-4 text-xs sm:text-sm text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#211c17] dark:text-stone-100"
                    />
                </div>

                {/* Records List */}
                <div className="max-h-80 overflow-y-auto space-y-2.5 divide-y divide-[#eee7de] pr-1 dark:divide-[#382f25]">
                    {loading ? (
                        <div className="py-10 text-center text-xs text-stone-500">
                            Loading deleted visits...
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="py-10 text-center text-stone-500">
                            <History size={32} className="mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                            <p className="text-xs sm:text-sm font-semibold">No deleted clinic visits</p>
                            <p className="text-[11px] text-stone-400">Accidentally deleted visit records can be restored here anytime.</p>
                        </div>
                    ) : (
                        visits.map((visit) => {
                            const p = getPatientInfo(visit);

                            return (
                                <div
                                    key={visit.id}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2.5 first:pt-0"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-[#70091f] dark:text-[#f8a598]">
                                                {p.id}
                                            </span>
                                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                                {p.name}
                                            </h4>
                                            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                                {p.type}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-stone-500">
                                            <span>Visit: {formatDate(visit.visit_date)}</span>
                                            <span>Reason: <strong className="text-stone-700 dark:text-stone-300">{visit.reason || "Checkup"}</strong></span>
                                            {visit.medicine?.medicine_name && (
                                                <span>Med: {visit.medicine.medicine_name} ({visit.medicine_quantity || 1})</span>
                                            )}
                                            <span>Deleted: {formatDate(visit.deleted_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            disabled={restoringId === visit.id}
                                            onClick={() => handleRestore(visit.id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                        >
                                            <RotateCcw size={13} />
                                            <span>{restoringId === visit.id ? "Restoring..." : "Restore"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={deletingId === visit.id}
                                            onClick={() => setConfirmDeleteId(visit.id)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
                                            title="Delete permanently"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="border-t border-[#e8dfd4] pt-3 text-right dark:border-[#4e4234]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>

            {confirmDeleteId !== null && (
                <ConfirmationModal
                    open={confirmDeleteId !== null}
                    title="Permanently Delete Visit"
                    message="Are you sure you want to permanently delete this clinic visit? This action cannot be undone."
                    confirmText="Delete Permanently"
                    cancelText="Cancel"
                    danger={true}
                    loading={deletingId === confirmDeleteId}
                    onConfirm={() => handlePermanentDelete(confirmDeleteId)}
                    onClose={() => setConfirmDeleteId(null)}
                />
            )}
        </Modal>
    );
}

export default RestoreVisitsModal;
