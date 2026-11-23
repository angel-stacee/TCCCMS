import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { getCachedRecord, invalidateRecordCache } from "../services/recordCache";
import { exportMonthlyReportPDF } from "../utils/pdfExport";
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
    AlertCircle,
    Stethoscope,
    HeartPulse,
    CheckCircle2,
    Search,
    Calendar,
    Building2,
    Briefcase,
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
    category?: string;
    quantity_used: number;
    unit: string;
};
type NurseActivity = {
    nurse_id?: number;
    name: string;
    visits: number;
};

type VisitRecord = {
    id: number;
    date: string;
    person: string;
    person_type: string;
    department: string;
    reason: string;
    symptoms?: string;
    nurse: string;
    medicine?: string;
    medicine_quantity?: number;
};

type MonthlyReport = {
    report?: ReportPeriod;
    summary?: ReportSummary;
    reasons?: VisitReason[];
    common_illnesses?: CommonIllness[];
    medicine_usage?: MedicineUsage[];
    nurse_activity?: NurseActivity[];
    daily_visits?: { date: string; count: number | string | null }[];
    visits?: VisitRecord[];
};

function Reports() {
    const currentDate = new Date();

    // Monthly selector state
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());
    const [visitSearch, setVisitSearch] = useState<string>("");

    // Monthly Data State
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    useEffect(() => {
        generateMonthlyReport();
    }, []);

    const handleMonthChange = (newMonth: number) => {
        setMonth(newMonth);
        generateMonthlyReport(newMonth, year, true);
    };

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        generateMonthlyReport(month, newYear, true);
    };

    const handlePrint = () => {
        window.dispatchEvent(new Event("resize"));
        setTimeout(() => {
            window.print();
        }, 120);
    };

    const handleDownloadPDF = () => {
        if (!report) return;
        exportMonthlyReportPDF(report);
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
                        disabled={!report || loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#70091f]/20 hover:bg-[#8b1505] disabled:opacity-50 transition"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>

                    <button
                        onClick={handlePrint}
                        disabled={!report || loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:opacity-50 transition"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                </div>
            </div>

            {/* Monthly Controls */}
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

            {/* Error Notice */}
            {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-800">Report Notice</p>
                        <p className="mt-0.5 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* MONTHLY REPORT CONTENT */}
            {report && (
                <div id="report-print-area" className="report-paper space-y-5">
                    {/* Official Letterhead */}
                    <div className="report-letterhead rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm sm:p-7 print:rounded-none">
                        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-black uppercase tracking-wider text-[#70091f]">
                                    TAGOLOAN COMMUNITY COLLEGE
                                </div>
                                <h1 className="pt-1 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                                    MONTHLY CLINIC ACTIVITY & HEALTH REPORT
                                </h1>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-start">
                                <div className="report-period-box rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-4 py-2.5 text-right print:rounded-none">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500">Reporting Scope</p>
                                    <p className="text-sm font-bold text-[#70091f] uppercase">
                                        {report.report?.period || `${monthNames[month - 1]} ${year}`}
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
                                    className="h-16 w-16 object-contain sm:h-20 sm:w-20 shrink-0"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-[#e8dfd4] pt-4 text-xs text-stone-500">
                            <p>
                                <span className="font-semibold text-stone-700">Generated:</span>{" "}
                                {formatGeneratedAt(report.report?.generated_at)}
                            </p>
                            <p>
                                <span className="font-semibold text-stone-700">Total Records:</span>{" "}
                                {summary.total_visits || 0}
                            </p>
                            <p>
                                <span className="font-semibold text-stone-700">Scope:</span> Verified clinic consultation entries from database
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <section className="report-summary-grid grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <SummaryCard title="Total Consultations" value={summary.total_visits || 0} icon={<Activity size={21} />} />
                        <SummaryCard title="Student Visits" value={summary.student_visits || 0} icon={<Users size={21} />} />
                        <SummaryCard title="Faculty Consultations" value={summary.faculty_visits || 0} icon={<Building2 size={21} />} />
                        <SummaryCard title="Staff Consultations" value={summary.staff_visits || 0} icon={<Briefcase size={21} />} />
                    </section>

                    {/* Daily Visits Chart (Screen only - excluded in PDF & Print) */}
                    <div className="print:hidden">
                        <DailyVisitsChart
                            data={dailyVisits}
                            visits={rawVisits}
                            summary={summary}
                            month={month}
                            year={year}
                            period={report.report?.period || `${monthNames[month - 1]} ${year}`}
                        />
                    </div>

                    {/* Detailed Breakdowns (Reasons, Illnesses, Medicine, Nurse - 2x2 Grid in Print matching PDF) */}
                    <div className="report-breakdown-grid grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
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
                                    <tr className="bg-[#70091f] text-white print:bg-[#70091f] print:text-white text-left">
                                        <th className="px-3.5 py-2.5 text-xs font-bold uppercase text-white print:text-white tracking-wider">Date</th>
                                        <th className="px-3.5 py-2.5 text-xs font-bold uppercase text-white print:text-white tracking-wider">Patient</th>
                                        <th className="px-3.5 py-2.5 text-xs font-bold uppercase text-white print:text-white tracking-wider">Type</th>
                                        <th className="px-3.5 py-2.5 text-xs font-bold uppercase text-white print:text-white tracking-wider">Department</th>
                                        <th className="px-3.5 py-2.5 text-xs font-bold uppercase text-white print:text-white tracking-wider">Reason / Symptoms</th>
                                        <th className="px-3.5 py-2.5 text-xs font-bold uppercase text-white print:text-white tracking-wider">Medicine</th>
                                        <th className="px-3.5 py-2.5 text-xs font-bold uppercase text-white print:text-white tracking-wider">Attending Staff</th>
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
                    <ReportSignatureBlock periodLabel={report.report?.period} />
                </div>
            )}
        </div>
    );
}

function ReportSignatureBlock({ periodLabel }: { periodLabel?: string }) {
    return (
        <footer className="report-signatures mt-8 rounded-2xl border border-[#e8dfd4] bg-white p-6 shadow-sm break-inside-avoid print:break-inside-avoid print:rounded-xl print:border print:border-[#d4c7b8] print:p-5 print:shadow-none">
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
    students: {
        label: "Students",
        color: "#0284c7",
    },
    employees: {
        label: "Faculty & Staff",
        color: "#0284c7",
    },
    total: {
        label: "Total Visits",
        color: "#0284c7",
    },
} as const;

type ChartTabKey = keyof typeof CHART_TABS;

function getSmoothSpline(points: { x: number; y: number }[]) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
}

function DailyVisitsChart({ data, visits, summary, month, year, period }: DailyVisitsChartProps) {
    const [activeChart, setActiveChart] = useState<ChartTabKey>("total");
    const [hoveredPoint, setHoveredPoint] = useState<{
        day: number;
        date: string;
        formattedDate: string;
        count: number;
        x: number;
        y: number;
    } | null>(null);

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

    // SVG plotting coordinates
    const width = 860;
    const height = 210;
    const left = 46;
    const right = 836;
    const top = 26;
    const baseline = 168;
    const plotWidth = right - left;
    const plotHeight = baseline - top;

    const currentValues = points.map((p) => Number(p[activeChart]) || 0);
    const rawMax = Math.max(0, ...currentValues);
    const yAxisMax = Math.max(3, Math.ceil(rawMax));
    const yTicks = Array.from({ length: yAxisMax + 1 }, (_, i) => i);

    const svgCoords = points.map((p, index) => {
        const x = left + (index / Math.max(1, daysInMonth - 1)) * plotWidth;
        const val = Number(p[activeChart]) || 0;
        const y = baseline - (val / yAxisMax) * plotHeight;
        return { x, y, val, point: p };
    });

    const splinePath = getSmoothSpline(svgCoords.map((c) => ({ x: c.x, y: c.y })));
    const areaPath = svgCoords.length > 0
        ? `${splinePath} L ${svgCoords[svgCoords.length - 1].x.toFixed(1)} ${baseline} L ${svgCoords[0].x.toFixed(1)} ${baseline} Z`
        : "";

    return (
        <div className="report-panel report-chart-wrap w-full overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white text-stone-900 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-[#382f25] dark:bg-[#251f19] dark:text-[#f4ecdf]">
            <div className="flex flex-col sm:flex-row items-stretch border-b border-[#e8dfd4] dark:border-[#382f25]">
                <div className="flex flex-1 flex-col justify-center gap-1 p-4 sm:p-5">
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
                    {(["students", "employees", "total"] as ChartTabKey[]).map((key) => {
                        const isActive = activeChart === key;
                        const config = CHART_TABS[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                data-active={isActive}
                                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-r border-[#e8dfd4] px-4 py-3 text-left transition-colors duration-150 last:border-r-0 hover:bg-[#faf6f0] data-[active=true]:bg-[#f4ecdf]/70 dark:border-[#382f25] dark:hover:bg-[#2f2720] dark:data-[active=true]:bg-[#382f25] sm:px-6 sm:py-4 cursor-pointer"
                                onClick={() => setActiveChart(key)}
                            >
                                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                                    {config.label}
                                </span>
                                <span className="text-lg sm:text-2xl font-black leading-none text-stone-900 dark:text-[#f4ecdf]">
                                    {totals[key].toLocaleString()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-3 sm:p-5">
                <div className="relative w-full overflow-hidden">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-auto block select-none"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <defs>
                            <linearGradient id="clinicVisitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Y-axis Horizontal Grid Lines & Ticks */}
                        {yTicks.map((tick) => {
                            const y = baseline - (tick / yAxisMax) * plotHeight;
                            return (
                                <g key={`ytick-${tick}`}>
                                    <line
                                        x1={left}
                                        y1={y}
                                        x2={right}
                                        y2={y}
                                        stroke="#f0ebe1"
                                        strokeDasharray={tick === 0 ? undefined : "3 3"}
                                        strokeWidth={1}
                                    />
                                    <text
                                        x={left - 10}
                                        y={y + 3.5}
                                        textAnchor="end"
                                        fontSize="10"
                                        fill="#78716c"
                                        fontWeight="500"
                                    >
                                        {tick}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Gradient Area Fill under Curve */}
                        {areaPath && (
                            <path d={areaPath} fill="url(#clinicVisitGradient)" />
                        )}

                        {/* Main Visits Spline Curve */}
                        {splinePath && (
                            <path
                                d={splinePath}
                                fill="none"
                                stroke="#0284c7"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Data Points on Days with Visits */}
                        {svgCoords.map(({ x, y, val, point }) => {
                            if (val <= 0) return null;
                            return (
                                <g key={`point-${point.day}`} className="transition-transform duration-150">
                                    <circle cx={x} cy={y} r="6" fill="#0284c7" fillOpacity="0.25" />
                                    <circle cx={x} cy={y} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                                    {/* Prominent count badge above the point */}
                                    <g transform={`translate(${x}, ${y - 12})`}>
                                        <rect
                                            x="-9"
                                            y="-13"
                                            width="18"
                                            height="13"
                                            rx="3.5"
                                            fill="#0284c7"
                                        />
                                        <text
                                            x="0"
                                            y="-3.5"
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="8.5"
                                            fontWeight="bold"
                                        >
                                            {val}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}

                        {/* X-axis Date Labels (every 2 days) */}
                        {svgCoords.map(({ x, point }) => {
                            const isEvenDay = point.day % 2 === 0 || point.day === 1 || point.day === daysInMonth;
                            if (!isEvenDay) return null;
                            return (
                                <g key={`xlabel-${point.day}`}>
                                    <line
                                        x1={x}
                                        y1={baseline}
                                        x2={x}
                                        y2={baseline + 4}
                                        stroke="#e8dfd4"
                                        strokeWidth={1}
                                    />
                                    <text
                                        x={x}
                                        y={baseline + 16}
                                        textAnchor="middle"
                                        fontSize="9.5"
                                        fill="#78716c"
                                    >
                                        {monthShort} {point.day}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Interactive Invisible Hover Columns for Tooltips */}
                        {svgCoords.map(({ x, y, val, point }) => {
                            const colWidth = plotWidth / daysInMonth;
                            return (
                                <rect
                                    key={`hover-${point.day}`}
                                    x={x - colWidth / 2}
                                    y={top}
                                    width={colWidth}
                                    height={baseline - top + 18}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() =>
                                        setHoveredPoint({
                                            day: point.day,
                                            date: point.date,
                                            formattedDate: point.formattedDate,
                                            count: val,
                                            x,
                                            y,
                                        })
                                    }
                                    onMouseLeave={() => setHoveredPoint(null)}
                                />
                            );
                        })}
                    </svg>

                    {/* Interactive Floating Hover Tooltip */}
                    {hoveredPoint && (
                        <div
                            className="pointer-events-none absolute -top-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-[#382f25] dark:bg-[#251f19] transition-all"
                            style={{
                                left: `${(hoveredPoint.x / width) * 100}%`,
                                transform: "translateX(-50%) translateY(-100%)",
                            }}
                        >
                            <p className="font-semibold text-stone-800 dark:text-stone-200">
                                {hoveredPoint.date} ({hoveredPoint.formattedDate})
                            </p>
                            <p className="mt-0.5 font-bold text-sky-600 dark:text-sky-400">
                                {CHART_TABS[activeChart].label}: {hoveredPoint.count.toLocaleString()} visits
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span>Day of month</span>
                    <span>{totals[activeChart].toLocaleString()} visits recorded this month</span>
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
