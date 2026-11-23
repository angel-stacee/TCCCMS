import { useCallback, useEffect, useRef, useState, useMemo, Fragment } from "react";
import {
    Pill,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    Search,
    Filter,
    Pencil,
    Trash2,
    Package,
    AlertTriangle,
    CheckCircle2,
    X,
    BarChart3,
    AlertOctagon,
    Calendar,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    Flame,
    FileText,
    Activity,
} from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";
import api from "../services/api";
import FloatingToast from "../components/common/FloatingToast";
import { MedicineModal } from "../components/medicine/MedicineModal";
import { RestoreMedicinesModal } from "../components/medicine/RestoreMedicinesModal";
import { ConfirmationModal } from "../components/student-management/FieldsAndModals";
import { MedicineRequisitionModal } from "../components/medicine/MedicineRequisitionModal";
import { MedicineTrendLineChart } from "../components/medicine/MedicineTrendLineChart";
import { MostUsedMedicinesView } from "../components/medicine/MostUsedMedicinesView";
import { addClinicNotification, getStoredNotifications } from "../services/notifications";

const TREATMENT_TYPES = [
    "First Aid",
    "Medication",
    "Wound Care",
    "Cold Compress",
    "Hot Compress",
    "All",
];

const EMPTY_FORM = {
    medicine_name: "",
    treatment_type: "Medication",
    expiration_date: "",
    unit: "Tablet",
    stock: "",
    minimum_stock: "10",
    description: "",
    batch_number: "",
    date_added: new Date().toISOString().split("T")[0],
    supplier: "",
    remarks: "",
};

