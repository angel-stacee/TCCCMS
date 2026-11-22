import { useState, useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { CalendarDays } from "lucide-react";

export type TrendPoint = {
    date: string;
    total: number;
    students: number;
    employees: number;
};

export type VisitTotals = {
    total?: number;
    students?: number;
    employees?: number;
};

interface InteractiveClinicVisitsChartProps {
    visitTrends?: TrendPoint[];
    recentVisits?: any[];
    monthlyVisits?: any[];
    visitTotals?: VisitTotals;
    loading?: boolean;
}

const CHART_CONFIG = {
    students: {
        label: "Students",
        color: "#8a6f50",
        colorDark: "#c49a6c",
    },
    employees: {
        label: "Faculty & Staff",
        color: "#70091f",
        colorDark: "#e27888",
    },
    total: {
        label: "Total Visits",
        color: "#2563eb",
        colorDark: "#60a5fa",
    },
} as const;

type ChartKey = keyof typeof CHART_CONFIG;

export function InteractiveClinicVisitsChart({
    visitTrends,
    recentVisits,
    monthlyVisits,
    visitTotals,
    loading = false,
}: InteractiveClinicVisitsChartProps) {
    const [activeChart, setActiveChart] = useState<ChartKey>("total");

    // Build continuous daily sequence for chartData (past 60 days)
    const chartData = useMemo(() => {
        // Collect real date map
        const realMap: Record<string, { total: number; students: number; employees: number }> = {};

        if (Array.isArray(visitTrends) && visitTrends.length > 0) {
            visitTrends.forEach((t) => {
                if (!t.date) return;
                const dKey = t.date.slice(0, 10);
                realMap[dKey] = {
                    total: Number(t.total || 0),
                    students: Number(t.students || 0),
                    employees: Number(t.employees || 0),
                };
            });
        } else if (Array.isArray(recentVisits) && recentVisits.length > 0) {
            recentVisits.forEach((v) => {
                const rawDate = v.visit_date || v.created_at;
                if (!rawDate) return;
                const dKey = String(rawDate).slice(0, 10);
                if (!realMap[dKey]) {
                    realMap[dKey] = { total: 0, students: 0, employees: 0 };
                }
                realMap[dKey].total += 1;
                if (v.student_id || v.student) {
                    realMap[dKey].students += 1;
                } else if (v.faculty_id || v.staff_id || v.faculty || v.staff) {
                    realMap[dKey].employees += 1;
                }
            });
        }

        const formatDateKey = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        };

        // Generate past 60 days
        const points: TrendPoint[] = [];
        const daysToGenerate = 60;
        const now = new Date();

        for (let i = daysToGenerate - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = formatDateKey(d);

            if (realMap[dateStr]) {
                points.push({
                    date: dateStr,
                    total: realMap[dateStr].total,
                    students: realMap[dateStr].students,
                    employees: realMap[dateStr].employees,
                });
            } else {
                points.push({
                    date: dateStr,
                    total: 0,
                    students: 0,
                    employees: 0,
                });
            }
        }

        return points;
    }, [visitTrends, recentVisits, monthlyVisits]);

    const totals = useMemo(() => {
        if (visitTotals && typeof visitTotals.total === "number") {
            return {
                students: Number(visitTotals.students ?? 0),
                employees: Number(visitTotals.employees ?? 0),
                total: Number(visitTotals.total ?? 0),
            };
        }

        return {
            students: chartData.reduce((acc, curr) => acc + curr.students, 0),
            employees: chartData.reduce((acc, curr) => acc + curr.employees, 0),
            total: chartData.reduce((acc, curr) => acc + curr.total, 0),
        };
    }, [visitTotals, chartData]);

    const activeConfig = CHART_CONFIG[activeChart];

    return (
        <div className="overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-[#382f25] dark:bg-[#251f19] xl:col-span-5">
            {/* Card Header with Interactive Tabs */}
            <div className="flex flex-col border-b border-[#e8dfd4] sm:flex-row sm:items-stretch dark:border-[#382f25]">
                <div className="flex flex-1 flex-col justify-center gap-1.5 p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4ecdf] text-[#8a6f50] dark:bg-[#342a22] dark:text-[#d4b996]">
                            <CalendarDays size={18} />
                        </div>
                        <h2 className="text-base font-bold text-stone-900 dark:text-[#f4ecdf]">
                            Clinic Visits Overview
                        </h2>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                        Interactive consultation trends over the last 60 days
                    </p>
                </div>

                {/* Interactive tab buttons matching the screenshot */}
                <div className="flex border-t border-[#e8dfd4] sm:border-t-0 sm:border-l dark:border-[#382f25]">
                    {(["students", "employees", "total"] as ChartKey[]).map((key) => {
                        const config = CHART_CONFIG[key];
                        const isActive = activeChart === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                data-active={isActive}
                                onClick={() => setActiveChart(key)}
                                className={`flex flex-1 flex-col justify-center gap-1 px-4 py-3.5 text-left transition-all even:border-l even:border-[#e8dfd4] sm:px-6 sm:py-5 dark:even:border-[#382f25] ${
                                    isActive
                                        ? "bg-[#fcfaf6] text-stone-900 shadow-xs dark:bg-[#30261e] dark:text-stone-100"
                                        : "text-stone-500 hover:bg-stone-50/70 dark:text-stone-400 dark:hover:bg-[#2b221a]"
                                }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: config.color }}
                                    />
                                    <span className="text-xs font-medium tracking-tight">
                                        {config.label}
                                    </span>
                                </div>
                                <span className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl dark:text-[#f4ecdf]">
                                    {totals[key].toLocaleString()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chart Canvas */}
            <div className="p-3 sm:p-6">
                {loading ? (
                    <div className="flex h-[250px] w-full items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8a6f50] border-t-transparent" />
                    </div>
                ) : (
                    <div className="aspect-auto h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    left: 10,
                                    right: 12,
                                    top: 10,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                    className="stroke-stone-200 dark:stroke-stone-800"
                                    strokeOpacity={0.6}
                                />

                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        });
                                    }}
                                    className="text-[11px] font-medium fill-stone-400 dark:fill-stone-500"
                                />

                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const p = payload[0];
                                        const dateFormatted = new Date(label).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        });

                                        return (
                                            <div className="rounded-xl border border-[#e8dfd4] bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-[#382f25] dark:bg-[#1a1612]/95">
                                                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                                                    {dateFormatted}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: activeConfig.color }}
                                                    />
                                                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                                                        {activeConfig.label}:
                                                    </span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-white">
                                                        {Number(p.value || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />

                                <Line
                                    dataKey={activeChart}
                                    type="monotone"
                                    stroke={activeConfig.color}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{
                                        r: 6,
                                        fill: activeConfig.color,
                                        stroke: "#ffffff",
                                        strokeWidth: 2,
                                    }}
                                    isAnimationActive={true}
                                    animationDuration={600}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
