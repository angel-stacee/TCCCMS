import React, { useState, useMemo } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie,
    Legend,
} from "recharts";
import { HeartPulse, BarChart2, PieChart as PieIcon, ListOrdered } from "lucide-react";
import type { CommonSymptom } from "../../types/analytics";

interface CommonSymptomsChartProps {
    data: CommonSymptom[];
    loading?: boolean;
}

const PALETTE = [
    "#70091f", // TCC Burgundy
    "#a82d42", // Light Maroon
    "#d97706", // Amber
    "#0284c7", // Sky Blue
    "#16a34a", // Emerald
    "#9333ea", // Purple
    "#ea580c", // Orange
    "#0f766e", // Teal
    "#4f46e5", // Indigo
    "#64748b", // Slate
];

export const CommonSymptomsChart: React.FC<CommonSymptomsChartProps> = ({
    data,
    loading = false,
}) => {
    const [chartMode, setChartMode] = useState<"bar" | "doughnut">("bar");
    const [limit, setLimit] = useState<5 | 10>(5);

    const displayedData = useMemo(() => {
        // Exclude pure 'N/A' from top chart if valid symptoms exist
        const valid = data.filter((d) => d.symptom !== "N/A" || data.length === 1);
        return valid.slice(0, limit);
    }, [data, limit]);

    const totalCases = useMemo(() => {
        return displayedData.reduce((acc, curr) => acc + curr.count, 0);
    }, [displayedData]);

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            {/* Header with View & Limit Toggles */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-700">
                        <HeartPulse size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-stone-900">
                            Most Common Symptoms
                        </h2>
                        <p className="text-xs text-stone-500">
                            Ranked frequency of clinical symptoms and complaints
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Top 5 / Top 10 Toggle */}
                    <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200/80">
                        <button
                            type="button"
                            onClick={() => setLimit(5)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                limit === 5
                                    ? "bg-[#70091f] text-white shadow-sm"
                                    : "text-stone-600 hover:text-stone-900"
                            }`}
                        >
                            Top 5
                        </button>
                        <button
                            type="button"
                            onClick={() => setLimit(10)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                limit === 10
                                    ? "bg-[#70091f] text-white shadow-sm"
                                    : "text-stone-600 hover:text-stone-900"
                            }`}
                        >
                            Top 10
                        </button>
                    </div>

                    {/* Chart Mode: Bar vs Doughnut */}
                    <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200/80">
                        <button
                            type="button"
                            onClick={() => setChartMode("bar")}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                chartMode === "bar"
                                    ? "bg-[#70091f] text-white shadow-sm"
                                    : "text-stone-600 hover:text-stone-900"
                            }`}
                            title="Bar Chart View"
                        >
                            <BarChart2 size={13} />
                            <span>Bar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartMode("doughnut")}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                chartMode === "doughnut"
                                    ? "bg-[#70091f] text-white shadow-sm"
                                    : "text-stone-600 hover:text-stone-900"
                            }`}
                            title="Doughnut Chart View"
                        >
                            <PieIcon size={13} />
                            <span>Doughnut</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex h-72 items-center justify-center">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#70091f]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#70091f] border-t-transparent" />
                        Loading symptom analytics...
                    </div>
                </div>
            ) : displayedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                        <ListOrdered size={24} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-stone-700">
                        No symptoms recorded for this period
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                        Symptoms recorded during patient visits will appear here ranked by frequency.
                    </p>
                </div>
            ) : (
                <div className="mt-5 space-y-6">
                    {chartMode === "bar" ? (
                        /* Horizontal Bar Chart */
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={displayedData}
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
                                        width={110}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const item = payload[0].payload as CommonSymptom;
                                                return (
                                                    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#70091f] text-[10px] font-bold text-white">
                                                                #{item.rank}
                                                            </span>
                                                            <p className="text-xs font-bold text-stone-900">
                                                                {item.symptom}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                                                            <span className="text-stone-500">Recorded Cases:</span>
                                                            <span className="font-bold text-[#70091f]">
                                                                {item.count} ({item.percentage}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        radius={[0, 8, 8, 0]}
                                        animationDuration={600}
                                    >
                                        {displayedData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PALETTE[index % PALETTE.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        /* Doughnut Chart */
                        <div className="h-72 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={displayedData}
                                        dataKey="count"
                                        nameKey="symptom"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        animationDuration={600}
                                    >
                                        {displayedData.map((_, index) => (
                                            <Cell
                                                key={`cell-pie-${index}`}
                                                fill={PALETTE[index % PALETTE.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const item = payload[0].payload as CommonSymptom;
                                                return (
                                                    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                                                        <p className="text-xs font-bold text-stone-900">
                                                            {item.symptom}
                                                        </p>
                                                        <div className="mt-1 flex items-center justify-between gap-4 text-xs">
                                                            <span className="text-stone-500">Cases:</span>
                                                            <span className="font-bold text-[#70091f]">
                                                                {item.count} ({item.percentage}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => (
                                            <span className="text-xs font-semibold text-stone-700">
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Ranked Symptoms Table / List */}
                    <div className="divide-y divide-stone-100 border-t border-stone-100 pt-3">
                        {displayedData.map((item, idx) => (
                            <div
                                key={item.symptom}
                                className="flex items-center justify-between py-2.5 text-xs first:pt-1 last:pb-0"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                                        style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                                    >
                                        {item.rank}
                                    </span>
                                    <span className="truncate font-semibold text-stone-800">
                                        {item.symptom}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-bold text-[#70091f]">
                                        {item.count} {item.count === 1 ? "case" : "cases"}
                                    </span>
                                    <span className="text-[11px] text-stone-400 w-10 text-right">
                                        {item.percentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