function Medicine() {
    const [medicines, setMedicines] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
    });
    const [summary, setSummary] = useState({
        total_medicines: 0,
        total_stock: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        expired_count: 0,
        expiring_soon_count: 0,
        near_expiration_count: 0,
        good_count: 0,
        earliest_expiration_date: null as string | null,
        expired_medicines: [] as any[],
        expiring_soon_medicines: [] as any[],
        category_breakdown: [] as any[],
        top_medicines: [] as any[],
    });
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [stockChartMode, setStockChartMode] = useState<"medicine" | "category" | "status">("medicine");

    const [showForm, setShowForm] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | undefined>(undefined);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [confirmDeleteMedicine, setConfirmDeleteMedicine] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [mainTab, setMainTab] = useState<"inventory" | "most_used" | "trend">("inventory");
    const [selectedTrendMedicineId, setSelectedTrendMedicineId] = useState<number | string | null>("all");
    const [requisitionModalOpen, setRequisitionModalOpen] = useState(false);
    const [selectedRequisitionMed, setSelectedRequisitionMed] = useState<any | null>(null);
    const [expandedMedicineIds, setExpandedMedicineIds] = useState<Record<number, boolean>>({});

    const toggleExpandBatches = (id: number) => {
        setExpandedMedicineIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    useEffect(() => {
        if (!successMessage) return undefined;

        const timeout = setTimeout(() => setSuccessMessage(""), 4000);
        return () => clearTimeout(timeout);
    }, [successMessage]);

    const loadMedicines = useCallback(async (page = 1, searchTerm = "", statusFilterParam = "all") => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/medicines", {
                params: {
                    page,
                    per_page: 10,
                    include_summary: 1,
                    search: searchTerm.trim() || undefined,
                    status_filter: statusFilterParam !== "all" ? statusFilterParam : undefined,
                },
            });

            const dataList = response.data?.data || [];
            setMedicines(dataList);
            setPagination({
                current_page: response.data?.current_page || 1,
                last_page: response.data?.last_page || 1,
                total: response.data?.total || 0,
                per_page: response.data?.per_page || 10,
            });
            const sum = response.data?.summary || {
                total_medicines: 0,
                total_stock: 0,
                low_stock_count: 0,
                out_of_stock_count: 0,
                expired_count: 0,
                expiring_soon_count: 0,
                expired_medicines: [],
                expiring_soon_medicines: [],
            };
            setSummary(sum);

            // Automatically notify for expired medicines
            if (Array.isArray(sum.expired_medicines) && sum.expired_medicines.length > 0) {
                const stored = getStoredNotifications();
                sum.expired_medicines.forEach((med: any) => {
                    const alertKey = `expired-med-${med.id}-${med.expiration_date}`;
                    if (!stored.some((n) => n.key === alertKey)) {
                        addClinicNotification({
                            type: "delete",
                            title: "Expired Medicine Alert",
                            description: `${med.medicine_name} expired on ${med.expiration_date}. Immediate removal/disposal required.`,
                            category: "medicine",
                        });
                    }
                });
            }

            // Automatically notify for medicines expiring within 30 days
            if (Array.isArray(sum.expiring_soon_medicines) && sum.expiring_soon_medicines.length > 0) {
                const stored = getStoredNotifications();
                sum.expiring_soon_medicines.forEach((med: any) => {
                    const alertKey = `expiring-med-${med.id}-${med.expiration_date}`;
                    if (!stored.some((n) => n.key === alertKey)) {
                        addClinicNotification({
                            type: "info",
                            title: "Medicine Expiring Soon",
                            description: `${med.medicine_name} will expire on ${med.expiration_date}. Plan replenishment.`,
                            category: "medicine",
                        });
                    }
                });
            }
        } catch (err) {
            console.error("Medicine loading error:", err);

            setError(
                "Unable to load medicines. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => loadMedicines(1, "", statusFilter), 0);

        return () => clearTimeout(timeout);
    }, [loadMedicines, statusFilter]);

    const initialSearch = useRef(true);
    useEffect(() => {
        if (initialSearch.current) {
            initialSearch.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            loadMedicines(1, search, statusFilter);
        }, 250);

        return () => clearTimeout(timeout);
    }, [search, loadMedicines]);

    useEffect(() => {
        const handleStockUpdate = () => {
            loadMedicines(pagination.current_page, search, statusFilter);
        };

        window.addEventListener("medicine-stock-updated", handleStockUpdate);
        return () => window.removeEventListener("medicine-stock-updated", handleStockUpdate);
    }, [loadMedicines, pagination.current_page, search]);

    const openAddForm = () => {
        setEditingMedicine(null);
        setForm(EMPTY_FORM);
        setError("");
        setShowForm(true);
    };

    const openEditForm = (medicine) => {
        setEditingMedicine(medicine);

        setForm({
            medicine_name: medicine.medicine_name || "",
            treatment_type: medicine.treatment_type || "Medication",
            expiration_date: medicine.expiration_date
                ? String(medicine.expiration_date).split("T")[0]
                : "",
            unit: medicine.unit || "Tablet",
            stock:
                medicine.stock === null ||
                medicine.stock === undefined
                    ? ""
                    : String(medicine.stock),
            minimum_stock:
                medicine.minimum_stock === null ||
                medicine.minimum_stock === undefined
                    ? "10"
                    : String(medicine.minimum_stock),
            description: medicine.description || "",
            batch_number: medicine.batch_number || "",
            date_added: medicine.created_at ? String(medicine.created_at).split("T")[0] : new Date().toISOString().split("T")[0],
            supplier: medicine.supplier || "",
            remarks: medicine.remarks || "",
        });

        setError("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;

        setShowForm(false);
        setEditingMedicine(null);
        setForm(EMPTY_FORM);
        setError("");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSelectMedicineTemplate = (item: any) => {
        setForm((prev) => ({
            ...prev,
            medicine_name: item.medicine_name,
            treatment_type: item.treatment_type || prev.treatment_type,
            unit: item.unit || prev.unit,
            minimum_stock: item.minimum_stock !== undefined ? String(item.minimum_stock) : prev.minimum_stock,
            description: item.description || prev.description,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!form.medicine_name.trim()) {
            setError("Medicine name is required.");
            return;
        }

        if (!form.treatment_type) {
            setError("Treatment type is required.");
            return;
        }

        if (form.stock === "") {
            setError("Stock quantity is required.");
            return;
        }

        const stockValue = Number(form.stock);

        const minimumStockValue = Number(
            form.minimum_stock === ""
                ? 0
                : form.minimum_stock
        );

        if (!Number.isFinite(stockValue) || stockValue < 0) {
            setError(
                "Stock must be a valid number of 0 or more."
            );
            return;
        }

        if (
            !Number.isFinite(minimumStockValue) ||
            minimumStockValue < 0
        ) {
            setError(
                "Minimum stock must be a valid number of 0 or more."
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                medicine_name: form.medicine_name.trim(),
                treatment_type: form.treatment_type,
                expiration_date: form.expiration_date ? form.expiration_date : null,
                unit: form.unit,
                stock: stockValue,
                minimum_stock: minimumStockValue,
                description: form.description.trim() || null,
                batch_number: form.batch_number?.trim() || null,
                date_added: form.date_added || null,
                supplier: form.supplier?.trim() || null,
                remarks: form.remarks?.trim() || null,
            };

            if (editingMedicine) {
                const response = await api.put(
                    `/medicines/${editingMedicine.id}`,
                    payload
                );

                setMedicines((previous) =>
                    previous.map((medicine) =>
                        medicine.id === editingMedicine.id
                            ? response.data.medicine
                            : medicine
                    )
                );
            } else {
                const response = await api.post(
                    "/medicines",
                    payload
                );

                setMedicines((previous) => [
                    response.data.medicine,
                    ...previous,
                ]);
            }

            closeForm();
            await loadMedicines(
                editingMedicine ? pagination.current_page : 1,
                search,
                statusFilter
            );

            const isEdit = Boolean(editingMedicine);
            setSuccessMessage(
                `${payload.medicine_name} ${isEdit ? "updated" : "added"} successfully.`
            );

            addClinicNotification({
                type: isEdit ? "edit" : "add",
                title: isEdit ? "Medicine Updated" : "Medicine Added",
                description: isEdit
                    ? `${payload.medicine_name} updated in inventory`
                    : `${payload.medicine_name} (${stockValue} ${payload.unit}) added to inventory`,
                category: "medicine",
            });
        } catch (err) {
            console.error("Medicine save error:", err);

            const validationErrors =
                err?.response?.data?.errors;

            if (validationErrors) {
                const firstError =
                    Object.values(validationErrors).flat()[0];

                setError(
                    String(firstError || "Please check the form.")
                );
            } else {
                setError(
                    err?.response?.data?.message ||
                        "Unable to save medicine."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreQuick = async (id: number | string) => {
        try {
            await api.post(`/medicines/${id}/restore`);
            setSuccessMessage("Medicine restored successfully.");
            setToastAction(undefined);
            await loadMedicines(pagination.current_page, search, statusFilter);
        } catch (err: any) {
            console.error("Failed to restore medicine:", err);
            setError("Failed to restore medicine.");
        }
    };

    const deleteMedicine = (medicine: any) => {
        setConfirmDeleteMedicine(medicine);
    };

    const handleExecuteDelete = async () => {
        if (!confirmDeleteMedicine) return;
        const medicine = confirmDeleteMedicine;
        setIsDeleting(true);

        try {
            await api.delete(`/medicines/${medicine.id}`);

            setMedicines((previous) =>
                previous.filter(
                    (item) => item.id !== medicine.id
                )
            );
            setConfirmDeleteMedicine(null);
            await loadMedicines(pagination.current_page, search, statusFilter);
            setSuccessMessage(`${medicine.medicine_name} moved to trash.`);
            setToastAction({
                label: "Undo",
                onClick: () => handleRestoreQuick(medicine.id),
            });

            addClinicNotification({
                type: "delete",
                title: "Medicine Moved to Trash",
                description: `${medicine.medicine_name} moved to trash`,
                category: "medicine",
            });
        } catch (err: any) {
            console.error("Medicine delete error:", err);
            setError(err?.response?.data?.message || "Unable to delete medicine. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatus = (medicine) => {
        const stock = Number(medicine.stock || 0);
        const minimum = Number(
            medicine.minimum_stock || 0
        );

        if (stock <= 0) {
            return {
                label: "Out of Stock",
                className:
                    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60",
            };
        }

        if (stock <= minimum) {
            return {
                label: "Low Stock",
                className:
                    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
            };
        }

        return {
            label: "In Stock",
            className:
                "bg-green-50 text-green-700 border-green-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
        };
    };


    const getExpirationInfo = (expirationDate: string | null | undefined) => {
        if (!expirationDate) {
            return { status: "none", label: "No Date", days: null, formattedDate: "" };
        }
        const cleanDate = String(expirationDate).split("T")[0];
        const exp = new Date(cleanDate);
        exp.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = exp.getTime() - today.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (days < 0) {
            return {
                status: "expired",
                label: `Expired (${Math.abs(days)}d ago)`,
                days,
                formattedDate: cleanDate,
            };
        }
        if (days <= 30) {
            return {
                status: "expiring_soon",
                label: `Expires in ${days}d`,
                days,
                formattedDate: cleanDate,
            };
        }
        return {
            status: "valid",
            label: cleanDate,
            days,
            formattedDate: cleanDate,
        };
    };

    const filteredMedicines = medicines;
    const totalMedicines = summary.total_medicines;
    const totalStock = summary.total_stock;
    const lowStockCount = summary.low_stock_count;
    const outOfStockCount = summary.out_of_stock_count;

    const inStockCount =
        totalMedicines -
        lowStockCount -
        outOfStockCount;

    const stockStatusTotal = Math.max(
        totalMedicines,
        1
    );

    const inStockPercent =
        (inStockCount / stockStatusTotal) * 100;

    const lowStockPercent =
        (lowStockCount / stockStatusTotal) * 100;

    const outOfStockPercent =
        (outOfStockCount / stockStatusTotal) * 100;

    const maxStatusCount = Math.max(
        inStockCount,
        lowStockCount,
        outOfStockCount,
        1
    );

    const donutStyle = {
        background: `conic-gradient(
            #27a866 0% ${inStockPercent}%,
            #f5ae22 ${inStockPercent}% ${
                inStockPercent + lowStockPercent
            }%,
            #e63946 ${
                inStockPercent + lowStockPercent
            }% 100%
        )`,
    };

    const medicineChartColors = [
        "#70091f", // Burgundy
        "#059669", // Emerald
        "#d97706", // Amber
        "#0284c7", // Sky Blue
        "#7c3aed", // Violet
        "#db2777", // Rose
        "#ea580c", // Burnt Orange
        "#64748b", // Slate
    ];

    const categoryChartColors = [
        "#70091f", // Medication (Burgundy)
        "#059669", // First Aid (Emerald)
        "#0284c7", // Wound Care (Sky Blue)
        "#0d9488", // Cold Compress (Teal)
        "#d97706", // Hot Compress (Amber)
        "#7c3aed", // Other
    ];

    const medicineListChartData = useMemo(() => {
        const items = Array.isArray(summary.top_medicines) && summary.top_medicines.length > 0
            ? summary.top_medicines
            : [...medicines].sort((a: any, b: any) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 7);

        if (!items || items.length === 0) {
            return [{ name: "Medicines", value: Number(totalStock) || 1, fill: "#70091f" }];
        }

        const topStockSum = items.reduce((acc: number, curr: any) => acc + Number(curr.stock || 0), 0);
        const othersStock = Math.max(0, Number(totalStock || 0) - topStockSum);

        const data: Array<{ name: string; value: number; unit?: string; category?: string; fill: string }> = items.map((m: any, i: number) => ({
            name: m.medicine_name || m.name || `Medicine ${i + 1}`,
            value: Number(m.stock || 0),
            unit: m.unit || "units",
            category: m.treatment_type || "Medication",
            fill: medicineChartColors[i % medicineChartColors.length],
        }));

        if (othersStock > 0) {
            const othersCount = Math.max(0, Number(totalMedicines || 0) - items.length);
            data.push({
                name: `Other Medicines (${othersCount})`,
                value: othersStock,
                unit: "units",
                category: "Formulary",
                fill: "#94a3b8",
            });
        }

        return data;
    }, [summary.top_medicines, totalStock, totalMedicines, medicines]);

    const categoryChartData = useMemo(() => {
        if (Array.isArray(summary.category_breakdown) && summary.category_breakdown.length > 0) {
            return summary.category_breakdown.map((item: any, i: number) => ({
                name: item.treatment_type || "Medication",
                value: Number(item.total_stock || 0),
                medicine_count: Number(item.medicine_count || 0),
                fill: categoryChartColors[i % categoryChartColors.length],
            }));
        }

        const totalsByCategory: Record<string, { stock: number; count: number }> = {};
        if (Array.isArray(medicines)) {
            medicines.forEach((m: any) => {
                const category = m.treatment_type || "Medication";
                if (!totalsByCategory[category]) {
                    totalsByCategory[category] = { stock: 0, count: 0 };
                }
                totalsByCategory[category].stock += Number(m.stock || 0);
                totalsByCategory[category].count += 1;
            });
        }

        const entries = Object.entries(totalsByCategory);
        if (entries.length === 0) {
            return [{ name: "In Stock", value: Number(totalStock) || 1, fill: "#70091f" }];
        }

        return entries.map(([name, val], i) => ({
            name,
            value: val.stock,
            medicine_count: val.count,
            fill: categoryChartColors[i % categoryChartColors.length],
        }));
    }, [summary.category_breakdown, medicines, totalStock]);

    const statusChartData = useMemo(() => {
        return [
            { name: "In Stock", value: inStockCount, fill: "#059669" },
            { name: "Low Stock", value: lowStockCount, fill: "#d97706" },
            { name: "Out of Stock", value: outOfStockCount, fill: "#dc2626" },
        ].filter((item) => item.value > 0);
    }, [inStockCount, lowStockCount, outOfStockCount]);

    const activePieData = stockChartMode === "medicine"
        ? medicineListChartData
        : stockChartMode === "category"
        ? categoryChartData
        : statusChartData;

    const createMiniBars = (ratios = [0.38, 0.58, 0.78, 1.0]) => {
        return ratios.map((ratio, index) => (
            <div
                key={index}
                className="w-[6px] rounded-t-sm bg-current"
                style={{
                    height: `${Math.round(Math.max(8, ratio * 34))}px`,
                }}
            />
        ));
    };

    return (
        <div className="tcc-module-page min-h-screen text-[#302820]">
            <FloatingToast
                message={successMessage}
                action={toastAction}
                onClose={() => {
                    setSuccessMessage("");
                    setToastAction(undefined);
                }}
            />

            <main className="w-full px-3.5 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">


                <div className="tcc-module-header mb-5 flex flex-col gap-4 rounded-2xl border px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f3ebdf] text-[#8a6f50]">
                            <Pill size={25} />
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6f50]">
                                Medicine Inventory
                            </p>

                            <h1 className="text-2xl font-bold tracking-tight text-[#3d3329] sm:text-[28px]">
                                Medicine Inventory
                            </h1>

                            <p className="mt-0.5 text-xs text-[#887d70]">
                                Manage medicines, track stock levels, and keep the clinic well prepared.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setShowRestoreModal(true)}
                            className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-[#e8dfd4] bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-[#6d5942] shadow-xs transition hover:bg-[#fcfaf6] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#211c17] dark:text-[#e5dcd1] dark:hover:bg-[#2c231a] cursor-pointer"
                            title="Restore deleted medicine records"
                        >
                            <RotateCcw size={15} className="text-[#8a6f50]" />
                            <span>Restore</span>
                        </button>

                        <button
                            type="button"
                            onClick={openAddForm}
                            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#70091f] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#70091f]/20 transition hover:bg-[#8b1505] cursor-pointer"
                        >
                            <Plus size={17} />
                            <span>Add Medicine</span>
                        </button>
                    </div>
                </div>

                {/* Inline Notification Banner */}
                {successMessage && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-emerald-950 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs dark:bg-emerald-900/60 dark:text-emerald-300">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-tight">Notification</p>
                                <p className="text-xs opacity-90 leading-relaxed">{successMessage}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {toastAction && (
                                <button
                                    type="button"
                                    onClick={toastAction.onClick}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    <span>{toastAction.label}</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setSuccessMessage("");
                                    setToastAction(undefined);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-black/5 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-stone-200 transition cursor-pointer"
                                aria-label="Dismiss notification"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}


                {error && !showForm && (
                    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Expiration Alert Banner */}
                {summary.expired_count > 0 && (
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300">
                                <AlertOctagon size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">
                                    {summary.expired_count} Medicine{summary.expired_count > 1 ? "s" : ""} Expired in Inventory!
                                </p>
                                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                                    Expired medicines must not be dispensed to students or staff. Please review and safely dispose of them immediately.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const nextFilter = statusFilter === "expired" ? "all" : "expired";
                                setStatusFilter(nextFilter);
                                loadMedicines(1, search, nextFilter);
                            }}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-red-700 active:scale-95"
                        >
                            {statusFilter === "expired" ? "Show All Medicines" : "View Expired Medicines"}
                        </button>
                    </div>
                )}

                {summary.expired_count === 0 && summary.expiring_soon_count > 0 && (
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300">
                                <Calendar size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">
                                    {summary.expiring_soon_count} Medicine{summary.expiring_soon_count > 1 ? "s" : ""} Expiring Soon (Within 30 Days)
                                </p>
                                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                                    Check stock levels and schedule restock before items reach expiration.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const nextFilter = statusFilter === "expiring_soon" ? "all" : "expiring_soon";
                                setStatusFilter(nextFilter);
                                loadMedicines(1, search, nextFilter);
                            }}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 active:scale-95"
                        >
                            {statusFilter === "expiring_soon" ? "Show All Medicines" : "View Expiring Medicines"}
                        </button>
                    </div>
                )}


                <section className="mb-4 grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 xl:grid-cols-5">

                    <div className="rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-4 py-3.5 shadow-sm dark:border-[#382f25] dark:bg-[#201a15]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3ebdf] text-[#8a6f50] dark:bg-[#34291f] dark:text-[#d4b996]">
                                    <Pill size={19} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#887d70] dark:text-stone-400">
                                        Total Medicines
                                    </p>

                                    <p className="mt-0.5 text-2xl font-bold text-stone-900 dark:text-stone-100">
                                        {totalMedicines}
                                    </p>

                                    <p className="mt-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight">
                                        Total registered formulary items
                                    </p>
                                </div>
                            </div>

                            <div className="flex h-12 shrink-0 items-end gap-1 text-[#8a6f50] dark:text-[#d4b996]">
                                {createMiniBars()}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-[#fffdf9] px-4 py-3.5 shadow-sm dark:border-amber-950/40 dark:bg-[#201a15]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                                    <Package size={19} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#887d70] dark:text-stone-400">
                                        Total Stock
                                    </p>

                                    <p className="mt-0.5 text-2xl font-bold text-stone-900 dark:text-stone-100">
                                        {totalStock}
                                    </p>

                                    <p className="mt-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight">
                                        Total available units in clinic
                                    </p>
                                </div>
                            </div>

                            <div className="flex h-12 shrink-0 items-end gap-1 text-amber-600 dark:text-amber-400">
                                {createMiniBars()}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-[#fcfaf6] px-4 py-3.5 shadow-sm dark:border-amber-950/40 dark:bg-[#201a15]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
                                    <AlertTriangle size={19} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#887d70] dark:text-stone-400">
                                        Low Stock
                                    </p>

                                    <p className="mt-0.5 text-2xl font-bold text-amber-700 dark:text-amber-400">
                                        {lowStockCount}
                                    </p>

                                    <p className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 leading-tight">
                                        At or below alert minimum stock
                                    </p>
                                </div>
                            </div>

                            <div className="flex h-12 shrink-0 items-end gap-1 text-amber-500 dark:text-amber-400">
                                {createMiniBars()}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-red-100 bg-[#fcfaf6] px-4 py-3.5 shadow-sm dark:border-red-950/40 dark:bg-[#201a15]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                    <Package size={19} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#887d70] dark:text-stone-400">
                                        Out of Stock
                                    </p>

                                    <p className="mt-0.5 text-2xl font-bold text-red-600 dark:text-red-400">
                                        {outOfStockCount}
                                    </p>

                                    <p className="mt-1 text-[10px] font-medium text-red-600 dark:text-red-400 leading-tight">
                                        0 remaining units (needs restock)
                                    </p>
                                </div>
                            </div>

                            <div className="flex h-12 shrink-0 items-end gap-1 text-red-600 dark:text-red-400">
                                {createMiniBars()}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-red-200 bg-[#fcfaf6] px-4 py-3.5 shadow-sm dark:bg-[#29231d] dark:border-red-900/40">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                    <AlertOctagon size={19} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#887d70] dark:text-stone-400">
                                        Expired
                                    </p>

                                    <p className="mt-0.5 text-2xl font-bold text-red-600 dark:text-red-400">
                                        {summary.expired_count || 0}
                                    </p>

                                    <p className="mt-1 text-[10px] font-medium text-red-600 dark:text-red-400 leading-tight">
                                        Past expiry (excluded from issuing)
                                    </p>
                                    {summary.expiring_soon_count > 0 && (
                                        <p className="text-[9px] font-bold text-amber-700 dark:text-amber-300 leading-tight mt-0.5">
                                            • {summary.expiring_soon_count} expiring within 30d
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex h-12 shrink-0 items-end gap-1 text-red-600 dark:text-red-400">
                                {createMiniBars([0.4, 0.6, 0.9, 1.0])}
                            </div>
                        </div>
                    </div>

                </section>


                <section className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-2">

                    <div className="flex flex-col justify-between rounded-xl border border-[#e8dfd4] bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-[#382f25] dark:bg-[#251f19]">
                        {/* Card Header matching theme */}
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3ebdf] text-[#8a6f50] dark:bg-[#342a22] dark:text-[#d4b996]">
                                    <Pill size={16} />
                                </div>

                                <div>
                                    <h2 className="text-sm font-bold text-stone-900 dark:text-[#f4ecdf]">
                                        Medicine Overview
                                    </h2>

                                    <p className="text-[10px] text-stone-500 dark:text-stone-400">
                                        Formulary items &amp; inventory status
                                    </p>
                                </div>
                            </div>

                            {/* View Mode Switcher */}
                            <div className="flex rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] p-0.5 text-[10px] font-semibold dark:border-[#382f25] dark:bg-[#201a15]">
                                <button
                                    type="button"
                                    onClick={() => setStockChartMode("medicine")}
                                    className={`rounded-md px-2 py-0.5 transition cursor-pointer ${
                                        stockChartMode === "medicine"
                                            ? "bg-[#70091f] text-white shadow-xs"
                                            : "text-stone-500 hover:text-stone-800 dark:text-stone-400"
                                    }`}
                                >
                                    Medicine List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStockChartMode("category")}
                                    className={`rounded-md px-2 py-0.5 transition cursor-pointer ${
                                        stockChartMode === "category"
                                            ? "bg-[#70091f] text-white shadow-xs"
                                            : "text-stone-500 hover:text-stone-800 dark:text-stone-400"
                                    }`}
                                >
                                    By Category
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStockChartMode("status")}
                                    className={`rounded-md px-2 py-0.5 transition cursor-pointer ${
                                        stockChartMode === "status"
                                            ? "bg-[#70091f] text-white shadow-xs"
                                            : "text-stone-500 hover:text-stone-800 dark:text-stone-400"
                                    }`}
                                >
                                    By Status
                                </button>
                            </div>
                        </div>

                        {/* Recharts Pie Chart Canvas */}
                        <div className="my-auto flex h-[190px] w-full items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const item = payload[0] as any;
                                            const totalVal = activePieData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                                            const percent = Math.round((Number(item.value) / totalVal) * 100);
                                            const payloadItem = item.payload || {};
                                            return (
                                                <div className="rounded-xl border border-[#e8dfd4] bg-white px-3 py-2 text-xs shadow-lg dark:border-[#382f25] dark:bg-[#251f19]">
                                                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                                                        {item.name}
                                                    </p>
                                                    <p className="mt-0.5 font-bold text-[#70091f] dark:text-[#f492a3]">
                                                        {Number(item.value).toLocaleString()} {stockChartMode === "status" ? "medicines" : (payloadItem.unit || "units")} ({percent}%)
                                                    </p>
                                                    {payloadItem.category && stockChartMode === "medicine" && (
                                                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                                                            Category: {payloadItem.category}
                                                        </p>
                                                    )}
                                                    {payloadItem.medicine_count !== undefined && stockChartMode === "category" && (
                                                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                                                            {payloadItem.medicine_count} {payloadItem.medicine_count === 1 ? "medicine" : "medicines"}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                    <Pie
                                        data={activePieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={42}
                                        outerRadius={75}
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                        isAnimationActive={true}
                                    >
                                        {activePieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Interactive Pill Legend of Top Items */}
                        <div className="my-1.5 flex flex-wrap justify-center gap-1.5 px-2">
                            {activePieData.slice(0, 6).map((entry, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                >
                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                                    <span className="truncate max-w-[100px]">{entry.name}</span>
                                    <span className="font-bold text-stone-900 dark:text-white">
                                        {Number(entry.value).toLocaleString()}
                                    </span>
                                </span>
                            ))}
                        </div>

                        {/* Card Footer */}
                        <div className="mt-1 flex flex-col items-center gap-0.5 border-t border-[#e8dfd4] pt-2 text-center dark:border-[#382f25]">
                            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200">
                                <span>
                                    {stockChartMode === "medicine"
                                        ? "Top registered medicines by stock volume"
                                        : stockChartMode === "category"
                                        ? "Inventory grouped by clinical treatment type"
                                        : (lowStockCount === 0 && outOfStockCount === 0
                                            ? "Inventory fully stocked (100%)"
                                            : `${lowStockCount} low stock · ${outOfStockCount} out of stock`)}
                                </span>
                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400">
                                Showing {Number(totalStock).toLocaleString()} total units across {totalMedicines} medicines
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#e8dfd4] bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3ebdf] text-[#8a6f50]">
                                <BarChart3 size={16} />
                            </div>

                            <div>
                                <h2 className="text-sm font-bold">
                                    Medicine Stock Distribution
                                </h2>

                                <p className="text-[10px] text-[#887d70]">
                                    Medicines grouped by stock status
                                </p>
                            </div>
                        </div>

                        <div className="relative h-[145px] pl-7">

                            <div className="absolute inset-x-7 top-1 bottom-6 flex flex-col justify-between">
                                <div className="border-t border-[#eee7de]" />
                                <div className="border-t border-[#eee7de]" />
                                <div className="border-t border-[#eee7de]" />
                                <div className="border-t border-[#eee7de]" />
                                <div className="border-t border-[#eee7de]" />
                                <div className="border-t border-[#ded4c9]" />
                            </div>

                            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[8px] text-[#887d70]">
                                <span>{maxStatusCount}</span>
                                <span>{Math.round(maxStatusCount * 0.8)}</span>
                                <span>{Math.round(maxStatusCount * 0.6)}</span>
                                <span>{Math.round(maxStatusCount * 0.4)}</span>
                                <span>{Math.round(maxStatusCount * 0.2)}</span>
                                <span>0</span>
                            </div>

                            <div className="absolute inset-x-7 bottom-6 top-1 flex items-end justify-around">

                                <div className="flex h-full w-20 flex-col items-center justify-end">
                                    <span className="mb-1 text-[10px] font-bold">
                                        {inStockCount}
                                    </span>

                                    <div
                                        className="w-16 rounded-t-md bg-[#27a866]"
                                        style={{
                                            height: `${Math.max(
                                                4,
                                                (inStockCount /
                                                    maxStatusCount) *
                                                    105
                                            )}px`,
                                        }}
                                    />
                                </div>

                                <div className="flex h-full w-20 flex-col items-center justify-end">
                                    <span className="mb-1 text-[10px] font-bold">
                                        {lowStockCount}
                                    </span>

                                    <div
                                        className="w-16 rounded-t-md bg-[#f5ae22]"
                                        style={{
                                            height: `${Math.max(
                                                4,
                                                (lowStockCount /
                                                    maxStatusCount) *
                                                    105
                                            )}px`,
                                        }}
                                    />
                                </div>

                                <div className="flex h-full w-20 flex-col items-center justify-end">
                                    <span className="mb-1 text-[10px] font-bold">
                                        {outOfStockCount}
                                    </span>

                                    <div
                                        className="w-16 rounded-t-md bg-[#e63946]"
                                        style={{
                                            height: `${Math.max(
                                                4,
                                                (outOfStockCount /
                                                    maxStatusCount) *
                                                    105
                                            )}px`,
                                        }}
                                    />
                                </div>

                            </div>

                            <div className="absolute inset-x-7 bottom-0 flex justify-around text-[9px] font-medium text-[#766959]">
                                <span className="w-20 text-center">
                                    In Stock
                                </span>

                                <span className="w-20 text-center">
                                    Low Stock
                                </span>

                                <span className="w-20 text-center">
                                    Out of Stock
                                </span>
                            </div>

                        </div>
                    </div>

                </section>


                <section className="overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-sm dark:border-[#382f25] dark:bg-[#251f19]">
                    {/* Main Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-[#e8dfd4] bg-[#fcfaf6] px-4 pt-3 sm:px-5 dark:border-[#382f25] dark:bg-[#201a15]">
                        <button
                            type="button"
                            onClick={() => setMainTab("inventory")}
                            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                                mainTab === "inventory"
                                    ? "border-[#70091f] text-[#70091f] dark:border-[#f8a598] dark:text-[#f8a598]"
                                    : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400"
                            }`}
                        >
                            <Package size={15} />
                            <span>Medicine Inventory &amp; Batches ({pagination.total || medicines.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMainTab("most_used")}
                            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                                mainTab === "most_used"
                                    ? "border-[#70091f] text-[#70091f] dark:border-[#f8a598] dark:text-[#f8a598]"
                                    : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400"
                            }`}
                        >
                            <Flame size={15} className="text-amber-600" />
                            <span>Most Used &amp; Requisitions (rqst)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMainTab("trend")}
                            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                                mainTab === "trend"
                                    ? "border-[#70091f] text-[#70091f] dark:border-[#f8a598] dark:text-[#f8a598]"
                                    : "border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400"
                            }`}
                        >
                            <TrendingUp size={15} className="text-emerald-600" />
                            <span>Stock Trends (Line Chart: Up / Down)</span>
                        </button>
                    </div>

                    {mainTab === "most_used" && (
                        <div className="p-4 sm:p-5">
                            <MostUsedMedicinesView
                                onRequestStock={(med) => {
                                    setSelectedRequisitionMed(med);
                                    setRequisitionModalOpen(true);
                                }}
                                onViewTrend={(id) => {
                                    setSelectedTrendMedicineId(id);
                                    setMainTab("trend");
                                }}
                            />
                        </div>
                    )}

                    {mainTab === "trend" && (
                        <div className="p-4 sm:p-5">
                            <MedicineTrendLineChart
                                selectedMedicineId={selectedTrendMedicineId}
                                allMedicines={medicines}
                                onSelectMedicine={(id) => setSelectedTrendMedicineId(id)}
                                onRequestStock={(med) => {
                                    setSelectedRequisitionMed(med);
                                    setRequisitionModalOpen(true);
                                }}
                            />
                        </div>
                    )}

                    {mainTab === "inventory" && (
                        <>
                    {/* Section Top Header & Prominent Controls Bar */}
                    <div className="flex flex-col gap-3.5 border-b border-[#e8dfd4] p-4 sm:p-5 dark:border-[#382f25]">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3ebdf] text-[#8a6f50] dark:bg-[#342a22] dark:text-[#d4b996]">
                                    <Pill size={20} />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-[#f4ecdf]">
                                            Medicine List
                                        </h2>
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8dfd4] bg-white px-2.5 py-0.5 text-xs font-bold text-[#70091f] shadow-xs dark:border-stone-700 dark:bg-stone-800 dark:text-[#f8a598]">
                                            <Package size={13} />
                                            Total Stock: {summary.total_stock?.toLocaleString() || 0}
                                        </span>
                                        {summary.earliest_expiration_date && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                                                <Calendar size={13} />
                                                Earliest Expiration: {summary.earliest_expiration_date}
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 text-xs text-[#887d70] dark:text-stone-400">
                                        Total registered items: <strong className="text-stone-800 dark:text-stone-200">{pagination.total || medicines.length}</strong> • Total stock: <strong className="text-stone-800 dark:text-stone-200">{summary.total_stock?.toLocaleString() || 0} units</strong> • Next expiration: <strong className="text-stone-800 dark:text-stone-200">{summary.earliest_expiration_date || "No upcoming expiration"}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Active filter count / quick reset indicator */}
                            {(search || statusFilter !== "all" || (selectedCategory && selectedCategory !== "All")) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setSelectedCategory("All");
                                        setStatusFilter("all");
                                        loadMedicines(1, "", "all");
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3 py-1.5 text-xs font-semibold text-[#70091f] hover:bg-[#fcebe7] transition dark:border-[#382f25] dark:bg-[#201a15] dark:text-[#f8a598]"
                                >
                                    <RotateCcw size={13} />
                                    <span>Reset All Filters</span>
                                </button>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="flex flex-col gap-3">
                            <div className="relative w-full">
                                <Search
                                    size={18}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a6f50] dark:text-[#d4b996]"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => {
                                        const val = event.target.value;
                                        setSearch(val);
                                        setSelectedCategory(val ? "" : "All");
                                    }}
                                    placeholder="Search by name, treatment, unit, or symptom..."
                                    className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] py-3 pl-10 pr-10 text-sm font-medium text-stone-900 outline-none transition placeholder:text-[#a99d8f] focus:border-[#70091f] focus:bg-white focus:ring-4 focus:ring-[#70091f]/10 dark:border-[#4e4234] dark:bg-[#201a15] dark:text-[#f4ecdf] dark:placeholder:text-stone-500"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setSelectedCategory("All");
                                            loadMedicines(1, "");
                                        }}
                                        aria-label="Clear search"
                                        className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#a99d8f] hover:bg-[#f6f1e9] hover:text-[#3c332a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6f50]"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8dfd4] bg-[#fcfaf6] px-4 py-2.5">
                        {/* Treatment Category Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-[11px] font-semibold text-[#887d70]">Category:</span>
                            {["All", "First Aid", "Medication", "Wound Care", "Cold Compress", "Hot Compress"].map((cat) => {
                                const isSelected = (!selectedCategory && cat === "All") || selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            const query = cat === "All" ? "" : cat;
                                            setSelectedCategory(cat);
                                            setSearch(query);
                                            loadMedicines(1, query, statusFilter);
                                        }}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                            isSelected
                                                ? "bg-[#70091f] text-white shadow-sm shadow-[#70091f]/20"
                                                : "border border-[#e8dfd4] bg-white text-[#675948] hover:bg-[#f6f0e6]"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Status Quick Filters */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-[11px] font-semibold text-[#887d70]">Status:</span>
                            {[
                                { key: "all", label: `All Items (${pagination.total || medicines.length})` },
                                { key: "expired", label: `Expired (${summary.expired_count || 0})`, isDanger: summary.expired_count > 0 },
                                { key: "expiring_soon", label: `Expiring Soon (${summary.expiring_soon_count || 0})`, isWarning: summary.expiring_soon_count > 0 },
                                { key: "low_stock", label: `Low Stock (${summary.low_stock_count || 0})` },
                                { key: "out_of_stock", label: `Out of Stock (${summary.out_of_stock_count || 0})` },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(tab.key);
                                        loadMedicines(1, search, tab.key);
                                    }}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                        statusFilter === tab.key
                                            ? tab.isDanger
                                                ? "bg-red-600 text-white shadow-sm"
                                                : tab.isWarning
                                                ? "bg-amber-600 text-white shadow-sm"
                                                : "bg-[#70091f] text-white shadow-sm shadow-[#70091f]/20"
                                            : tab.isDanger
                                            ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                            : tab.isWarning
                                            ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                            : "border border-[#e8dfd4] bg-white text-[#675948] hover:bg-[#f6f0e6]"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:block overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[760px] lg:min-w-full">

                            <thead>
                                <tr className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-left">

                                    <th className="px-4 py-2.5 text-[10px] font-bold text-[#887d70]">
                                        Medicine Name
                                    </th>

                                    <th className="px-4 py-2.5 text-[10px] font-bold text-[#887d70]">
                                        Treatment Type
                                    </th>

                                    <th className="px-4 py-2.5 text-[10px] font-bold text-[#887d70]">
                                        Unit
                                    </th>

                                    <th className="px-4 py-2.5 text-[10px] font-bold text-[#887d70]">
                                        Total Stock
                                    </th>

                                    <th className="px-4 py-2.5 text-[10px] font-bold text-[#887d70]">
                                        Minimum Stock
                                    </th>

                                    <th className="px-4 py-2.5 text-[10px] font-bold text-[#887d70]">
                                        Expiration Date
                                    </th>

                                    <th className="px-4 py-2.5 text-[10px] font-bold text-[#887d70]">
                                        Status
                                    </th>

                                    <th className="px-4 py-2.5 text-right text-[10px] font-bold text-[#887d70]">
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {loading ? (
                                    <>
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <tr key={i} className="animate-pulse border-b border-stone-100 dark:border-stone-800/60">
                                                <td className="px-5 py-4">
                                                    <div className="h-4 w-36 rounded bg-stone-200 dark:bg-stone-800" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-5 w-24 rounded-full bg-stone-100 dark:bg-stone-800/60" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-4 w-16 rounded bg-stone-200 dark:bg-stone-800" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-4 w-12 rounded bg-stone-200 dark:bg-stone-800" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-4 w-12 rounded bg-stone-200 dark:bg-stone-800" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-4 w-20 rounded bg-stone-100 dark:bg-stone-800/60" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-5 w-20 rounded-full bg-stone-200 dark:bg-stone-800" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-7 w-16 rounded-lg bg-stone-200 dark:bg-stone-800" />
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : filteredMedicines.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-12 text-center"
                                        >
                                            <Pill
                                                size={30}
                                                className="mx-auto mb-2 text-[#ded4c9]"
                                            />

                                            <p className="text-xs font-semibold">
                                                No medicines found
                                            </p>

                                            <p className="mt-1 text-[10px] text-[#887d70]">
                                                Add a medicine to start managing your inventory.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMedicines.map(
                                        (medicine) => {
                                            const status = getStatus(medicine);
                                            const activeBatches = medicine.active_batches || [];
                                            const isExpanded = !!expandedMedicineIds[medicine.id];

                                            return (
                                                <Fragment key={medicine.id}>
                                                    <tr className="border-b border-[#eee7de] transition hover:bg-[#fcfaf6] dark:border-[#382f25] dark:hover:bg-[#201a15]">
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3ebdf] text-[#8a6f50] shrink-0 dark:bg-[#34291f] dark:text-[#d4b996]">
                                                                    <Pill size={15} />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                                                            {medicine.medicine_name}
                                                                        </p>
                                                                        {activeBatches.length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleExpandBatches(medicine.id)}
                                                                                className="inline-flex items-center gap-1 rounded-full border border-[#70091f]/20 bg-[#70091f]/5 px-2 py-0.5 text-[10px] font-bold text-[#70091f] hover:bg-[#70091f]/15 transition cursor-pointer dark:border-[#f8a598]/30 dark:bg-[#70091f]/30 dark:text-[#f8a598]"
                                                                                title="Click to view all active batches in FEFO sequence"
                                                                            >
                                                                                <Package size={10} />
                                                                                <span>{activeBatches.length} Batches</span>
                                                                                <ChevronDown size={11} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {medicine.description && (
                                                                        <p className="mt-0.5 max-w-[240px] truncate text-[9px] text-[#a99d8f] dark:text-stone-400">
                                                                            {medicine.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-2.5">
                                                            <span className="inline-flex rounded-full border border-[#e8dfd4] bg-[#fcfaf6] px-2.5 py-1 text-[9px] font-semibold text-[#8a6f50] dark:border-stone-700 dark:bg-[#201a15] dark:text-[#d4b996]">
                                                                {medicine.treatment_type || "Not Assigned"}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-2.5 text-xs text-[#766959] dark:text-stone-300">
                                                            {medicine.unit}
                                                        </td>

                                                        <td className="px-4 py-2.5">
                                                            <div>
                                                                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                                                    {medicine.stock}
                                                                </span>
                                                                <span className="text-[10px] text-stone-500 dark:text-stone-400 ml-1">
                                                                    {medicine.unit}
                                                                </span>
                                                            </div>
                                                            {activeBatches.length > 1 && (
                                                                <span className="block text-[9px] font-medium text-[#8a6f50] dark:text-[#d4b996]">
                                                                    ({activeBatches.length} batches combined)
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-2.5 text-xs text-[#766959] dark:text-stone-400">
                                                            {medicine.minimum_stock}
                                                        </td>

                                                        {/* Expiration Date Cell */}
                                                        <td className="px-4 py-2.5">
                                                            {(() => {
                                                                const exp = getExpirationInfo(medicine.expiration_date);
                                                                return (
                                                                    <div>
                                                                        {exp.status === "expired" && (
                                                                            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60">
                                                                                <AlertOctagon size={11} className="shrink-0" />
                                                                                Expired: {exp.formattedDate}
                                                                            </span>
                                                                        )}
                                                                        {exp.status === "expiring_soon" && (
                                                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60">
                                                                                <Calendar size={11} className="shrink-0" />
                                                                                {exp.formattedDate} ({exp.days}d)
                                                                            </span>
                                                                        )}
                                                                        {exp.status === "valid" && (
                                                                            <span className="inline-flex items-center gap-1 text-[11px] text-[#554a3e] dark:text-stone-300">
                                                                                <Calendar size={12} className="text-[#a89d8f] dark:text-stone-400" />
                                                                                {exp.formattedDate}
                                                                            </span>
                                                                        )}
                                                                        {exp.status === "none" && (
                                                                            <span className="text-[10px] italic text-[#a89d8f]">No date</span>
                                                                        )}
                                                                        {activeBatches.length > 1 && (
                                                                            <span className="block text-[9px] font-medium text-stone-500 dark:text-stone-400 mt-0.5">
                                                                                Earliest batch · FEFO #1
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>

                                                        <td className="px-4 py-2.5">
                                                            <span
                                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold ${status.className}`}
                                                            >
                                                                {status.label}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                                {activeBatches.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleExpandBatches(medicine.id)}
                                                                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
                                                                            isExpanded
                                                                                ? "border-[#70091f] bg-[#70091f] text-white"
                                                                                : "border-[#e8dfd4] bg-white text-stone-700 hover:bg-[#f6f0e6] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                                                        }`}
                                                                        title="Toggle batch breakdown"
                                                                    >
                                                                        <Package size={11} />
                                                                        <span>Batches ({activeBatches.length})</span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedTrendMedicineId(medicine.id);
                                                                        setMainTab("trend");
                                                                    }}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-[#e8dfd4] px-2 py-1 text-[10px] font-bold text-stone-700 hover:bg-[#f6f0e6] dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition cursor-pointer"
                                                                    title="See stock trend line chart (going up or down)"
                                                                >
                                                                    <TrendingUp size={12} className="text-emerald-600" />
                                                                    <span>Trend</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedRequisitionMed(medicine);
                                                                        setRequisitionModalOpen(true);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-[#70091f]/30 bg-[#70091f]/5 px-2 py-1 text-[10px] font-bold text-[#70091f] hover:bg-[#70091f]/10 dark:border-[#f8a598]/40 dark:text-[#f8a598] transition cursor-pointer"
                                                                    title="Make requisition request (rqst)"
                                                                >
                                                                    <FileText size={11} />
                                                                    <span>rqst</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => openEditForm(medicine)}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e8dfd4] text-[#8a6f50] transition hover:bg-[#f3ebdf] dark:border-stone-700 dark:hover:bg-stone-800"
                                                                    title="Edit medicine"
                                                                >
                                                                    <Pencil size={13} />
                                                                </button>

                                                                <button
                                                                    onClick={() => deleteMedicine(medicine)}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/40"
                                                                    title="Delete medicine"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Expandable FEFO Batch Drawer */}
                                                    {isExpanded && activeBatches.length > 0 && (
                                                        <tr key={`${medicine.id}-batches`} className="bg-[#fcfaf6] dark:bg-[#1a1511] border-b border-[#e8dfd4] dark:border-[#382f25]">
                                                            <td colSpan={8} className="p-3 sm:p-4">
                                                                <div className="rounded-xl border border-[#e8dfd4] bg-white p-3.5 shadow-sm dark:border-[#42362b] dark:bg-[#251f19]">
                                                                    <div className="mb-2.5 flex items-center justify-between border-b border-[#eee7de] pb-2 dark:border-[#382f25] flex-wrap gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#70091f]/10 text-[#70091f] dark:text-[#f8a598]">
                                                                                <Package size={13} />
                                                                            </div>
                                                                            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                                                                Active Batches for {medicine.medicine_name}
                                                                            </h4>
                                                                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                                                                Combined Stock: {medicine.stock} {medicine.unit}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[10px] font-medium text-[#70091f] dark:text-[#f8a598]">
                                                                            ⚡ Automatic FEFO Issuing Order: Nearest to expire is dispensed first
                                                                        </span>
                                                                    </div>

                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-left text-xs">
                                                                            <thead>
                                                                                <tr className="border-b border-[#eee7de] text-[10px] font-bold text-[#887d70] uppercase dark:border-[#382f25]">
                                                                                    <th className="pb-1.5 pt-1 px-2.5">FEFO Order</th>
                                                                                    <th className="pb-1.5 pt-1 px-2.5">Batch Identifier</th>
                                                                                    <th className="pb-1.5 pt-1 px-2.5">Remaining Stock</th>
                                                                                    <th className="pb-1.5 pt-1 px-2.5">Expiration Date</th>
                                                                                    <th className="pb-1.5 pt-1 px-2.5">Date Added</th>
                                                                                    <th className="pb-1.5 pt-1 px-2.5">Status</th>
                                                                                    <th className="pb-1.5 pt-1 px-2.5">Supplier / Remarks</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                                                                {activeBatches.map((batch: any, bIdx: number) => {
                                                                                    const bExp = getExpirationInfo(batch.expiration_date);
                                                                                    const isFefoFirst = bIdx === 0;

                                                                                    return (
                                                                                        <tr key={batch.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                                                                                            <td className="py-2 px-2.5">
                                                                                                {isFefoFirst ? (
                                                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                                                        ★ 1st to Dispense (FEFO)
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                                                                                        #{bIdx + 1} in Line
                                                                                                    </span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="py-2 px-2.5 font-mono font-bold text-stone-800 dark:text-stone-200">
                                                                                                {batch.batch_number || `BATCH-${batch.id}`}
                                                                                            </td>
                                                                                            <td className="py-2 px-2.5">
                                                                                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                                                                                    {batch.current_quantity}
                                                                                                </span>
                                                                                                <span className="text-[10px] text-stone-500 ml-1">
                                                                                                    / {batch.initial_quantity || batch.current_quantity} {medicine.unit}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="py-2 px-2.5">
                                                                                                <span className="font-medium text-stone-700 dark:text-stone-300">
                                                                                                    {batch.expiration_date ? String(batch.expiration_date).split("T")[0] : "—"}
                                                                                                </span>
                                                                                                {bExp.days !== null && (
                                                                                                    <span className="ml-1 text-[10px] text-stone-400">
                                                                                                        ({bExp.days > 0 ? `${bExp.days}d left` : `${Math.abs(bExp.days)}d ago`})
                                                                                                    </span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="py-2 px-2.5 text-stone-600 dark:text-stone-400">
                                                                                                {batch.date_added ? String(batch.date_added).split("T")[0] : "—"}
                                                                                            </td>
                                                                                            <td className="py-2 px-2.5">
                                                                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                                                                                    batch.status === "Expired"
                                                                                                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                                                                                        : batch.status === "Expiring Soon"
                                                                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                                                                        : batch.status === "Near Expiration"
                                                                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300"
                                                                                                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                                                                }`}>
                                                                                                    {batch.status || "Good"}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="py-2 px-2.5 text-[10px] text-stone-500 dark:text-stone-400">
                                                                                                {batch.supplier ? `${batch.supplier} ` : ""}
                                                                                                {batch.remarks ? `(${batch.remarks})` : (batch.supplier ? "" : "—")}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        }
                                    )
                                )}

                            </tbody>

                        </table>
                    </div>

                    {/* Mobile Medicine Card View */}
                    <div className="block md:hidden divide-y divide-[#eee7de] p-3 space-y-3 dark:divide-[#382f25]">
                        {loading ? (
                            <div className="py-8 text-center text-xs text-[#887d70]">Loading medicines...</div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="py-8 text-center text-xs font-semibold text-[#887d70]">No medicines found</div>
                        ) : (
                            filteredMedicines.map((medicine) => {
                                const status = getStatus(medicine);
                                const exp = getExpirationInfo(medicine.expiration_date);
                                const activeBatches = medicine.active_batches || [];
                                const isExpanded = !!expandedMedicineIds[medicine.id];

                                return (
                                    <div
                                        key={medicine.id}
                                        className="rounded-xl border border-[#e8dfd4] bg-white p-3.5 shadow-xs dark:border-[#4e4234] dark:bg-[#261f19]"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3ebdf] text-[#8a6f50]">
                                                    <Pill size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-[#302820] dark:text-[#f8f3eb]">
                                                        {medicine.medicine_name}
                                                    </h3>
                                                    {medicine.description && (
                                                        <p className="line-clamp-1 text-[10px] text-[#a99d8f]">
                                                            {medicine.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${status.className}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-lg bg-[#fcfaf6] p-2 dark:bg-[#211c17]">
                                                <span className="block text-[10px] text-[#887d70]">Stock Level</span>
                                                <span className="font-bold text-[#302820] dark:text-[#f8f3eb]">
                                                    {medicine.stock} {medicine.unit}
                                                </span>
                                                <span className="block text-[9px] text-[#a99d8f]">
                                                    {activeBatches.length > 1 ? `${activeBatches.length} batches combined` : `Min: ${medicine.minimum_stock}`}
                                                </span>
                                            </div>

                                            <div className="rounded-lg bg-[#fcfaf6] p-2 dark:bg-[#211c17]">
                                                <span className="block text-[10px] text-[#887d70]">Treatment</span>
                                                <span className="font-semibold text-[#8a6f50] truncate block">
                                                    {medicine.treatment_type || "General"}
                                                </span>
                                                <span className="block text-[9px] text-[#a99d8f]">
                                                    {exp.formattedDate ? `Exp: ${exp.formattedDate}` : "No expiry"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobile Active Batches Accordion */}
                                        {activeBatches.length > 1 && (
                                            <div className="mt-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpandBatches(medicine.id)}
                                                    className="w-full inline-flex items-center justify-between rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] px-2.5 py-1.5 text-[11px] font-bold text-[#70091f] dark:border-[#382f25] dark:bg-[#1f1914] dark:text-[#f8a598]"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <Package size={13} />
                                                        <span>{activeBatches.length} Batches (FEFO Tracking)</span>
                                                    </span>
                                                    <ChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-2 space-y-2 rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] p-2.5 dark:border-[#382f25] dark:bg-[#1a1511]">
                                                        {activeBatches.map((batch: any, bIdx: number) => {
                                                            const bExp = getExpirationInfo(batch.expiration_date);
                                                            return (
                                                                <div key={batch.id} className="rounded-md border border-stone-200 bg-white p-2 text-xs shadow-2xs dark:border-stone-800 dark:bg-[#251f19]">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                                                                            {batch.batch_number || `BATCH-${batch.id}`}
                                                                        </span>
                                                                        {bIdx === 0 ? (
                                                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                                ★ FEFO #1
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] text-stone-500">#{bIdx + 1} in Line</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1 flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300">
                                                                        <span>Qty: <strong>{batch.current_quantity} {medicine.unit}</strong></span>
                                                                        <span>Exp: <strong>{batch.expiration_date ? String(batch.expiration_date).split("T")[0] : "—"}</strong></span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#eee7de] pt-2.5 dark:border-[#382f25]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTrendMedicineId(medicine.id);
                                                    setMainTab("trend");
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-[#e8dfd4] px-2 py-1 text-[10px] font-bold text-stone-700 hover:bg-[#f6f0e6] dark:border-stone-700 dark:text-stone-300 transition"
                                                title="See stock trend chart"
                                            >
                                                <TrendingUp size={11} className="text-emerald-600" />
                                                <span>Trend</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRequisitionMed(medicine);
                                                    setRequisitionModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-[#70091f]/30 bg-[#70091f]/5 px-2 py-1 text-[10px] font-bold text-[#70091f] hover:bg-[#70091f]/10 dark:border-[#f8a598]/40 dark:text-[#f8a598] transition"
                                                title="Make requisition request (rqst)"
                                            >
                                                <FileText size={11} />
                                                <span>rqst</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditForm(medicine)}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e8dfd4] text-[#8a6f50] transition hover:bg-[#f3ebdf]"
                                                title="Edit medicine"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteMedicine(medicine)}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50"
                                                title="Delete medicine"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e8dfd4] px-4 py-3 text-xs sm:text-sm text-stone-700 dark:border-stone-800 dark:text-stone-300">
                        <span className="font-semibold text-center sm:text-left">
                            {pagination.total} medicine(s) · Page <span className="font-bold text-[#70091f] dark:text-[#f8a598]">{pagination.current_page}</span> of <span className="font-bold">{pagination.last_page || 1}</span>
                        </span>
                        <div className="flex items-center justify-center sm:justify-end gap-2">
                            <button
                                type="button"
                                disabled={pagination.current_page <= 1}
                                onClick={() => loadMedicines(pagination.current_page - 1, search)}
                                className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:bg-stone-50 hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-black dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 dark:disabled:border-stone-800 dark:disabled:bg-stone-900/60 dark:disabled:text-white cursor-pointer"
                            >
                                <ChevronLeft size={14} strokeWidth={2.5} />
                                <span>Previous</span>
                            </button>

                            <button
                                type="button"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => loadMedicines(pagination.current_page + 1, search)}
                                className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:bg-stone-50 hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-black dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 dark:disabled:border-stone-800 dark:disabled:bg-stone-900/60 dark:disabled:text-white cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                    </>
                    )}
                </section>

            </main>


            <MedicineModal
                showForm={showForm}
                closeForm={closeForm}
                editingMedicine={editingMedicine}
                form={form}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                saving={saving}
                error={error}
                treatmentTypes={TREATMENT_TYPES}
                existingMedicines={medicines}
                onSelectMedicineTemplate={handleSelectMedicineTemplate}
            />

            {/* Medicine Requisition Request Modal (rqst) */}
            <MedicineRequisitionModal
                isOpen={requisitionModalOpen}
                onClose={() => setRequisitionModalOpen(false)}
                medicine={selectedRequisitionMed}
                allMedicines={medicines}
                onSuccess={(msg) => {
                    setSuccessMessage(msg);
                    loadMedicines(pagination.current_page, search, statusFilter);
                }}
            />

            {/* Restore Deleted Medicines Modal */}
            <RestoreMedicinesModal
                open={showRestoreModal}
                onClose={() => setShowRestoreModal(false)}
                onRestored={() => loadMedicines(pagination.current_page, search, statusFilter)}
            />

            {/* Confirmation Modal to Move Medicine to Trash */}
            {confirmDeleteMedicine && (
                <ConfirmationModal
                    open={Boolean(confirmDeleteMedicine)}
                    title="Move Medicine to Trash"
                    message={`Are you sure you want to move "${confirmDeleteMedicine.medicine_name}" to trash?`}
                    confirmText="Move to Trash"
                    cancelText="Cancel"
                    danger={true}
                    loading={isDeleting}
                    onClose={() => {
                        if (!isDeleting) setConfirmDeleteMedicine(null);
                    }}
                    onConfirm={handleExecuteDelete}
                />
            )}
        </div>
    );
}

export default Medicine;
