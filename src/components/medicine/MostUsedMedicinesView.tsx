import { useState, useEffect } from "react";
import {
    Flame,
    TrendingUp,
    TrendingDown,
    Activity,
    Package,
    AlertTriangle,
    FileText,
    RefreshCw,
    Search,
    Send,
    CheckCircle2,
    Calendar,
    LineChart as ChartIcon,
} from "lucide-react";
import api from "../../services/api";

interface MostUsedItem {
    id: number;
    medicine_name: string;
    treatment_type: string;
    unit: string;
    stock: number;
    minimum_stock: number;
    expiration_date: string | null;
    status: string;
    total_dispensed: number;
    visit_count: number;
    last_dispensed: string | null;
    usage_rate: string;
    recommended_request_qty: number;
    trend_direction: "up" | "down" | "stable";
    has_pending_requisition: boolean;
    pending_requested_qty: number;
}

interface MostUsedMedicinesViewProps {
    onRequestStock: (item: MostUsedItem) => void;
    onViewTrend: (medicineId: number) => void;
}

export function MostUsedMedicinesView({
    onRequestStock,
    onViewTrend,
}: MostUsedMedicinesViewProps) {
    const [items, setItems] = useState<MostUsedItem[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [usageFilter, setUsageFilter] = useState("all");

    const fetchMostUsed = async () => {
        try {
            setLoading(true);
            const res = await api.get("/medicines/analytics/most-used");
            setItems(res.data.most_used || []);
            setSummary(res.data.summary || null);
        } catch (err) {
            console.error("Error fetching most used medicines:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMostUsed();
    }, []);

    const filtered = items.filter((item) => {
        const matchesSearch =
            !search.trim() ||
            item.medicine_name.toLowerCase().includes(search.toLowerCase()) ||
            item.treatment_type.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (usageFilter === "high") return item.usage_rate === "High Usage";
        if (usageFilter === "low_stock") return item.stock <= item.minimum_stock;
        if (usageFilter === "depleting") return item.trend_direction === "down";

        return true;
    });

    return (
        <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-[#e8dfd4] bg-[#fcfaf6] p-4 dark:border-[#382f25] dark:bg-[#201a15]">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                        <span>Total Dispensed</span>
                        <Package size={15} className="text-[#70091f]" />
                    </div>
                    <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-[#f4ecdf]">
                        {summary?.total_dispensed_all ?? 0}
                        <span className="ml-1 text-xs font-normal text-stone-500">units</span>
                    </p>
                    <p className="text-[10px] text-stone-400">Total patient dispensations</p>
                </div>

                <div className="rounded-2xl border border-[#e8dfd4] bg-[#fcfaf6] p-4 dark:border-[#382f25] dark:bg-[#201a15]">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                        <span>High Usage Medicines</span>
                        <Flame size={15} className="text-amber-600" />
                    </div>
                    <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                        {summary?.high_usage_count ?? 0}
                        <span className="ml-1 text-xs font-normal text-stone-500">frequently given</span>
                    </p>
                    <p className="text-[10px] text-stone-400">High patient demand</p>
                </div>

                <div className="rounded-2xl border border-[#e8dfd4] bg-[#fcfaf6] p-4 dark:border-[#382f25] dark:bg-[#201a15]">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                        <span>Needs Requisition</span>
                        <AlertTriangle size={15} className="text-red-600" />
                    </div>
                    <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">
                        {summary?.low_stock_high_usage_count ?? 0}
                        <span className="ml-1 text-xs font-normal text-stone-500">running low</span>
                    </p>
                    <p className="text-[10px] text-stone-400">Popular items near empty</p>
                </div>

                <div className="flex flex-col justify-center rounded-2xl border border-[#70091f]/20 bg-[#70091f]/5 p-4 dark:border-[#70091f]/40 dark:bg-[#70091f]/10">
                    <p className="text-xs font-bold text-[#70091f] dark:text-[#f8a598]">
                        Clinic Requisition (rqst)
                    </p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 mb-2">
                        Fast stock replenishment order
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            if (items.length > 0) {
                                onRequestStock(items[0]);
                            }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#70091f] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#8b1505] transition cursor-pointer"
                    >
                        <FileText size={13} />
                        + Make Requisition Request
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-[#eee7de] pb-3 dark:border-[#382f25]">
                <div className="relative w-full max-w-sm">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search most used medicines..."
                        className="w-full rounded-xl border border-[#ded4c9] bg-white py-2 pl-9 pr-3 text-xs text-stone-800 shadow-xs focus:border-[#70091f] focus:outline-hidden dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                    />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                        { key: "all", label: "All Used" },
                        { key: "high", label: "🔥 High Usage Only" },
                        { key: "low_stock", label: "⚠️ Low Stock / Depleting" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setUsageFilter(tab.key)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                usageFilter === tab.key
                                    ? "bg-[#70091f] text-white shadow-xs"
                                    : "border border-[#ded4c9] bg-white text-stone-600 hover:bg-[#f6f0e6] dark:border-[#382f25] dark:bg-[#1a1511] dark:text-stone-300"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={fetchMostUsed}
                        className="rounded-lg border border-[#ded4c9] bg-white p-1.5 text-stone-600 hover:bg-[#f6f0e6] dark:border-[#382f25] dark:bg-[#1a1511] dark:text-stone-300"
                        title="Reload"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#e8dfd4] bg-white shadow-xs dark:border-[#382f25] dark:bg-[#1f1914]">
                <table className="w-full min-w-[780px] text-left text-xs">
                    <thead>
                        <tr className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-stone-600 dark:border-[#382f25] dark:bg-[#251f19] dark:text-stone-300">
                            <th className="py-3 px-4 font-bold">Rank &amp; Medicine</th>
                            <th className="py-3 px-4 font-bold">Category</th>
                            <th className="py-3 px-4 font-bold">Total Dispensed</th>
                            <th className="py-3 px-4 font-bold">Usage Level</th>
                            <th className="py-3 px-4 font-bold">Current Stock</th>
                            <th className="py-3 px-4 font-bold">Trajectory</th>
                            <th className="py-3 px-4 font-bold text-center">Action / Requisition (rqst)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee7de] dark:divide-[#382f25]">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="py-10 text-center text-stone-500">
                                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#70091f]" />
                                    Loading usage rankings...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-stone-500">
                                    No medicines match your filter.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item, idx) => {
                                const isDown = item.trend_direction === "down";
                                const isUp = item.trend_direction === "up";

                                return (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-[#fcfaf6] dark:hover:bg-[#2a221b] transition"
                                    >
                                        {/* Rank & Name */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${
                                                        idx === 0
                                                            ? "bg-amber-400 text-amber-950 shadow-xs"
                                                            : idx === 1
                                                              ? "bg-stone-300 text-stone-900"
                                                              : idx === 2
                                                                ? "bg-amber-700/30 text-amber-900 dark:text-amber-200"
                                                                : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                                                    }`}
                                                >
                                                    #{idx + 1}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-stone-900 dark:text-[#f4ecdf]">
                                                        {item.medicine_name}
                                                    </p>
                                                    <p className="text-[10px] text-stone-400">
                                                        {item.visit_count} clinic visit{item.visit_count !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="py-3 px-4 text-stone-700 dark:text-stone-300 font-medium">
                                            {item.treatment_type}
                                        </td>

                                        {/* Total Dispensed */}
                                        <td className="py-3 px-4">
                                            <span className="font-extrabold text-[#70091f] dark:text-[#f8a598]">
                                                {item.total_dispensed} {item.unit}
                                            </span>
                                            {item.last_dispensed && (
                                                <p className="text-[10px] text-stone-400">
                                                    Last: {item.last_dispensed}
                                                </p>
                                            )}
                                        </td>

                                        {/* Usage Rate */}
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    item.usage_rate === "High Usage"
                                                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                                                        : item.usage_rate === "Moderate Usage"
                                                          ? "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                                          : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                                }`}
                                            >
                                                {item.usage_rate === "High Usage" && <Flame size={11} />}
                                                {item.usage_rate}
                                            </span>
                                        </td>

                                        {/* Stock Level */}
                                        <td className="py-3 px-4">
                                            <span
                                                className={`font-bold ${
                                                    item.stock <= 0
                                                        ? "text-red-600"
                                                        : item.stock <= item.minimum_stock
                                                          ? "text-amber-600"
                                                          : "text-emerald-700 dark:text-emerald-400"
                                                }`}
                                            >
                                                {item.stock} {item.unit}
                                            </span>
                                            <p className="text-[10px] text-stone-400">
                                                Min: {item.minimum_stock}
                                            </p>
                                        </td>

                                        {/* Trajectory Up / Down */}
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => onViewTrend(item.id)}
                                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition hover:opacity-80 cursor-pointer ${
                                                    isDown
                                                        ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-300"
                                                        : isUp
                                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300"
                                                          : "bg-stone-100 text-stone-600 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
                                                }`}
                                                title="Click to see stock line chart"
                                            >
                                                {isDown ? (
                                                    <TrendingDown size={13} className="text-red-600" />
                                                ) : isUp ? (
                                                    <TrendingUp size={13} className="text-emerald-600" />
                                                ) : (
                                                    <Activity size={13} />
                                                )}
                                                {isDown ? "Going Down" : isUp ? "Going Up" : "Stable"}
                                            </button>
                                        </td>

                                        {/* Action / Requisition */}
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewTrend(item.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-[#ded4c9] bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-[#f6f0e6] dark:border-[#382f25] dark:bg-[#1a1511] dark:text-stone-300 transition cursor-pointer"
                                                    title="View Line Chart"
                                                >
                                                    <ChartIcon size={12} />
                                                    Chart
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onRequestStock(item)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-[#70091f] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#8b1505] transition cursor-pointer"
                                                >
                                                    <FileText size={12} />
                                                    Make Request (rqst)
                                                </button>
                                            </div>

                                            {item.has_pending_requisition && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                                        <CheckCircle2 size={10} />
                                                        Pending Order ({item.pending_requested_qty} {item.unit})
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
