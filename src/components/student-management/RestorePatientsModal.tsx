import React, { useState, useEffect, useCallback } from "react";
import { Modal, ConfirmationModal } from "./FieldsAndModals";
import api from "../../services/api";
import { RotateCcw, Trash2, Search, AlertCircle, CheckCircle2, UserX } from "lucide-react";

interface RestorePatientsModalProps {
    open: boolean;
    onClose: () => void;
    onRestored: () => void;
}

export function RestorePatientsModal({
    open,
    onClose,
    onRestored,
}: RestorePatientsModalProps) {
    const [activeTab, setActiveTab] = useState<"students" | "staff" | "faculty">("students");
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: number; name: string; type: "student" | "staff" | "faculty" } | null>(null);
    const [search, setSearch] = useState("");
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [students, setStudents] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);

    const fetchTrashed = useCallback(async () => {
        setLoading(true);
        try {
            const [studentsRes, staffRes, facultyRes] = await Promise.all([
                api.get("/students/trashed", { params: { search } }),
                api.get("/staff/trashed", { params: { search } }),
                api.get("/faculties/trashed", { params: { search } }),
            ]);

            setStudents(studentsRes.data?.data || []);
            setStaffList(staffRes.data?.data || []);
            setFaculties(facultyRes.data?.data || []);
        } catch (err: any) {
            console.error("Failed to load deleted patients:", err);
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

    const handleRestore = async (id: number, type: "student" | "staff" | "faculty") => {
        setRestoringId(id);
        setFeedback(null);
        try {
            const endpoint =
                type === "student"
                    ? `/students/${id}/restore`
                    : type === "staff"
                    ? `/staff/${id}/restore`
                    : `/faculties/${id}/restore`;

            await api.post(endpoint);
            setFeedback({ message: "Record successfully restored!", type: "success" });
            await fetchTrashed();
            onRestored();
        } catch (err: any) {
            console.error("Failed to restore record:", err);
            setFeedback({
                message: err?.response?.data?.message || "Failed to restore record.",
                type: "error",
            });
        } finally {
            setRestoringId(null);
        }
    };

    const handlePermanentDelete = async (id: number, type: "student" | "staff" | "faculty") => {
        setDeletingId(id);
        setFeedback(null);
        try {
            const endpoint =
                type === "student"
                    ? `/students/${id}/force`
                    : type === "staff"
                    ? `/staff/${id}/force`
                    : `/faculties/${id}/force`;

            await api.delete(endpoint);
            setFeedback({ message: "Record permanently deleted.", type: "success" });
            setConfirmDeleteTarget(null);
            await fetchTrashed();
        } catch (err: any) {
            console.error("Failed to permanently delete record:", err);
            setFeedback({
                message: err?.response?.data?.message || "Failed to delete record.",
                type: "error",
            });
        } finally {
            setDeletingId(null);
        }
    };

    if (!open) return null;

    const currentList =
        activeTab === "students"
            ? students
            : activeTab === "staff"
            ? staffList
            : faculties;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <Modal
            title="Restore Deleted Patients"
            onClose={onClose}
            maxWidth="max-w-3xl"
        >
            <div className="p-4 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-[#766959] dark:text-[#c4b5a5]">
                    View and restore patient records that were previously deleted.
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

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-[#e8dfd4] pb-3 dark:border-[#4e4234]">
                    <button
                        type="button"
                        onClick={() => setActiveTab("students")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            activeTab === "students"
                                ? "bg-[#70091f] text-white shadow-xs"
                                : "bg-[#f3ebdf] text-[#6d5942] hover:bg-[#e8dfd4] dark:bg-[#382f25] dark:text-[#e5dcd1]"
                        }`}
                    >
                        Students ({students.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("staff")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            activeTab === "staff"
                                ? "bg-[#70091f] text-white shadow-xs"
                                : "bg-[#f3ebdf] text-[#6d5942] hover:bg-[#e8dfd4] dark:bg-[#382f25] dark:text-[#e5dcd1]"
                        }`}
                    >
                        Staff ({staffList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("faculty")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            activeTab === "faculty"
                                ? "bg-[#70091f] text-white shadow-xs"
                                : "bg-[#f3ebdf] text-[#6d5942] hover:bg-[#e8dfd4] dark:bg-[#382f25] dark:text-[#e5dcd1]"
                        }`}
                    >
                        Faculty ({faculties.length})
                    </button>
                </div>

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
                        placeholder="Search deleted records by name, ID, or course..."
                        className="w-full rounded-xl border border-[#e8dfd4] bg-white py-2 pl-9 pr-4 text-xs sm:text-sm text-stone-900 outline-none transition focus:border-[#70091f] focus:ring-2 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#211c17] dark:text-stone-100"
                    />
                </div>

                {/* Records List */}
                <div className="max-h-80 overflow-y-auto space-y-2.5 divide-y divide-[#eee7de] pr-1 dark:divide-[#382f25]">
                    {loading ? (
                        <div className="py-10 text-center text-xs text-stone-500">
                            Loading deleted records...
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="py-10 text-center text-stone-500">
                            <UserX size={32} className="mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                            <p className="text-xs sm:text-sm font-semibold">No deleted {activeTab} found</p>
                            <p className="text-[11px] text-stone-400">Records deleted will appear here and can be restored.</p>
                        </div>
                    ) : (
                        currentList.map((item) => {
                            const name = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown";
                            const idLabel =
                                activeTab === "students"
                                    ? item.student_id
                                    : activeTab === "staff"
                                    ? item.staff_id
                                    : item.employee_id;
                            const typeSingle =
                                activeTab === "students"
                                    ? "student"
                                    : activeTab === "staff"
                                    ? "staff"
                                    : "faculty";

                            return (
                                <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2.5 first:pt-0"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-[#70091f] dark:text-[#f8a598]">
                                                {idLabel || "No ID"}
                                            </span>
                                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                                {name}
                                            </h4>
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-stone-500">
                                            {item.course && <span>Course: {item.course}</span>}
                                            {item.department && <span>Dept: {item.department}</span>}
                                            {item.position && <span>Position: {item.position}</span>}
                                            <span>Deleted: {formatDate(item.deleted_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            disabled={restoringId === item.id}
                                            onClick={() => handleRestore(item.id, typeSingle)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                        >
                                            <RotateCcw size={13} />
                                            <span>{restoringId === item.id ? "Restoring..." : "Restore"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={deletingId === item.id}
                                            onClick={() => setConfirmDeleteTarget({ id: item.id, name, type: typeSingle })}
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

            {confirmDeleteTarget && (
                <ConfirmationModal
                    open={Boolean(confirmDeleteTarget)}
                    title={`Permanently Delete ${confirmDeleteTarget.type === "faculty" ? "Faculty" : confirmDeleteTarget.type === "staff" ? "Staff" : "Student"}`}
                    message={`Are you sure you want to permanently delete "${confirmDeleteTarget.name}"? This action cannot be undone.`}
                    confirmText="Delete Permanently"
                    cancelText="Cancel"
                    danger={true}
                    loading={deletingId === confirmDeleteTarget.id}
                    onConfirm={() => handlePermanentDelete(confirmDeleteTarget.id, confirmDeleteTarget.type)}
                    onClose={() => setConfirmDeleteTarget(null)}
                />
            )}
        </Modal>
    );
}

export default RestorePatientsModal;
