import React, { useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell,
} from "recharts";
import {
    GitCompare,
    Building2,
    HeartPulse,
    ChevronDown,
    SlidersHorizontal,
} from "lucide-react";
import type {
    DepartmentSymptomDetail,
    GroupedComparison,
} from "../../types/analytics";

interface DepartmentSymptomsSectionProps {
    departmentSymptoms: DepartmentSymptomDetail[];
    groupedComparison: GroupedComparison;
    allDepartments: string[];
    loading?: boolean;
}

const SYMPTOM_BAR_COLORS = [
    "#70091f", // Primary Burgundy
    "#d97706", // Amber
    "#0284c7", // Sky Blue
    "#16a34a", // Emerald
    "#9333ea", // Purple
];

export const DepartmentSymptomsSection: React.FC<DepartmentSymptomsSectionProps> = ({
    departmentSymptoms,
    groupedComparison,
    allDepartments,
    loading = false,
}) => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

    // When a specific department is chosen
    const currentDeptData = departmentSymptoms.find(
        (d) => d.department === selectedDepartment
    );

    const isAll = selectedDepartment === "all";

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            {/* Header + Department Selector */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-700">
                        <GitCompare size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-stone-900">
                            Department vs. Common Symptoms
                        </h2>
                        <p className="text-xs text-stone-500">
                            Compare symptoms across departments or inspect a specific college
                        </p>
                    </div>
                </div>

                {/* Department Dropdown Selector */}
                <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-stone-400 shrink-0" />
                    <div className="relative">
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="rounded-xl border border-stone-200 bg-stone-50 pl-3 pr-8 py-1.5 text-xs font-bold text-stone-800 outline-none focus:border-[#70091f] focus:bg-white"
                        >
                            <option value="all">All Departments (Grouped Comparison)</option>
                            {departmentSymptoms.map((dept) => (
                                <option key={dept.department} value={dept.department}>
                                    {dept.short_name || dept.department} ({dept.total_visits} visits)
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-2.5 pointer-events-none text-stone-400" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex h-72 items-center justify-center">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#70091f]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#70091f] border-t-transparent" />
                        Loading symptom correlation...
                    </div>
                </div>
            ) : departmentSymptoms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                        <SlidersHorizontal size={24} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-stone-700">
                        No department symptom records available
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                        Select another period or add consultations to see symptom trends across colleges.
                    </p>
                </div>
            ) : isAll ? (
                /* Grouped Bar Chart: Top Symptoms Across All Departments */
                <div className="mt-5 space-y-6">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Side-by-side comparison of top symptoms per department:</span>
                        <span className="font-semibold text-stone-700">
                            {groupedComparison.data.length} Departments
                        </span>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={groupedComparison.data}
                                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece6" />
                                <XAxis
                                    dataKey="short_name"
                                    tickLine={false}
                                    axisLine={{ stroke: "#e5e7eb" }}
                                    tick={{ fill: "#57534e", fontSize: 11, fontWeight: 600 }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e5e7eb" }}
                                    tick={{ fill: "#78716c", fontSize: 11 }}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const row = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg min-w-[200px]">
                                                    <p className="text-xs font-bold text-stone-900 border-b border-stone-100 pb-1.5 mb-1.5">
                                                        {row.department}
                                                    </p>
                                                    <div className="space-y-1 text-xs">
                                                        {payload.map((entry: any) => (
                                                            <div
                                                                key={entry.dataKey}
                                                                className="flex items-center justify-between gap-4"
                                                            >
                                                                <span
                                                                    className="font-medium"
                                                                    style={{ color: entry.color }}
                                                                >
                                                                    {entry.dataKey}:
                                                                </span>
                                                                <span className="font-bold text-stone-900">
                                                                    {entry.value} {Number(entry.value) === 1 ? "case" : "cases"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => (
                                        <span className="text-xs font-semibold text-stone-700">
                                            {value}
                                        </span>
                                    )}
                                />
                                {groupedComparison.symptom_keys.map((symKey, idx) => (
                                    <Bar
                                        key={symKey}
                                        dataKey={symKey}
                                        fill={SYMPTOM_BAR_COLORS[idx % SYMPTOM_BAR_COLORS.length]}
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={600}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Department Summaries Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-stone-100 pt-4">
                        {departmentSymptoms.map((dept) => (
                            <div
                                key={dept.department}
                                onClick={() => setSelectedDepartment(dept.department)}
                                className="cursor-pointer rounded-xl border border-stone-200/80 bg-stone-50/60 p-3 hover:border-[#70091f]/40 hover:bg-white transition"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-stone-800 truncate" title={dept.department}>
                                        {dept.short_name || dept.department}
                                    </h4>
                                    <span className="text-[10px] font-bold text-[#70091f] bg-[#70091f]/10 px-2 py-0.5 rounded-full">
                                        {dept.total_visits} visits
                                    </span>
                                </div>
                                <div className="mt-2 text-[11px] text-stone-500">
                                    <span>Top Symptom: </span>
                                    <span className="font-semibold text-stone-700">
                                        {dept.top_symptom}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : currentDeptData ? (
                /* Focused View: Single Department Symptoms */
                <div className="mt-5 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#70091f]/5 border border-[#70091f]/20 rounded-xl p-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#70091f]">
                                Selected Department
                            </span>
                            <h3 className="text-sm font-bold text-stone-900 mt-0.5">
                                {currentDeptData.department}
                            </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="rounded-lg bg-white px-3 py-1 font-bold text-stone-800 border border-stone-200">
                                {currentDeptData.total_visits} Total Visits
                            </span>
                            <span className="rounded-lg bg-[#70091f] px-3 py-1 font-bold text-white shadow-sm">
                                Top: {currentDeptData.top_symptom}
                            </span>
                        </div>
                    </div>

                    {/* Department Symptom Frequency Chart */}
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={currentDeptData.symptoms}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0ece6" />
                                <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    axisLine={{ stroke: "#e5e7eb" }}
                                    tick={{ fill: "#78716c", fontSize: 11 }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="symptom"
                                    axisLine={{ stroke: "#e5e7eb" }}
                                    tickLine={false}
                                    tick={{ fill: "#44403c", fontSize: 11, fontWeight: 600 }}
                                    width={120}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                                                    <p className="text-xs font-bold text-stone-900">
                                                        {item.symptom}
                                                    </p>
                                                    <p className="mt-1 text-xs text-[#70091f] font-bold">
                                                        {item.count} {item.count === 1 ? "case" : "cases"} recorded
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#70091f"
                                    radius={[0, 8, 8, 0]}
                                    animationDuration={600}
                                >
                                    {currentDeptData.symptoms.map((_, index) => (
                                        <Cell
                                            key={`cell-dept-${index}`}
                                            fill={SYMPTOM_BAR_COLORS[index % SYMPTOM_BAR_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Return to Grouped view button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={() => setSelectedDepartment("all")}
                            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition"
                        >
                            ← Back to Cross-Department Comparison
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
