import { useEffect, useState, useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    Tooltip,
} from "recharts";
import api from "../services/api";
import { getCachedRecord, invalidateRecordCache } from "../services/recordCache";
import { exportMonthlyReportPDF } from "../utils/pdfExport";
import { formatNA, formatTemperature, formatDate } from "../utils/formatters";
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
    Building2,
    Stethoscope,
    HeartPulse,
    CheckCircle2,
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

function Reports() {
    const currentDate = new Date();

    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const generateReport = async (targetMonth = month, targetYear = year, force = false) => {
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

    const handleMonthChange = (newMonth: number) => {
        setMonth(newMonth);
        generateReport(newMonth, year, true);
    };

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        generateReport(month, newYear, true);
    };

    useEffect(() => {
        generateReport();
    }, []);

    const handlePrint = () => {
        window.print();
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

    const maximumReasonCount = Math.max(
        1,
        ...reasons.map((reason) => Number(reason.count || 0))
    );

    const medicineUsage = report?.medicine_usage || [];

    const nurseActivity = report?.nurse_activity || [];

    const dailyVisits = report?.daily_visits || [];

    const visits = report?.visits || [];

    return (
        <div
            id="reports-page"
            className="tcc-module-page min-h-screen w-full px-3.5 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
        >

            <div className="tcc-module-header mb-5 flex flex-col gap-4 rounded-2xl border px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8a6f50] text-white shadow-md">
                        <FileText size={25} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">
                            Monthly Reports
                        </h1>

                        <p className="text-sm text-stone-500">
                            TCC Clinic Management System
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={!report || loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#70091f]/20 hover:bg-[#8b1505] disabled:opacity-50 transition"
                    >
                        <Download size={17} />
                        Download PDF
                    </button>

                    <button
                        onClick={handlePrint}
                        disabled={!report || loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:opacity-50 transition"
                    >
                        <Printer size={17} />
                        Print Report
                    </button>
                </div>
            </div>


            <div className="mb-6 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm print:hidden">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDays
                            size={19}
                            className="text-[#8a6f50]"
                        />

                        <h2 className="font-bold text-stone-800">
                            Select Report Period
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
                                Automatically updated
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase text-stone-500">
                            Month
                        </label>

                        <select
                            value={month}
                            onChange={(e) =>
                                handleMonthChange(Number(e.target.value))
                            }
                            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#8a6f50] focus:bg-white"
                        >
                            {monthNames.map((name, index) => (
                                <option
                                    key={name}
                                    value={index + 1}
                                >
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase text-stone-500">
                            Year
                        </label>

                        <select
                            value={year}
                            onChange={(e) =>
                                handleYearChange(Number(e.target.value))
                            }
                            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-[#8a6f50] focus:bg-white"
                        >
                            {Array.from(
                                { length: 7 },
                                (_, index) =>
                                    currentDate.getFullYear() - 3 + index
                            ).map((itemYear) => (
                                <option
                                    key={itemYear}
                                    value={itemYear}
                                >
                                    {itemYear}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pb-1 text-xs text-stone-400">
                        Viewing report for <span className="font-semibold text-stone-700">{monthNames[month - 1]} {year}</span>
                    </div>
                </div>
            </div>


            {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <AlertCircle
                        size={20}
                        className="text-red-500"
                    />

                    <div>
                        <p className="font-semibold text-red-700">
                            Report Error
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                </div>
            )}


            {report && (
                <div id="report-print-area" className="report-paper space-y-5">
                    <div className="report-letterhead rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm sm:p-7">
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
                                    MONTHLY CLINIC ACTIVITY & HEALTH REPORT
                                </h1>
                                <p className="text-xs font-medium text-stone-500">
                                    Report Period:{" "}
                                    <span className="font-bold text-[#70091f] uppercase">
                                        {report.report?.period || `${monthNames[month - 1]} ${year}`}
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-start">
                                <div className="report-period-box rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-4 py-2.5 text-right">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-500">Reporting Period</p>
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
                                    className="h-16 w-16 rounded-full border border-stone-200 bg-white object-contain p-1 shadow-sm sm:h-20 sm:w-20"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-[#e8dfd4] pt-4 text-xs text-stone-500">
                            <p><span className="font-semibold text-stone-700">Generated:</span>{" "}{formatGeneratedAt(report.report?.generated_at)}</p>
                            <p><span className="font-semibold text-stone-700">Total Visits:</span>{" "}{Number(visits.length).toLocaleString()}</p>
                            <p><span className="font-semibold text-stone-700">Scope:</span>{" "}All clinic visits recorded for {report.report?.period || `${monthNames[month - 1]} ${year}`}</p>
                        </div>
                    </div>

                    <section className="report-summary-grid grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        <SummaryCard title="Total Visits" value={summary.total_visits || 0} icon={<Activity size={21} />} />
                        <SummaryCard title="Students Treated" value={summary.students_treated ?? summary.student_visits ?? 0} icon={<Users size={21} />} />
                        <SummaryCard title="Student Visits" value={summary.student_visits || 0} icon={<Users size={21} />} />
                        <SummaryCard title="Faculty Visits" value={summary.faculty_visits || 0} icon={<Users size={21} />} />
                        <SummaryCard title="Staff Visits" value={summary.staff_visits || 0} icon={<Users size={21} />} />
                    </section>

                    <section className="report-panel">
                        <DailyVisitsChart
                            data={dailyVisits}
                            visits={visits}
                            summary={summary}
                            month={month}
                            year={year}
                            period={report.report?.period || `${monthNames[month - 1]} ${year}`}
                        />
                    </section>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <section className="report-panel rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3ebdf] text-[#8a6f50]"><Stethoscope size={18} aria-hidden="true" /></div>
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
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><HeartPulse size={18} aria-hidden="true" /></div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">Common Illnesses</h2>
                                    <p className="text-xs text-stone-500">Symptoms & complaints</p>
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
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700"><Pill size={18} aria-hidden="true" /></div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">Medicine Usage</h2>
                                    <p className="text-xs text-stone-500">Dispensed during period</p>
                                </div>
                            </div>
                            {medicineUsage.length === 0 ? (
                                <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">No medicine usage recorded.</p>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {medicineUsage.slice(0, 7).map((item) => (
                                        <div key={item.medicine_id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                            <span className="truncate text-sm font-medium text-stone-700">{formatNA(item.medicine_name)}</span>
                                            <span className="shrink-0 rounded-lg bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">{Number(item.quantity_used || 0).toLocaleString()} {item.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="report-panel rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3ebdf] text-[#8a6f50]"><Users size={18} aria-hidden="true" /></div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">Nurse Activity</h2>
                                    <p className="text-xs text-stone-500">Visits recorded by nurse</p>
                                </div>
                            </div>
                            {nurseActivity.length === 0 ? (
                                <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">No nurse activity recorded.</p>
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

                    <section className="report-panel report-register overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-sm">
                        <div className="border-b border-[#e8dfd4] px-5 py-4 sm:px-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6f50]">Supporting detail</p>
                            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                                <h2 className="text-lg font-bold text-stone-900">Clinic Visit Register</h2>
                                <p className="text-xs text-stone-500">{visits.length.toLocaleString()} records</p>
                            </div>
                        </div>
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
                                        <th className="px-4 py-3 text-xs font-bold uppercase text-stone-500">Nurse</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visits.length > 0 ? visits.map((visit) => (
                                        <tr key={visit.id} className="border-t border-stone-100">
                                            <td className="px-4 py-3 text-sm text-stone-600">{formatVisitDate(visit.date)}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-stone-800">{formatNA(visit.person)}</td>
                                            <td className="px-4 py-3 text-sm text-stone-600">{formatNA(visit.person_type)}</td>
                                            <td className="px-4 py-3 text-sm text-stone-600">{formatNA(visit.department)}</td>
                                            <td className="px-4 py-3 text-sm text-stone-700">
                                                <ReasonBadge reason={visit.reason} symptoms={visit.symptoms} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-600">
                                                {visit.medicine ? `${visit.medicine}${visit.medicine_quantity ? ` (${visit.medicine_quantity})` : ""}` : "None"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-stone-600">{formatNA(visit.nurse)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-500">No clinic visits were recorded for this reporting period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Visit Card View */}
                        <div className="block md:hidden print:hidden divide-y divide-[#eee7de] p-3 space-y-3">
                            {visits.length > 0 ? (
                                visits.map((visit) => (
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
                                                <span className="text-stone-400">Nurse:</span>
                                                <span className="font-medium text-stone-700">{formatNA(visit.nurse)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="px-5 py-8 text-center text-sm text-stone-500">
                                    No clinic visits were recorded for this reporting period.
                                </p>
                            )}
                        </div>
                    </section>

                    <footer className="report-signatures mt-8 rounded-2xl border border-[#e8dfd4] bg-white p-6 shadow-sm print:rounded-none print:border-0 print:border-t-2 print:border-stone-400 print:p-0 print:pt-6 print:shadow-none">
                        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#70091f]">
                            Official Endorsement & Signatures
                        </p>
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 print:grid-cols-2 print:gap-12 text-xs">
                            <div className="space-y-1">
                                <p className="font-medium text-stone-500">Prepared by:</p>
                                <div className="w-56 border-b border-stone-400 pt-10" />
                                <p className="pt-1 font-bold text-stone-800">Clinic Staff / Attending Nurse</p>
                                <p className="text-[11px] text-stone-500">Health Services Clinic · Tagoloan Community College</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-stone-500">Noted by:</p>
                                <div className="w-56 border-b border-stone-400 pt-10" />
                                <p className="pt-1 font-bold text-stone-800">College Administration</p>
                                <p className="text-[11px] text-stone-500">Tagoloan Community College</p>
                            </div>
                        </div>
                    </footer>
                    <p className="mt-4 hidden text-center text-[9px] text-stone-500 print:block">
                        Tagoloan Community College · Health Services Clinic · Campus Clinic Management System · {report.report?.period}
                    </p>
                </div>
            )}
        </div>
    );
}

function formatVisitDate(value) {
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

function formatGeneratedAt(value) {
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

function DailyVisitsChart({ data, visits, summary, month, year, period }: DailyVisitsChartProps) {
    const [activeChart, setActiveChart] = useState<ChartTabKey>("students");

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNamesShort = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
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
            {/* Top Header matching Light / Theme Mode */}
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

                {/* Interactive Metric Tabs */}
                <div className="flex border-t border-[#e8dfd4] sm:border-t-0 sm:border-l sm:border-[#e8dfd4] dark:border-[#382f25]">
                    {(["students", "employees", "total"] as ChartTabKey[]).map((key) => {
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

            {/* Recharts Canvas */}
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
                                            <p className="mt-1 font-bold text-sky-600 dark:text-sky-400">
                                                {CHART_TABS[activeChart].label}: {Number(item[activeChart] || 0).toLocaleString()} visits
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                            <Line
                                dataKey={activeChart}
                                type="monotone"
                                stroke={CHART_TABS[activeChart].color}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{
                                    r: 5,
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

function getDayOfMonth(value) {
    const match = /^\d{4}-\d{2}-(\d{2})/.exec(String(value || ""));
    return match ? Number(match[1]) : Number.NaN;
}

function SummaryCard({ title, value, icon }) {
    return (
        <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-stone-500">
                        {title}
                    </p>

                    <p className="mt-1 text-3xl font-bold text-stone-900">
                        {Number(value || 0).toLocaleString()}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8a6f50]/10 text-[#8a6f50]">
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default Reports;
