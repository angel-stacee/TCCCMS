import { useState, useEffect } from "react";
import {
    X,
    FileText,
    Send,
    AlertCircle,
    CheckCircle2,
    Package,
    Calendar,
    Flame,
    Download,
    Clock,
} from "lucide-react";
import api from "../../services/api";
import { addClinicNotification } from "../../services/notifications";

export interface RequisitionMedicine {
    id: number;
    medicine_name: string;
    treatment_type?: string;
    unit?: string;
    stock?: number;
    minimum_stock?: number;
    recommended_request_qty?: number;
}

interface MedicineRequisitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    medicine: RequisitionMedicine | null;
    allMedicines?: RequisitionMedicine[];
    onSuccess: (message: string) => void;
}

export function MedicineRequisitionModal({
    isOpen,
    onClose,
    medicine,
    allMedicines = [],
    onSuccess,
}: MedicineRequisitionModalProps) {
    const [selectedMedId, setSelectedMedId] = useState<number | string>("");
    const [quantity, setQuantity] = useState<number | string>(50);
    const [unit, setUnit] = useState("Tablet");
    const [priority, setPriority] = useState<"normal" | "urgent" | "critical">("normal");
    const [reason, setReason] = useState("Routine Stock Replenishment");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const activeMedicine =
        allMedicines.find((m) => String(m.id) === String(selectedMedId)) || medicine;

    useEffect(() => {
        if (medicine) {
            setSelectedMedId(medicine.id);
            setUnit(medicine.unit || "Tablet");
            setQuantity(medicine.recommended_request_qty || 50);
            if ((medicine.stock ?? 0) <= 0) {
                setPriority("urgent");
                setReason("Out of stock emergency replenishment");
            } else if ((medicine.stock ?? 0) <= (medicine.minimum_stock ?? 10)) {
                setPriority("urgent");
                setReason("Low stock alert replenishment");
            } else {
                setPriority("normal");
                setReason("Routine Stock Replenishment");
            }
        } else if (allMedicines.length > 0) {
            setSelectedMedId(allMedicines[0].id);
            setUnit(allMedicines[0].unit || "Tablet");
            setQuantity(50);
        }
        setError("");
    }, [medicine, allMedicines, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const parsedQty = parseInt(String(quantity), 10);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            setError("Please enter a valid requested quantity greater than 0.");
            return;
        }

        if (!selectedMedId) {
            setError("Please select a medicine to request.");
            return;
        }

        try {
            setSubmitting(true);
            const medName = activeMedicine?.medicine_name || "Medicine";

            await api.post("/medicines/requisitions", {
                medicine_id: Number(selectedMedId),
                quantity_requested: parsedQty,
                unit: unit || activeMedicine?.unit || "Tablet",
                priority,
                reason,
                remarks: remarks.trim() || undefined,
            });

            addClinicNotification({
                type: "add",
                title: "Medicine Requisition Submitted",
                description: `Requested ${parsedQty} ${unit} of ${medName} (${priority.toUpperCase()})`,
                category: "medicine",
            });

            onSuccess(`Requisition request for ${parsedQty} ${unit} of ${medName} submitted successfully.`);
            onClose();
        } catch (err: any) {
            console.error("Requisition submit error:", err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to submit requisition request. Please check inputs and try again.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="req-title"
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-2xl transition-all dark:border-[#382f25] dark:bg-[#1f1914]"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#e8dfd4] bg-[#fcfaf6] px-5 py-4 dark:border-[#382f25] dark:bg-[#251f19]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/20 dark:text-[#f8a598]">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2
                                id="req-title"
                                className="text-base font-bold text-stone-900 dark:text-[#f4ecdf]"
                            >
                                Medicine Requisition Request
                            </h2>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                Request stock replenishment from clinic procurement
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-stone-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p className="leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* Medicine Selection / Overview */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                            Medicine Name *
                        </label>
                        {allMedicines.length > 0 ? (
                            <select
                                value={selectedMedId}
                                onChange={(e) => {
                                    const nextId = e.target.value;
                                    setSelectedMedId(nextId);
                                    const m = allMedicines.find((x) => String(x.id) === String(nextId));
                                    if (m) {
                                        setUnit(m.unit || "Tablet");
                                        setQuantity(m.recommended_request_qty || 50);
                                    }
                                }}
                                className="w-full rounded-xl border border-[#ded4c9] bg-white px-3.5 py-2.5 text-xs text-stone-800 shadow-xs focus:border-[#70091f] focus:outline-hidden dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                            >
                                {allMedicines.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.medicine_name} ({m.treatment_type || "Medication"}) — In Stock: {m.stock ?? 0} {m.unit || "units"}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                disabled
                                value={activeMedicine?.medicine_name || ""}
                                className="w-full rounded-xl border border-[#ded4c9] bg-stone-100 px-3.5 py-2 text-xs text-stone-800 dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                            />
                        )}
                    </div>

                    {/* Quick Stock Status Card */}
                    {activeMedicine && (
                        <div className="flex items-center justify-between rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] p-3 text-xs dark:border-[#382f25] dark:bg-[#251f19]">
                            <div>
                                <span className="text-[11px] text-stone-500 dark:text-stone-400">Current In-Stock:</span>
                                <p className="font-bold text-stone-800 dark:text-[#f4ecdf]">
                                    {activeMedicine.stock ?? 0} {activeMedicine.unit || "Tablet"}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] text-stone-500 dark:text-stone-400">Alert Min Level:</span>
                                <p className="font-semibold text-stone-700 dark:text-stone-300">
                                    {activeMedicine.minimum_stock ?? 10} {activeMedicine.unit || "Tablet"}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] text-stone-500 dark:text-stone-400">Recommended Order:</span>
                                <p className="font-bold text-[#70091f] dark:text-[#f8a598]">
                                    {activeMedicine.recommended_request_qty ?? 50} {activeMedicine.unit || "Tablet"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                                Quantity to Request *
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50000"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full rounded-xl border border-[#ded4c9] bg-white px-3.5 py-2 text-xs text-stone-800 shadow-xs focus:border-[#70091f] focus:outline-hidden dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                                Packaging / Unit
                            </label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full rounded-xl border border-[#ded4c9] bg-white px-3.5 py-2 text-xs text-stone-800 shadow-xs focus:border-[#70091f] focus:outline-hidden dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                            >
                                <option value="Tablet">Tablet</option>
                                <option value="Capsule">Capsule</option>
                                <option value="Bottle">Bottle</option>
                                <option value="Pack">Pack</option>
                                <option value="Piece">Piece</option>
                                <option value="Sachet">Sachet</option>
                                <option value="Tube">Tube</option>
                                <option value="Box">Box</option>
                            </select>
                        </div>
                    </div>

                    {/* Urgency Priority */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                            Priority / Urgency
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { key: "normal", label: "Normal", desc: "Routine Restock", color: "border-stone-300 bg-stone-50 text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200" },
                                { key: "urgent", label: "Urgent", desc: "Low Stock Alert", color: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300" },
                                { key: "critical", label: "Critical", desc: "Out of Stock", color: "border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300" },
                            ].map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => setPriority(p.key as any)}
                                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition ${
                                        priority === p.key
                                            ? "border-[#70091f] bg-[#70091f]/5 ring-2 ring-[#70091f]/30 font-bold dark:border-[#f8a598] dark:bg-[#70091f]/20"
                                            : p.color
                                    }`}
                                >
                                    <span className="text-xs font-bold">{p.label}</span>
                                    <span className="text-[10px] opacity-80">{p.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Purpose / Reason */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            Purpose / Justification
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. High daily student visit usage, seasonal restocking"
                            className="w-full rounded-xl border border-[#ded4c9] bg-white px-3.5 py-2 text-xs text-stone-800 shadow-xs focus:border-[#70091f] focus:outline-hidden dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                        />
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            Additional Remarks / Supplier Notes (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Specify preferred brand, batch delivery deadline, or storage requirements..."
                            className="w-full rounded-xl border border-[#ded4c9] bg-white px-3.5 py-2 text-xs text-stone-800 shadow-xs focus:border-[#70091f] focus:outline-hidden dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e8dfd4] dark:border-[#382f25]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-[#ded4c9] bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-[#f6f0e6] dark:border-[#382f25] dark:bg-[#251f19] dark:text-stone-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#70091f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#8b1505] disabled:opacity-50 transition"
                        >
                            <Send size={14} />
                            {submitting ? "Submitting Request..." : "Submit Requisition Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
