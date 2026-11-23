import React from "react";
import {
    Calendar,
    Filter,
    Users,
    RotateCw,
    Sparkles,
} from "lucide-react";
import type { AnalyticsFilterState, PeriodType, PatientTypeFilter } from "../../types/analytics";

interface AnalyticsFilterBarProps {
    filters: AnalyticsFilterState;
    onChange: (filters: AnalyticsFilterState) => void;
    onRefresh: () => void;
    loading: boolean;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
    filters,
    onChange,
    onRefresh,
    loading,
}) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

    const setPeriodType = (type: PeriodType) => {
        onChange({ ...filters, periodType: type });
    };

    const periodOptions: Array<{ id: PeriodType; label: string }> = [
        { id: "daily", label: "Daily" },
        { id: "weekly", label: "Weekly" },
        { id: "monthly", label: "Monthly" },
        { id: "yearly", label: "Yearly" },
        { id: "custom", label: "Custom Range" },
        { id: "all", label: "All Time" },
    ];

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm print:hidden">
            {/* Header row: Title + Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f]">
                        <Filter size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-stone-900">
                            Analytics Date & Population Filters
                        </h2>
                        <p className="text-xs text-stone-500">
                            Dynamically aggregate department visits and clinical symptoms
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50 transition"
                        title="Reload live database records"
                    >
                        <RotateCw size={14} className={loading ? "animate-spin text-[#70091f]" : ""} />
                        <span>{loading ? "Updating..." : "Refresh"}</span>
                    </button>

                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Database</span>
                    </div>
                </div>
            </div>

            {/* Filter controls row */}
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Period Pills */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200/80">
                    {periodOptions.map((opt) => {
                        const isActive = filters.periodType === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setPeriodType(opt.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    isActive
                                        ? "bg-[#70091f] text-white shadow-sm"
                                        : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
                                }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                {/* Patient Type Filter */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Users size={16} className="text-stone-400" />
                        <span className="text-xs font-semibold text-stone-600">Patient:</span>
                        <select
                            value={filters.patientType}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    patientType: e.target.value as PatientTypeFilter,
                                })
                            }
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        >
                            <option value="all">All Patients</option>
                            <option value="student">Students Only</option>
                            <option value="faculty">Faculty Only</option>
                            <option value="staff">Staff Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Contextual Date Selectors */}
            <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-stone-100 text-xs">
                {filters.periodType === "daily" && (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-600">Select Date:</span>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => onChange({ ...filters, date: e.target.value })}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        />
                    </div>
                )}

                {filters.periodType === "weekly" && (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-600">Reference Week Date:</span>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => onChange({ ...filters, date: e.target.value })}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        />
                        <span className="text-stone-400 text-[11px]">(Calculates full 7-day Monday–Sunday week)</span>
                    </div>
                )}

                {filters.periodType === "monthly" && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-stone-600">Month:</span>
                        <select
                            value={filters.month}
                            onChange={(e) => onChange({ ...filters, month: Number(e.target.value) })}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        >
                            {MONTH_NAMES.map((name, idx) => (
                                <option key={name} value={idx + 1}>
                                    {name}
                                </option>
                            ))}
                        </select>

                        <span className="font-semibold text-stone-600 ml-2">Year:</span>
                        <select
                            value={filters.year}
                            onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {filters.periodType === "yearly" && (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-600">Year:</span>
                        <select
                            value={filters.year}
                            onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {filters.periodType === "custom" && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-stone-600">Start Date:</span>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        />
                        <span className="font-semibold text-stone-600 ml-2">End Date:</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        />
                    </div>
                )}

                {filters.periodType === "all" && (
                    <div className="text-stone-500 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-[#8a6f50]" />
                        <span>Showing entire clinical database history across all departments</span>
                    </div>
                )}
            </div>
        </div>
    );
};
