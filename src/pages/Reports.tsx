import { useEffect, useState, useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import api from "../services/api";
import { getCachedRecord, invalidateRecordCache } from "../services/recordCache";
import {
    exportMonthlyReportPDF,
    exportMedicineInventoryReportPDF,
} from "../utils/pdfExport";
import { formatNA, formatDate } from "../utils/formatters";
import { ReasonBadge } from "../utils/reasonColors";
import tccLogo from "../assets/tcc-logo.png";

import {
    FileText,
    Printer,
    Download,
    Users,
    Activity,
    Pill,
    CalendarDays,
    AlertCircle,
    Stethoscope,
    HeartPulse,
    CheckCircle2,
    Search,
    Filter,
    Calendar,
    Boxes,
    AlertTriangle,
    RotateCcw,
} from "lucide-react";

type ReportPeriod = {
    month: number;
    year: number;
    month_name: string;
    period: string;
    generated_at: string;
};

type ReportSummary = {
    total_visits: number;
    student_visits: number;
    students_treated?: number;
    faculty_visits: number;
    staff_visits: number;
};

type VisitReason = { reason: string; count: number };
type CommonIllness = { illness: string; count: number };
type MedicineUsage = {
    medicine_id: number | null;
    medicine_name: string;
    unit: string;
    quantity_used: number;
};
type NurseActivity = {
    nurse_id: number | null;
    name: string;
    visits: number;
};
type VisitRecord = {
    id: number;
    date: string;
    person: string;
    person_type: string;
    department?: string | null;
    reason: string | null;
    symptoms?: string | null;
    temperature?: string | null;
    blood_pressure?: string | null;
    medicine: string | null;
    medicine_quantity: number | string | null;
    nurse: string | null;
};
type MonthlyReport = {
    report: ReportPeriod;
    summary: ReportSummary;
    reasons: VisitReason[];
    common_illnesses?: CommonIllness[];
    medicine_usage: MedicineUsage[];
    daily_visits: DailyVisitItem[];
    nurse_activity: NurseActivity[];
    visits: VisitRecord[];
};

type MedicineItem = {
    id: number;
    name: string;
    category?: string;
    unit: string;
    current_stock: number;
    alert_threshold: number;
    expiration_date?: string;
    total_dispensed?: number;
    status?: string;
};

type MedicineReportData = {
    summary: {
        total_medicines: number;
        total_units_in_stock: number;
        out_of_stock_count: number;
        low_stock_count: number;
        expired_count: number;
        expiring_soon_count: number;
        total_units_dispensed: number;
    };
    medicines: MedicineItem[];
    generated_at?: string;
};

type TabView = "monthly" | "custom" | "medicine";

function Reports() {
    const currentDate = new Date();

    const [activeTab, setActiveTab] = useState<TabView>("monthly");

    // Monthly selector state
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    // Date Range state
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [patientTypeFilter, setPatientTypeFilter] = useState<string>("all");
    const [visitSearch, setVisitSearch] = useState<string>("");

    // Monthly/Custom Data State
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Medicine Report State
    const [medicineData, setMedicineData] = useState<MedicineReportData | null>(null);
    const [medicineLoading, setMedicineLoading] = useState(false);
    const [medicineError, setMedicineError] = useState("");
    const [medicineSearch, setMedicineSearch] = useState("");
    const [medicineStatusFilter, setMedicineStatusFilter] = useState("all");

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    // Fetch Monthly Report
    const generateMonthlyReport = async (targetMonth = month, targetYear = year, force = false) => {
        setLoading(true);
        setError("");

        try {
            if (force) {
                invalidateRecordCache();
            }

            const fetchReport = () =>
                api.get<MonthlyReport>("/reports/monthly", {
                    params: {
                        month: targetMonth,
                        year: targetYear,
                    },
                });

            const response = force
                ? await fetchReport()
                : await getCachedRecord(
                    `reports:monthly:${targetYear}:${targetMonth}`,
                    fetchReport
                );

            setReport(response.data);
        } catch (err: any) {
            console.error("REPORT ERROR:", err);
            setReport(null);
            setError(
                err?.response?.data?.message ||
                    "Unable to generate the monthly report."
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch Date-Range Report
    const generateCustomRangeReport = async () => {
        setLoading(true);
        setError("");

        try {
            const params: any = {
                start_date: startDate,
                end_date: endDate,
            };
            if (patientTypeFilter !== "all") {
                params.patient_type = patientTypeFilter;
            }

            const response = await api.get<MonthlyReport>("/reports/monthly", { params });
            setReport(response.data);
        } catch (err: any) {
            console.error("CUSTOM REPORT ERROR:", err);
            setReport(null);
            setError(
                err?.response?.data?.message ||
                    "Unable to generate consultation report for the selected date range."
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch Medicine Inventory Report
    const fetchMedicineReport = async () => {
        setMedicineLoading(true);
        setMedicineError("");

        try {
            const response = await api.get<MedicineReportData>("/reports/medicine");
            setMedicineData(response.data);
        } catch (err: any) {
            console.error("MEDICINE REPORT ERROR:", err);
            setMedicineData(null);
            setMedicineError(
                err?.response?.data?.message ||
                    "Unable to load medicine inventory & dispensing report."
            );
        } finally {
            setMedicineLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "monthly") {
            generateMonthlyReport();
        } else if (activeTab === "custom") {
            generateCustomRangeReport();
        } else if (activeTab === "medicine") {
            fetchMedicineReport();
        }
    }, [activeTab]);

    const handleMonthChange = (newMonth: number) => {
        setMonth(newMonth);
        generateMonthlyReport(newMonth, year, true);
    };

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        generateMonthlyReport(month, newYear, true);
    };

    // Quick presets for Date-Range
    const handlePresetDate = (daysAgo: number) => {
        const end = new Date();
        const start = new Date();
        if (daysAgo === 0) {
            // Today
            const todayStr = end.toISOString().slice(0, 10);
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (daysAgo === -1) {
            // First day of current month to today
            start.setDate(1);
            setStartDate(start.toISOString().slice(0, 10));
            setEndDate(end.toISOString().slice(0, 10));
        } else {
            start.setDate(end.getDate() - daysAgo);
            setStartDate(start.toISOString().slice(0, 10));
            setEndDate(end.toISOString().slice(0, 10));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        if (activeTab === "medicine") {
            if (!medicineData) return;
            exportMedicineInventoryReportPDF(medicineData);
        } else {
            if (!report) return;
            exportMonthlyReportPDF(report);
        }
    };

    const summary = report?.summary ?? {
        total_visits: 0,
        student_visits: 0,
        students_treated: 0,
        faculty_visits: 0,
        staff_visits: 0,
    };

    const reasons = report?.reasons || [];
    const commonIllnesses = report?.common_illnesses || [];
    const maximumReasonCount = Math.max(1, ...reasons.map((r) => Number(r.count || 0)));
    const medicineUsage = report?.medicine_usage || [];
    const nurseActivity = report?.nurse_activity || [];
    const dailyVisits = report?.daily_visits || [];
    const rawVisits = report?.visits || [];

    // Filtered visits by search query
    const filteredVisits = useMemo(() => {
        if (!visitSearch.trim()) return rawVisits;
        const q = visitSearch.toLowerCase();
        return rawVisits.filter((v) =>
            (v.person && v.person.toLowerCase().includes(q)) ||
            (v.person_type && v.person_type.toLowerCase().includes(q)) ||
            (v.department && v.department.toLowerCase().includes(q)) ||
            (v.reason && v.reason.toLowerCase().includes(q)) ||
            (v.symptoms && v.symptoms.toLowerCase().includes(q)) ||
            (v.nurse && v.nurse.toLowerCase().includes(q)) ||
            (v.medicine && v.medicine.toLowerCase().includes(q))
        );
    }, [rawVisits, visitSearch]);

    // Filtered medicines
    const filteredMedicines = useMemo(() => {
        if (!medicineData?.medicines) return [];
        let items = medicineData.medicines;

        if (medicineStatusFilter !== "all") {
            items = items.filter((m) => {
                const s = (m.status || "").toLowerCase();
                if (medicineStatusFilter === "low_stock") return s.includes("low");
                if (medicineStatusFilter === "out_of_stock") return s.includes("out") || m.current_stock === 0;
                if (medicineStatusFilter === "expired") return s.includes("expired");
                if (medicineStatusFilter === "in_stock") return s.includes("in stock");
                return true;
            });
        }

        if (medicineSearch.trim()) {
            const q = medicineSearch.toLowerCase();
            items = items.filter((m) =>
                m.name.toLowerCase().includes(q) ||
                (m.category && m.category.toLowerCase().includes(q)) ||
                (m.unit && m.unit.toLowerCase().includes(q))
            );
        }

        return items;
    }, [medicineData, medicineSearch, medicineStatusFilter]);

    return (
        <div
            id="reports-page"
            className="tcc-module-page min-h-screen w-full px-3.5 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
        >
            {/* Header */}
            <div className="tcc-module-header mb-5 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#70091f] text-white shadow-md">
                        <FileText size={24} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">
                            Reports & Clinical Analytics
                        </h1>
                        <p className="text-xs text-stone-500">
                            Tagoloan Community College · Health Services Clinic
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={activeTab === "medicine" ? (!medicineData || medicineLoading) : (!report || loading)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#70091f]/20 hover:bg-[#8b1505] disabled:opacity-50 transition"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>

                    <button
                        onClick={handlePrint}
                        disabled={activeTab === "medicine" ? (!medicineData || medicineLoading) : (!report || loading)}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:opacity-50 transition"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-5 flex flex-wrap gap-2 border-b border-stone-200 pb-3 print:hidden">
                <button
                    type="button"
                    onClick={() => setActiveTab("monthly")}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        activeTab === "monthly"
                            ? "bg-[#70091f] text-white shadow-sm"
                            : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                    }`}
                >
                    <Calendar size={16} />
                    Monthly Activity & Trends
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("custom")}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        activeTab === "custom"
                            ? "bg-[#70091f] text-white shadow-sm"
                            : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                    }`}
                >
                    <CalendarDays size={16} />
                    Date-Range Consultation Log
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("medicine")}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        activeTab === "medicine"
                            ? "bg-[#70091f] text-white shadow-sm"
                            : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                    }`}
                >
                    <Boxes size={16} />
                    Medicine Inventory & Dispensing
                </button>
            </div>

            {/* Tab 1: Monthly Controls */}
            {activeTab === "monthly" && (
                <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm print:hidden">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-[#8a6f50]" />
                            <h2 className="font-bold text-stone-800">
                                Select Month & Year
                            </h2>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                            {loading ? (
                                <span className="flex items-center gap-1.5 font-medium text-[#70091f]">
                                    <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-[#70091f] border-t-transparent" />
                                    Loading report...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    Live Database Records
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase text-stone-500">
                                Month
                            </label>
                            <select
                                value={month}
                                onChange={(e) => handleMonthChange(Number(e.target.value))}
                                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                            >
                                {monthNames.map((name, index) => (
                                    <option key={name} value={index + 1}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase text-stone-500">
                                Year
                            </label>
                            <select
                                value={year}
                                onChange={(e) => handleYearChange(Number(e.target.value))}
                                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                            >
                                {Array.from({ length: 7 }, (_, index) => currentDate.getFullYear() - 3 + index).map((itemYear) => (
                                    <option key={itemYear} value={itemYear}>
                                        {itemYear}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pb-1 text-xs text-stone-500">
                            Viewing summary for <span className="font-semibold text-stone-800">{monthNames[month - 1]} {year}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Date-Range Controls */}
            {activeTab === "custom" && (
                <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm print:hidden">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CalendarDays size={18} className="text-[#8a6f50]" />
                            <h2 className="font-bold text-stone-800">
                                Custom Consultation Date Range
                            </h2>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-stone-400 mr-1">Presets:</span>
                            <button
                                type="button"
                                onClick={() => handlePresetDate(0)}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetDate(7)}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                            >
                                Past 7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetDate(-1)}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePresetDate(30)}
                                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                            >
                                Past 30 Days
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase text-stone-500">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase text-stone-500">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase text-stone-500">
                                Patient Classification
                            </label>
                            <select
                                value={patientTypeFilter}
                                onChange={(e) => setPatientTypeFilter(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                            >
                                <option value="all">All Patients</option>
                                <option value="student">Students Only</option>
                                <option value="faculty">Faculty Only</option>
                                <option value="staff">Staff Only</option>
                            </select>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={() => generateCustomRangeReport()}
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#70091f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#8b1505] disabled:opacity-50 transition"
                            >
                                <Filter size={15} />
                                {loading ? "Filtering..." : "Apply Range"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 3: Medicine Controls */}
            {activeTab === "medicine" && (
                <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm print:hidden">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Boxes size={18} className="text-[#8a6f50]" />
                            <h2 className="font-bold text-stone-800">
                                Inventory & Dispensing Audit
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={fetchMedicineReport}
                            disabled={medicineLoading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
                        >
                            <RotateCcw size={13} className={medicineLoading ? "animate-spin" : ""} />
                            Refresh Stock Data
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end">
                        <div className="relative">
                            <label className="mb-1.5 block text-xs font-semibold uppercase text-stone-500">
                                Search Medicine
                            </label>
                            <div className="relative">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder="Search medicine name, category..."
                                    value={medicineSearch}
                                    onChange={(e) => setMedicineSearch(e.target.value)}
                                    className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3.5 py-2 text-sm text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase text-stone-500">
                                Stock Status Filter
                            </label>
                            <select
                                value={medicineStatusFilter}
                                onChange={(e) => setMedicineStatusFilter(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                            >
                                <option value="all">All Statuses ({medicineData?.medicines?.length || 0})</option>
                                <option value="low_stock">Low Stock Alerts</option>
                                <option value="out_of_stock">Out of Stock</option>
                                <option value="expired">Expired Batches</option>
                                <option value="in_stock">In Stock / Healthy</option>
                            </select>
                        </div>

                        <div className="text-xs text-stone-500 pb-2">
                            Showing <span className="font-bold text-[#70091f]">{filteredMedicines.length}</span> of {medicineData?.medicines?.length || 0} inventory items
                        </div>
                    </div>
                </div>
            )}

            {/* Errors */}
            {(error || medicineError) && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800">Report Notice</p>
                        <p className="mt-0.5 text-sm text-red-700">{error || medicineError}</p>
                    </div>
                </div>
            )}

            {/* TAB 1 & 2: CONSULTATION REPORTS (Monthly or Custom) */}
            {(activeTab === "monthly" || activeTab === "custom") && report && (
                <div id="report-print-area" className="report-paper space-y-5">
                    {/* Official Letterhead */}
                    <div className="report-letterhead rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm sm:p-7 print:rounded-none">
                        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-black uppercase tracking-wider text-[#70091f]">
                                    TAGOLOAN COMMUNITY COLLEGE
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wide text-stone-600">
                                    HEALTH SERVICES CLINIC — CAMPUS CLINIC MANAGEMENT SYSTEM
                                </div>
                                <div className="text-[11px] text-stone-400">
                                    Baluarte, Tagoloan, Misamis Oriental · clinic@tcc.edu.ph
                                </div>
                                <h1 className="pt-2 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                                    {activeTab === "monthly"
                                        ? "MONTHLY CLINIC ACTIVITY & HEALTH REPORT"
                                        : "CLINIC CONSULTATION & PATIENT VISITS REPORT"}
                                </h1>
                                <p className="text-xs font-medium text-stone-500">
                                    Report Period:{" "}
                                    <span className="font-bold text-[#70091f] uppercase">
                                        {activeTab === "monthly"
                                            ? report.report?.period || `${monthNames[month - 1]} ${year}`
                                            : `${formatDate(startDate)} to ${formatDate(endDate)}`}
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-start">
                                <div className="report-period-box rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-4 py-2.5 text-right print:rounded-none">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500">Reporting Scope</p>
                                    <p className="text-sm font-bold text-[#70091f] uppercase">
                                        {activeTab === "monthly"
                                            ? report.report?.period || `${monthNames[month - 1]} ${year}`
                                            : `${formatDate(startDate)} - ${formatDate(endDate)}`}
                                    </p>
                                </div>
                                <img
                                    src={tccLogo}
                                    alt="Tagoloan Community College Logo"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        if (!target.dataset.fallback) {
                                            target.dataset.fallback = "1";
                                            target.src = "/tcc-logo.png";
                                        } else if (target.dataset.fallback === "1") {
                                            target.dataset.fallback = "2";
                                            target.src = "/tcc-logo.jpg";
                                        }
                                    }}
                                    className="h-16 w-16 rounded-full border border-stone-200 bg-white object-contain p-1 shadow-sm sm:h-20 sm:w-20"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-[#e8dfd4] pt-4 text-xs text-stone-500">
                            <p><span className="font-semibold text-stone-700">Generated:</span> {formatGeneratedAt(report.report?.generated_at)}</p>
                            <p><span className="font-semibold text-stone-700">Total Records:</span> {Number(rawVisits.length).toLocaleString()}</p>
                            <p><span className="font-semibold text-stone-700">Scope:</span> Verified clinic consultation entries from database</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <section className="report-summary-grid grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        <SummaryCard title="Total Consultations" value={summary.total_visits || 0} icon={<Activity size={21} />} />
                        <SummaryCard title="Students Treated" value={summary.students_treated ?? summary.student_visits ?? 0} icon={<Users size={21} />} />
                        <SummaryCard title="Student Visits" value={summary.student_visits || 0} icon={<Users size={21} />} />
                        <SummaryCard title="Faculty Consultations" value={summary.faculty_visits || 0} icon={<Users size={21} />} />
                        <SummaryCard title="Staff Consultations" value={summary.staff_visits || 0} icon={<Users size={21} />} />
                    </section>

                    {/* Daily Visits Chart only for Monthly view */}
                    {activeTab === "monthly" && (
                        <section className="report-panel">
                            <DailyVisitsChart
                                data={dailyVisits}
                                visits={rawVisits}
                                summary={summary}
                                month={month}
                                year={year}
                                period={report.report?.period || `${monthNames[month - 1]} ${year}`}
                            />
                        </section>
                    )}

                    {/* Detailed Breakdowns (Reasons, Illnesses, Medicine, Nurse) */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <section className="report-panel rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3ebdf] text-[#8a6f50]">
                                    <Stethoscope size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">Visit Reasons</h2>
                                    <p className="text-xs text-stone-500">{reasons.length} categories recorded</p>
                                </div>
                            </div>
                            {reasons.length === 0 ? (
                                <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">No visit reasons recorded.</p>
                            ) : (
                                <div className="space-y-3">
                                    {reasons.slice(0, 7).map((item) => {
                                        const count = Number(item.count || 0);
                                        return (
                                            <div key={item.reason}>
                                                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                                                    <span className="truncate font-medium text-stone-700">{formatNA(item.reason)}</span>
                                                    <span className="shrink-0 font-bold text-[#8a6f50]">{count}</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                                                    <div className="h-full rounded-full bg-[#8a6f50]" style={{ width: `${(count / maximumReasonCount) * 100}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="report-panel rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                                    <HeartPulse size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">Common Complaints</h2>
                                    <p className="text-xs text-stone-500">Symptoms & illnesses</p>
                                </div>
                            </div>
                            {commonIllnesses.length === 0 ? (
                                <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">No specific complaints recorded.</p>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {commonIllnesses.slice(0, 7).map((item) => (
                                        <div key={item.illness} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                            <span className="truncate text-sm font-medium text-stone-700">{formatNA(item.illness)}</span>
                                            <span className="shrink-0 rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">{item.count} cases</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="report-panel rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
                                    <Pill size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">Medicine Dispensed</h2>
                                    <p className="text-xs text-stone-500">During reporting window</p>
                                </div>
                            </div>
                            {medicineUsage.length === 0 ? (
                                <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">No medicine usage recorded.</p>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {medicineUsage.slice(0, 7).map((item) => (
                                        <div key={item.medicine_id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                            <span className="truncate text-sm font-medium text-stone-700">{formatNA(item.medicine_name)}</span>
                                            <span className="shrink-0 rounded-lg bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                                                {Number(item.quantity_used || 0).toLocaleString()} {item.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="report-panel rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3ebdf] text-[#8a6f50]">
                                    <Users size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">Attending Personnel</h2>
                                    <p className="text-xs text-stone-500">Consultations attended</p>
                                </div>
                            </div>
                            {nurseActivity.length === 0 ? (
                                <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">No staff activity recorded.</p>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {nurseActivity.map((item) => (
                                        <div key={item.nurse_id || item.name} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                            <span className="truncate text-sm font-medium text-stone-700">{formatNA(item.name)}</span>
                                            <span className="shrink-0 text-sm font-bold text-[#8a6f50]">{Number(item.visits || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Visit Register Table */}
                    <section className="report-panel report-register overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-sm">
                        <div className="border-b border-[#e8dfd4] px-5 py-4 sm:px-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6f50]">Consultation Log</p>
                            <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-stone-900">Clinic Visit Register</h2>
                                    <p className="text-xs text-stone-500">
                                        Showing {filteredVisits.length.toLocaleString()} of {rawVisits.length.toLocaleString()} entries
                                    </p>
                                </div>

                                <div className="relative print:hidden w-full sm:w-64">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="text"
                                        placeholder="Search patient, nurse, illness..."
                                        value={visitSearch}
                                        onChange={(e) => setVisitSearch(e.target.value)}
                                        className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-8 pr-3 py-1.5 text-xs text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block print:block overflow-x-auto scrollbar-thin">
                            <table className="report-visit-table w-full min-w-[760px] lg:min-w-full table-fixed">
                                <colgroup>
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "18%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "18%" }} />
                                    <col style={{ width: "18%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "12%" }} />
                                </colgroup>
                                <thead>
                                    <tr className="bg-stone-50 text-left">
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Date</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Patient</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Type</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Department</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Reason / Symptoms</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Medicine</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Attending Staff</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVisits.length > 0 ? (
                                        filteredVisits.map((visit) => (
                                            <tr key={visit.id} className="border-t border-stone-100 hover:bg-stone-50/50">
                                                <td className="px-4 py-3 text-sm text-stone-600">{formatVisitDate(visit.date)}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-stone-800">{formatNA(visit.person)}</td>
                                                <td className="px-4 py-3 text-sm text-stone-600">
                                                    <span className="capitalize">{formatNA(visit.person_type)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-stone-600">{formatNA(visit.department)}</td>
                                                <td className="px-4 py-3 text-sm text-stone-700">
                                                    <ReasonBadge reason={visit.reason} symptoms={visit.symptoms} />
                                                </td>
                                                <td className="px-4 py-3 text-sm text-stone-600">
                                                    {visit.medicine ? `${visit.medicine}${visit.medicine_quantity ? ` (${visit.medicine_quantity})` : ""}` : "None"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-stone-600">{formatNA(visit.nurse)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-500">
                                                No clinic consultations found matching the criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Visit Card View */}
                        <div className="block md:hidden print:hidden divide-y divide-[#eee7de] p-3 space-y-3">
                            {filteredVisits.length > 0 ? (
                                filteredVisits.map((visit) => (
                                    <div
                                        key={visit.id}
                                        className="rounded-xl border border-[#e8dfd4] bg-white p-3.5 shadow-xs"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[11px] font-semibold text-stone-500">
                                                    {formatVisitDate(visit.date)}
                                                </span>
                                                <h3 className="text-sm font-bold text-stone-900">
                                                    {formatNA(visit.person)}
                                                </h3>
                                            </div>
                                            <span className="inline-flex rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-600">
                                                {formatNA(visit.person_type)}
                                            </span>
                                        </div>

                                        <div className="mt-2.5 space-y-1.5 text-xs text-stone-600">
                                            <div className="flex items-center justify-between">
                                                <span className="text-stone-400">Department:</span>
                                                <span className="font-medium text-stone-700">{formatNA(visit.department)}</span>
                                            </div>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-stone-400 shrink-0">Reason:</span>
                                                <div className="text-right">
                                                    <ReasonBadge reason={visit.reason} symptoms={visit.symptoms} />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-stone-400">Medicine:</span>
                                                <span className="font-medium text-stone-700">
                                                    {visit.medicine ? `${visit.medicine}${visit.medicine_quantity ? ` (${visit.medicine_quantity})` : ""}` : "None"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-stone-400">Attending Staff:</span>
                                                <span className="font-medium text-stone-700">{formatNA(visit.nurse)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="px-5 py-8 text-center text-sm text-stone-500">
                                    No clinic consultations found matching the criteria.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Official Signatures Block */}
                    <ReportSignatureBlock periodLabel={activeTab === "monthly" ? report.report?.period : `${formatDate(startDate)} - ${formatDate(endDate)}`} />
                </div>
            )}

            {/* TAB 3: MEDICINE INVENTORY & DISPENSING REPORT */}
            {activeTab === "medicine" && medicineData && (
                <div id="report-print-area" className="report-paper space-y-5">
                    {/* Letterhead */}
                    <div className="report-letterhead rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm sm:p-7 print:rounded-none">
                        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-black uppercase tracking-wider text-[#70091f]">
                                    TAGOLOAN COMMUNITY COLLEGE
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wide text-stone-600">
                                    HEALTH SERVICES CLINIC — PHARMACY & INVENTORY CONTROL
                                </div>
                                <div className="text-[11px] text-stone-400">
                                    Baluarte, Tagoloan, Misamis Oriental · clinic@tcc.edu.ph
                                </div>
                                <h1 className="pt-2 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                                    MEDICINE INVENTORY & DISPENSING AUDIT REPORT
                                </h1>
                                <p className="text-xs font-medium text-stone-500">
                                    Status:{" "}
                                    <span className="font-bold text-[#70091f] uppercase">
                                        Active Formulary Audit
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-start">
                                <div className="report-period-box rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-4 py-2.5 text-right print:rounded-none">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500">Inventory Scope</p>
                                    <p className="text-sm font-bold text-[#70091f] uppercase">
                                        Current Stock & Utilization
                                    </p>
                                </div>
                                <img
                                    src={tccLogo}
                                    alt="Tagoloan Community College Logo"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        if (!target.dataset.fallback) {
                                            target.dataset.fallback = "1";
                                            target.src = "/tcc-logo.png";
                                        } else if (target.dataset.fallback === "1") {
                                            target.dataset.fallback = "2";
                                            target.src = "/tcc-logo.jpg";
                                        }
                                    }}
                                    className="h-16 w-16 rounded-full border border-stone-200 bg-white object-contain p-1 shadow-sm sm:h-20 sm:w-20"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-[#e8dfd4] pt-4 text-xs text-stone-500">
                            <p><span className="font-semibold text-stone-700">Audit Timestamp:</span> {formatGeneratedAt(medicineData.generated_at || new Date().toISOString())}</p>
                            <p><span className="font-semibold text-stone-700">Unique Medicines:</span> {medicineData.summary.total_medicines}</p>
                            <p><span className="font-semibold text-stone-700">Total Units Dispensed:</span> {Number(medicineData.summary.total_units_dispensed).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <section className="report-summary-grid grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <SummaryCard title="Total Medicines" value={medicineData.summary.total_medicines} icon={<Boxes size={21} />} />
                        <SummaryCard title="Units in Stock" value={medicineData.summary.total_units_in_stock} icon={<Pill size={21} />} />
                        <SummaryCard title="Units Dispensed" value={medicineData.summary.total_units_dispensed} icon={<Activity size={21} />} />
                        <SummaryCard title="Low Stock Alerts" value={medicineData.summary.low_stock_count} icon={<AlertTriangle size={21} />} />
                        <SummaryCard title="Out of Stock" value={medicineData.summary.out_of_stock_count} icon={<AlertCircle size={21} />} />
                        <SummaryCard title="Expired Items" value={medicineData.summary.expired_count} icon={<AlertCircle size={21} />} />
                    </section>

                    {/* Medicine Table */}
                    <section className="report-panel overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-sm">
                        <div className="border-b border-[#e8dfd4] px-5 py-4 sm:px-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6f50]">Pharmacy Inventory Masterlist</p>
                            <h2 className="text-lg font-bold text-stone-900">Medicine Formulary & Stock Register</h2>
                        </div>

                        <div className="overflow-x-auto scrollbar-thin">
                            <table className="report-visit-table w-full min-w-[760px] lg:min-w-full table-fixed">
                                <colgroup>
                                    <col style={{ width: "6%" }} />
                                    <col style={{ width: "24%" }} />
                                    <col style={{ width: "16%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "10%" }} />
                                </colgroup>
                                <thead>
                                    <tr className="bg-stone-50 text-left">
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">#</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Medicine Name</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Category</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Unit</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500 text-center">In Stock</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500 text-center">Dispensed</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Expiration</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMedicines.length > 0 ? (
                                        filteredMedicines.map((item, idx) => (
                                            <tr key={item.id} className="border-t border-stone-100 hover:bg-stone-50/50">
                                                <td className="px-4 py-3 text-xs font-semibold text-stone-400">{idx + 1}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-stone-900">{formatNA(item.name)}</td>
                                                <td className="px-4 py-3 text-sm text-stone-600">{formatNA(item.category)}</td>
                                                <td className="px-4 py-3 text-sm text-stone-600">{formatNA(item.unit)}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-center">
                                                    <span className={item.current_stock <= item.alert_threshold ? "text-amber-600" : "text-stone-800"}>
                                                        {Number(item.current_stock || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-center text-emerald-700">
                                                    {Number(item.total_dispensed || 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-stone-600">{formatDate(item.expiration_date)}</td>
                                                <td className="px-4 py-3 text-xs font-semibold">
                                                    <span
                                                        className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                                            (item.status || "").toLowerCase().includes("out")
                                                                ? "bg-red-50 text-red-700 border border-red-200"
                                                                : (item.status || "").toLowerCase().includes("expired")
                                                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                                : (item.status || "").toLowerCase().includes("low")
                                                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        }`}
                                                    >
                                                        {item.status || "In Stock"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-10 text-center text-sm text-stone-500">
                                                No medicines match the selected filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Official Signatures Block */}
                    <ReportSignatureBlock periodLabel="Pharmacy Formulary & Inventory Audit" />
                </div>
            )}
        </div>
    );
}

function ReportSignatureBlock({ periodLabel }: { periodLabel?: string }) {
    return (
        <footer className="report-signatures mt-8 rounded-2xl border border-[#e8dfd4] bg-white p-6 shadow-sm break-inside-avoid print:rounded-none print:border-0 print:border-t-2 print:border-stone-400 print:p-0 print:pt-6 print:shadow-none">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#70091f]">
                Official Endorsement & Signatures
            </p>
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between text-xs print:flex-row print:items-start print:justify-between">
                <div className="w-64 max-w-full space-y-1">
                    <p className="font-medium text-stone-500">Prepared by:</p>
                    <div className="w-full border-b border-stone-400 pt-12" />
                    <p className="pt-1 font-bold text-stone-800">Clinic Staff / Attending Nurse</p>
                    <p className="text-[11px] text-stone-500">Health Services Clinic · Tagoloan Community College</p>
                </div>
                <div className="w-64 max-w-full space-y-1">
                    <p className="font-medium text-stone-500">Noted by:</p>
                    <div className="w-full border-b border-stone-400 pt-12" />
                    <p className="pt-1 font-bold text-stone-800">College Administration</p>
                    <p className="text-[11px] text-stone-500">Tagoloan Community College</p>
                </div>
            </div>
            {periodLabel && (
                <p className="mt-4 hidden text-center text-[9px] text-stone-500 print:block">
                    Tagoloan Community College · Health Services Clinic · Campus Clinic Management System · {periodLabel}
                </p>
            )}
        </footer>
    );
}

function formatVisitDate(value: any) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
    if (!match) return value || "—";
    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function formatGeneratedAt(value: any) {
    if (!value) return "—";
    const sqlTimestamp = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(value));
    const date = sqlTimestamp
        ? new Date(
              Number(sqlTimestamp[1]),
              Number(sqlTimestamp[2]) - 1,
              Number(sqlTimestamp[3]),
              Number(sqlTimestamp[4]),
              Number(sqlTimestamp[5]),
              Number(sqlTimestamp[6] || 0)
          )
        : new Date(value);

    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

type DailyVisitItem = {
    date: string;
    count: number | string | null;
};

type DailyVisitsChartProps = {
    data: DailyVisitItem[];
    visits?: VisitRecord[];
    summary?: ReportSummary;
    month: number;
    year: number;
    period?: string;
};

const CHART_TABS = {
    total: {
        label: "Total Visits",
        color: "#70091f",
    },
    students: {
        label: "Students",
        color: "#0284c7",
    },
    employees: {
        label: "Faculty & Staff",
        color: "#059669",
    },
} as const;

type ChartTabKey = keyof typeof CHART_TABS;

function DailyVisitsChart({ data, visits, summary, month, year, period }: DailyVisitsChartProps) {
    const [activeChart, setActiveChart] = useState<ChartTabKey>("total");

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNamesShort = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthShort = monthNamesShort[month - 1] || "Nov";

    const points = useMemo(() => {
        const visitsByDay: Record<number, { total: number; students: number; employees: number }> = {};
        for (let d = 1; d <= daysInMonth; d++) {
            visitsByDay[d] = { total: 0, students: 0, employees: 0 };
        }

        if (Array.isArray(visits) && visits.length > 0) {
            visits.forEach((v) => {
                const dayNum = getDayOfMonth(v.date);
                if (dayNum >= 1 && dayNum <= daysInMonth) {
                    visitsByDay[dayNum].total += 1;
                    const pType = String(v.person_type || "").toLowerCase();
                    if (pType === "student") {
                        visitsByDay[dayNum].students += 1;
                    } else {
                        visitsByDay[dayNum].employees += 1;
                    }
                }
            });
        } else if (Array.isArray(data) && data.length > 0) {
            data.forEach((item) => {
                const dayNum = getDayOfMonth(item.date);
                if (dayNum >= 1 && dayNum <= daysInMonth) {
                    const count = Number(item.count || 0);
                    visitsByDay[dayNum].total = count;
                    visitsByDay[dayNum].students = count;
                }
            });
        }

        return Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const padMonth = String(month).padStart(2, "0");
            const padDay = String(day).padStart(2, "0");
            return {
                date: `${year}-${padMonth}-${padDay}`,
                day,
                formattedDate: `${monthShort} ${day}`,
                total: visitsByDay[day].total,
                students: visitsByDay[day].students,
                employees: visitsByDay[day].employees,
            };
        });
    }, [data, visits, daysInMonth, month, year, monthShort]);

    const totals = useMemo(() => {
        return {
            students: summary?.student_visits ?? points.reduce((acc, curr) => acc + curr.students, 0),
            employees: (summary?.faculty_visits ?? 0) + (summary?.staff_visits ?? 0),
            total: summary?.total_visits ?? points.reduce((acc, curr) => acc + curr.total, 0),
        };
    }, [summary, points]);

    return (
        <div className="report-chart-wrap w-full overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white text-stone-900 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-[#382f25] dark:bg-[#251f19] dark:text-[#f4ecdf]">
            <div className="flex flex-col sm:flex-row items-stretch border-b border-[#e8dfd4] dark:border-[#382f25]">
                <div className="flex flex-1 flex-col justify-center gap-1 p-5 sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6f50] dark:text-[#d4b996]">
                        Daily activity
                    </p>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-[#f4ecdf]">
                        Clinic visits by day
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                        Number of visits · {period || `${monthShort} ${year}`}
                    </p>
                </div>

                <div className="flex border-t border-[#e8dfd4] sm:border-t-0 sm:border-l sm:border-[#e8dfd4] dark:border-[#382f25]">
                    {(["total", "students", "employees"] as ChartTabKey[]).map((key) => {
                        const isActive = activeChart === key;
                        const config = CHART_TABS[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveChart(key)}
                                className={`flex flex-1 sm:min-w-[130px] flex-col justify-center gap-1 px-5 py-4 text-left transition-colors even:border-l even:border-[#e8dfd4] dark:even:border-[#382f25] ${
                                    isActive
                                        ? "bg-[#fcfaf6] text-stone-900 shadow-xs dark:bg-[#30261e] dark:text-stone-100"
                                        : "text-stone-500 hover:bg-stone-50/70 dark:text-stone-400 dark:hover:bg-[#2b221a]"
                                }`}
                            >
                                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                                    {config.label}
                                </span>
                                <span className="text-xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-[#f4ecdf]">
                                    {totals[key].toLocaleString()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={points}
                            margin={{ left: 8, right: 12, top: 12, bottom: 4 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="#e8dfd4"
                                strokeDasharray="3 3"
                            />
                            <YAxis
                                allowDecimals={false}
                                stroke="#a8a29e"
                                tick={{ fill: "#78716c", fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={24}
                                domain={[0, (dataMax) => Math.max(dataMax + 1, 3)]}
                            />
                            <XAxis
                                dataKey="formattedDate"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                minTickGap={28}
                                stroke="#a8a29e"
                                tick={{ fill: "#78716c", fontSize: 11 }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const item = payload[0].payload;
                                    return (
                                        <div className="rounded-xl border border-[#e8dfd4] bg-white p-3 text-xs shadow-lg dark:border-[#382f25] dark:bg-[#251f19]">
                                            <p className="font-semibold text-stone-800 dark:text-stone-200">
                                                {item.date} ({item.formattedDate})
                                            </p>
                                            <p className="mt-1 font-bold" style={{ color: CHART_TABS[activeChart].color }}>
                                                {CHART_TABS[activeChart].label}: {Number(item[activeChart] || 0).toLocaleString()} visits
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Line
                                dataKey={activeChart}
                                type="linear"
                                stroke={CHART_TABS[activeChart].color}
                                strokeWidth={2.5}
                                dot={{
                                    r: 3.5,
                                    fill: CHART_TABS[activeChart].color,
                                    stroke: "#ffffff",
                                    strokeWidth: 1.5,
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: CHART_TABS[activeChart].color,
                                    stroke: "#ffffff",
                                    strokeWidth: 2,
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span>Day of month</span>
                    <span>{totals.total.toLocaleString()} visits recorded this month</span>
                </div>
            </div>
        </div>
    );
}

function getDayOfMonth(value: any) {
    const match = /^\d{4}-\d{2}-(\d{2})/.exec(String(value || ""));
    return match ? Number(match[1]) : Number.NaN;
}

function SummaryCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-stone-500">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-stone-900">
                        {Number(value || 0).toLocaleString()}
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f]">
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default Reports;
