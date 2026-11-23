import React from "react";
import {
    Activity,
    Building2,
    HeartPulse,
    Layers,
    TrendingUp,
    Users,
} from "lucide-react";
import type { AnalyticsSummary } from "../../types/analytics";

interface AnalyticsSummaryCardsProps {
    summary: AnalyticsSummary;
    loading?: boolean;
}

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({
    summary,
    loading = false,
}) => {
    const {
        total_visits = 0,
        top_department = { department: "None", short_name: "None", visits: 0, percentage: 0 },
        top_symptom = { symptom: "None", count: 0, percentage: 0 },
        total_departments = 0,
        patient_type_counts = { student_visits: 0, faculty_visits: 0, staff_visits: 0 },
    } = summary;

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Clinic Visits */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Total Clinic Visits
                        </p>
                        <h3 className="mt-1 text-3xl font-black tracking-tight text-stone-900">
                            {loading ? "..." : total_visits.toLocaleString()}
                        </h3>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#70091f]/10 text-[#70091f]">
                        <Activity size={22} />
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-stone-500 border-t border-stone-100 pt-2.5">
                    <span className="font-semibold text-stone-700">
                        {patient_type_counts.student_visits}
                    </span>{" "}
                    students ·{" "}
                    <span className="font-semibold text-stone-700">
                        {patient_type_counts.faculty_visits}
                    </span>{" "}
                    faculty ·{" "}
                    <span className="font-semibold text-stone-700">
                        {patient_type_counts.staff_visits}
                    </span>{" "}
                    staff
                </div>
            </div>

            {/* 2. Department with the Most Visits */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Top Department
                        </p>
                        <h3
                            className="mt-1 truncate text-lg font-bold text-stone-900"
                            title={top_department.department}
                        >
                            {loading ? "..." : top_department.short_name || top_department.department}
                        </h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                        <Building2 size={22} />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs">
                    <span className="font-bold text-[#70091f]">
                        {top_department.visits} {top_department.visits === 1 ? "visit" : "visits"}
                    </span>
                    {total_visits > 0 && top_department.visits > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                            <TrendingUp size={11} />
                            {top_department.percentage}% of visits
                        </span>
                    )}
                </div>
            </div>

            {/* 3. Most Common Symptom */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Most Common Symptom
                        </p>
                        <h3
                            className="mt-1 truncate text-lg font-bold text-stone-900"
                            title={top_symptom.symptom}
                        >
                            {loading ? "..." : top_symptom.symptom}
                        </h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-700">
                        <HeartPulse size={22} />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs">
                    <span className="font-bold text-[#70091f]">
                        {top_symptom.count} {top_symptom.count === 1 ? "case" : "cases"}
                    </span>
                    {top_symptom.count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60">
                            #1 Symptom
                        </span>
                    )}
                </div>
            </div>

            {/* 4. Total Departments with Recorded Visits */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Active Departments
                        </p>
                        <h3 className="mt-1 text-3xl font-black tracking-tight text-stone-900">
                            {loading ? "..." : total_departments}
                        </h3>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700">
                        <Layers size={22} />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs text-stone-500">
                    <span>With recorded visits</span>
                    <span className="font-semibold text-stone-700">
                        Campus-wide
                    </span>
                </div>
            </div>
        </section>
    );
};
