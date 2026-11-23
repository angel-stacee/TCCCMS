import React from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts";
import { Building2, Trophy, BarChart3 } from "lucide-react";
import type { DepartmentVisit } from "../../types/analytics";

interface DepartmentVisitsChartProps {
    data: DepartmentVisit[];
    loading?: boolean;
    periodLabel?: string;
}

const PRIMARY_BURGUNDY = "#70091f";
const SECONDARY_BURGUNDY = "#a82d42";
const ACCENT_AMBER = "#d97706";

export const DepartmentVisitsChart: React.FC<DepartmentVisitsChartProps> = ({
    data,
    loading = false,
    periodLabel,
}) => {
    const highestDept = data.find((d) => d.is_highest);

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f]">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-stone-900">
                            Clinic Visits by Department
                        </h2>
                        <p className="text-xs text-stone-500">
                            Comparative volume of patient consultations per college / department
                        </p>
                    </div>
                </div>

                {highestDept && highestDept.visits > 0 && (
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200/70">
                        <Trophy size={14} className="text-amber-600" />
                        <span>Highest: {highestDept.short_name || highestDept.department} ({highestDept.visits} visits)</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex h-72 items-center justify-center">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#70091f]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#70091f] border-t-transparent" />
                        Loading department analytics...
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                        <BarChart3 size={24} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-stone-700">
                        No clinic visits recorded for this period
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                        Try selecting another date range or patient population filter.
                    </p>
                </div>
            ) : (
                <div className="mt-5 space-y-6">
                    {/* Recharts Bar Chart */}
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece6" />
                                <XAxis
                                    dataKey="short_name"
                                    tickLine={false}
                                    axisLine={{ stroke: "#e5e7eb" }}
                                    tick={{ fill: "#57534e", fontSize: 11, fontWeight: 600 }}
                                    interval={0}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e5e7eb" }}
                                    tick={{ fill: "#78716c", fontSize: 11 }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload as DepartmentVisit;
                                            return (
                                                <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                                                    <p className="text-xs font-bold text-stone-900">
                                                        {item.department}
                                                    </p>
                                                    <div className="mt-1.5 flex items-center justify-between gap-4 text-xs">
                                                        <span className="text-stone-500">Visits:</span>
                                                        <span className="font-bold text-[#70091f]">
                                                            {item.visits} ({item.percentage}%)
                                                        </span>
                                                    </div>
                                                    {item.is_highest && (
                                                        <p className="mt-1 text-[10px] font-semibold text-amber-700">
                                                            ★ Department with Highest Volume
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="visits"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={600}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.is_highest ? PRIMARY_BURGUNDY : SECONDARY_BURGUNDY}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Department Breakdown Mini-Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-stone-100 pt-4">
                        {data.map((item) => (
                            <div
                                key={item.department}
                                className={`rounded-xl p-3 border transition ${
                                    item.is_highest
                                        ? "border-[#70091f]/30 bg-[#70091f]/5"
                                        : "border-stone-100 bg-stone-50/60"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-stone-800" title={item.department}>
                                            {item.short_name || item.department}
                                        </p>
                                        <p className="truncate text-[10px] text-stone-500">
                                            {item.department}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="text-sm font-black text-[#70091f]">
                                            {item.visits}
                                        </span>
                                        <span className="text-[10px] font-medium text-stone-500 block">
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
