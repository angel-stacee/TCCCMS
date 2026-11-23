import { useMemo } from "react";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";
import { getReasonColorHex } from "../../utils/reasonColors";

export type ReasonItem = {
    label: string;
    value: number;
    color?: string;
};

interface VisitReasonsPieChartProps {
    data?: ReasonItem[];
    total?: number;
    loading?: boolean;
    className?: string;
}

// TCC Institutional Burgundy & Warm Tonal Palette
// Replaces multi-color rainbow with a refined, cohesive, and non-clashing medical palette
export const TCC_VISIT_REASON_COLORS = [
    "#70091f", // 1. Deep Burgundy (TCC Primary)
    "#981b2f", // 2. Rich Crimson Wine
    "#b83a4e", // 3. Ruby Wine
    "#cf6274", // 4. Soft Berry Rose
    "#822634", // 5. Dark Maroon Wine
    "#df8997", // 6. Warm Blush Tint
    "#600d1b", // 7. Deep Velvet Burgundy
    "#a34555", // 8. Muted Heather Burgundy
];

export function VisitReasonsPieChart({
    data = [],
    total,
    loading = false,
    className = "",
}: VisitReasonsPieChartProps) {
    const chartData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        return data.map((item, idx) => ({
            name: item.label,
            value: Number(item.value || 0),
            fill: TCC_VISIT_REASON_COLORS[idx % TCC_VISIT_REASON_COLORS.length],
        }));
    }, [data]);

    const totalCount = useMemo(() => {
        if (typeof total === "number" && total > 0) return total;
        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    }, [total, chartData]);

    return (
        <div
            className={`flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-[#382f25] dark:bg-[#251f19] ${className}`}
        >
            {/* Header matching shadcn CardHeader */}
            <div className="flex flex-col gap-1 pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4ecdf] text-[#8a6f50] dark:bg-[#342a22] dark:text-[#d4b996]">
                        <PieIcon size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold tracking-tight text-stone-900 dark:text-[#f4ecdf]">
                            Visit Reasons
                        </h3>
                    </div>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                    Breakdown of common consultation reasons
                </p>
            </div>

            {/* Content matching shadcn CardContent */}
            <div className="flex-1 py-2">
                {loading ? (
                    <div className="flex h-[200px] w-full items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8a6f50] border-t-transparent" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[200px] w-full flex-col items-center justify-center text-center">
                        <p className="text-sm font-medium text-stone-400 dark:text-stone-500">
                            No visit reasons recorded yet
                        </p>
                    </div>
                ) : (
                    <div className="mx-auto aspect-square h-[190px] w-full max-w-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const entry = payload[0];
                                        const count = Number(entry.value || 0);
                                        const percent =
                                            totalCount > 0
                                                ? Math.round((count / totalCount) * 100)
                                                : 0;

                                        return (
                                            <div className="rounded-xl border border-stone-800 bg-[#14120e] px-3 py-2 text-white shadow-xl">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: String(entry.payload?.fill || "#3b82f6") }}
                                                    />
                                                    <span className="text-xs font-medium text-stone-200">
                                                        {entry.name}:
                                                    </span>
                                                    <span className="text-xs font-bold text-white">
                                                        {count} ({percent}%)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={46}
                                    outerRadius={78}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                    isAnimationActive={true}
                                    animationDuration={600}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.fill}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Reason Legend Items */}
                {chartData.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-[#e8dfd4]/60 pt-3 dark:border-[#382f25]/60">
                        {chartData.slice(0, 4).map((item) => {
                            const percent =
                                totalCount > 0
                                    ? Math.round((item.value / totalCount) * 100)
                                    : 0;
                            return (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between gap-2 text-xs"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span
                                            className="h-2 w-2 shrink-0 rounded-full"
                                            style={{ backgroundColor: item.fill }}
                                        />
                                        <span
                                            className="truncate font-medium text-stone-600 dark:text-stone-300"
                                            title={item.name}
                                        >
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="shrink-0 font-bold text-stone-900 dark:text-[#f4ecdf]">
                                        {item.value} ({percent}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer matching shadcn CardFooter */}
            <div className="flex flex-col gap-1 border-t border-[#e8dfd4] pt-3 text-xs dark:border-[#382f25]">
                <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                    <span>Active consultation trends</span>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    Showing distribution of recorded patient visits
                </div>
            </div>
        </div>
    );
}

// Standalone ChartPieSimple export matching shadcn component interface
export function ChartPieSimple({
    data,
    total,
    loading = false,
    className = "",
}: VisitReasonsPieChartProps) {
    return (
        <VisitReasonsPieChart
            data={data}
            total={total}
            loading={loading}
            className={className}
        />
    );
}
