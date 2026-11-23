import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    FileText,
    RefreshCw,
    AlertTriangle,
    ShieldAlert,
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from "recharts";
import api from "../../services/api";

interface MedicineTrendLineChartProps {
    selectedMedicineId: number | string | null;
    allMedicines: Array<{
        id: number;
        medicine_name: string;
        treatment_type?: string;
        unit?: string;
        stock?: number;
        minimum_stock?: number;
    }>;
    onSelectMedicine: (id: number | string) => void;
    onRequestStock?: (medicine: any) => void;
}

export function MedicineTrendLineChart({
    selectedMedicineId,
    allMedicines,
    onSelectMedicine,
    onRequestStock,
}: MedicineTrendLineChartProps) {
    const [trendData, setTrendData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchTrend = async (medId: number | string | null) => {
        try {
            setLoading(true);
            setError("");
            const param = medId && medId !== "all" ? `?medicine_id=${medId}` : "";
            const res = await api.get(`/medicines/analytics/stock-trend${param}`);
            setTrendData(res.data);
        } catch (err: any) {
            console.error("Fetch stock trend error:", err);
            setError("Failed to load trend analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrend(selectedMedicineId);
    }, [selectedMedicineId]);

    const activeMed = allMedicines.find((m) => String(m.id) === String(selectedMedicineId));
    const isGoingUp = trendData?.direction === "up";
    const isGoingDown = trendData?.direction === "down";
    const netChange = trendData?.net_change ?? 0;
    const minAlert = trendData?.medicine?.minimum_stock ?? activeMed?.minimum_stock ?? 10;
    const currentStock = trendData?.medicine?.stock ?? activeMed?.stock ?? trendData?.current_total_stock ?? 0;

    return (
        <div className="space-y-4">
            {/* Header & Medicine Picker */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e8dfd4] bg-[#fcfaf6] p-4 dark:border-[#382f25] dark:bg-[#201a15]">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/20 dark:text-[#f8a598]">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-[#f4ecdf]">
                            Medicine Stock Trajectory &amp; Trend Line
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            Track whether medicine inventory is going <span className="font-semibold text-emerald-600">UP</span> (restocked) or <span className="font-semibold text-red-600">DOWN</span> (dispensed to patients)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedMedicineId || "all"}
                        onChange={(e) => onSelectMedicine(e.target.value)}
                        className="rounded-xl border border-[#ded4c9] bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-xs focus:border-[#70091f] focus:outline-hidden dark:border-[#382f25] dark:bg-[#1a1511] dark:text-[#f4ecdf]"
                    >
                        <option value="all">📊 Overall Clinic Inventory (All Stocks)</option>
                        {allMedicines.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.medicine_name} ({m.stock ?? 0} {m.unit || "units"})
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => fetchTrend(selectedMedicineId)}
                        disabled={loading}
                        className="rounded-xl border border-[#ded4c9] bg-white p-2 text-stone-600 hover:bg-[#f6f0e6] dark:border-[#382f25] dark:bg-[#1a1511] dark:text-stone-300 transition"
                        title="Refresh trend data"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar: Up / Down Indicator Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 1. Status Indicator: UP / DOWN */}
                <div
                    className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                        isGoingUp
                            ? "border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                            : isGoingDown
                              ? "border-red-200 bg-red-50/80 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
                              : "border-stone-200 bg-stone-50 text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200"
                    }`}
                >
                    <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xs ${
                            isGoingUp
                                ? "bg-emerald-600 text-white"
                                : isGoingDown
                                  ? "bg-red-600 text-white"
                                  : "bg-stone-500 text-white"
                        }`}
                    >
                        {isGoingUp ? (
                            <TrendingUp size={24} />
                        ) : isGoingDown ? (
                            <TrendingDown size={24} />
                        ) : (
                            <Activity size={24} />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                Stock Trajectory
                            </span>
                        </div>
                        <p className="text-base font-extrabold">
                            {isGoingUp ? "GOING UP 📈" : isGoingDown ? "GOING DOWN 📉" : "STABLE ⚖️"}
                        </p>
                        <p className="text-[11px] font-medium opacity-85">
                            {isGoingUp
                                ? `Net +${netChange} units added`
                                : isGoingDown
                                  ? `Net ${netChange} units dispensed`
                                  : "Steady supply level"}
                        </p>
                    </div>
                </div>

                {/* 2. Current Stock */}
                <div className="rounded-2xl border border-[#e8dfd4] bg-white p-4 shadow-xs dark:border-[#382f25] dark:bg-[#1f1914]">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                        <span>Current Stock</span>
                        <Package size={14} className="text-[#70091f] dark:text-[#f8a598]" />
                    </div>
                    <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-[#f4ecdf]">
                        {Number(currentStock).toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-stone-500">
                            {activeMed?.unit || "units"}
                        </span>
                    </p>
                    <p className="text-[10px] text-stone-400">
                        Alert threshold: {minAlert} {activeMed?.unit || "units"}
                    </p>
                </div>

                {/* 3. Total Dispensed (Outflow) */}
                <div className="rounded-2xl border border-[#e8dfd4] bg-white p-4 shadow-xs dark:border-[#382f25] dark:bg-[#1f1914]">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                        <span>Total Dispensed</span>
                        <ArrowDownRight size={14} className="text-red-600" />
                    </div>
                    <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">
                        -{trendData?.total_dispensed ?? 0}
                        <span className="ml-1 text-xs font-normal text-stone-500">
                            {activeMed?.unit || "units"}
                        </span>
                    </p>
                    <p className="text-[10px] text-stone-400">Issued to patients</p>
                </div>

                {/* 4. Total Restocked (Inflow) */}
                <div className="rounded-2xl border border-[#e8dfd4] bg-white p-4 shadow-xs dark:border-[#382f25] dark:bg-[#1f1914]">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                        <span>Total Restocked</span>
                        <ArrowUpRight size={14} className="text-emerald-600" />
                    </div>
                    <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                        +{trendData?.total_restocked ?? 0}
                        <span className="ml-1 text-xs font-normal text-stone-500">
                            {activeMed?.unit || "units"}
                        </span>
                    </p>
                    <p className="text-[10px] text-stone-400">Added to inventory</p>
                </div>
            </div>

            {/* The Line Chart Container */}
            <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-sm dark:border-[#382f25] dark:bg-[#1f1914]">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#eee7de] pb-3 dark:border-[#382f25]">
                    <div>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-[#f4ecdf]">
                            {activeMed ? `${activeMed.medicine_name} — Inventory Curve` : "Total Clinic Medicine Stock Trend"}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Timeline of available stock units over clinic transactions
                        </p>
                    </div>

                    {/* Quick Requisition Button if trending down or low stock */}
                    {activeMed && onRequestStock && (
                        <button
                            type="button"
                            onClick={() => onRequestStock(activeMed)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#70091f] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#8b1505] transition cursor-pointer self-start sm:self-auto"
                        >
                            <FileText size={13} />
                            + Request Stock (rqst)
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex h-[260px] w-full items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-[#70091f]" />
                        <span className="ml-2 text-xs font-medium text-stone-500">Loading trend line...</span>
                    </div>
                ) : trendData?.timeline && trendData.timeline.length > 0 ? (
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={trendData.timeline}
                                margin={{ top: 15, right: 25, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd4" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#887d70", fontSize: 11 }}
                                    stroke="#ded4c9"
                                />
                                <YAxis
                                    tick={{ fill: "#887d70", fontSize: 11 }}
                                    stroke="#ded4c9"
                                    domain={["auto", "auto"]}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const pt = payload[0].payload;
                                        return (
                                            <div className="rounded-xl border border-[#ded4c9] bg-white p-3 text-xs shadow-xl dark:border-[#382f25] dark:bg-[#1a1511]">
                                                <p className="font-bold text-stone-900 dark:text-[#f4ecdf]">
                                                    {pt.full_date || label}
                                                </p>
                                                <div className="mt-2 space-y-1">
                                                    <p className="flex items-center justify-between gap-4 font-bold text-[#70091f] dark:text-[#f8a598]">
                                                        <span>Available Stock:</span>
                                                        <span>{pt.stock_level} {activeMed?.unit || "units"}</span>
                                                    </p>
                                                    {pt.stock_in > 0 && (
                                                        <p className="flex items-center justify-between gap-4 text-emerald-700 dark:text-emerald-400">
                                                            <span>Restocked (UP):</span>
                                                            <span className="font-semibold">+{pt.stock_in}</span>
                                                        </p>
                                                    )}
                                                    {pt.dispensed > 0 && (
                                                        <p className="flex items-center justify-between gap-4 text-red-700 dark:text-red-400">
                                                            <span>Dispensed (DOWN):</span>
                                                            <span className="font-semibold">-{pt.dispensed}</span>
                                                        </p>
                                                    )}
                                                    {pt.event && (
                                                        <p className="text-[10px] text-stone-500 border-t border-stone-200 dark:border-stone-800 pt-1 mt-1">
                                                            Event: {pt.event}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                                />
                                {activeMed && minAlert > 0 && (
                                    <ReferenceLine
                                        y={minAlert}
                                        label={{
                                            value: `Min Alert (${minAlert})`,
                                            fill: "#d97706",
                                            fontSize: 10,
                                            position: "right",
                                        }}
                                        stroke="#d97706"
                                        strokeDasharray="4 4"
                                    />
                                )}
                                <Line
                                    type="monotone"
                                    dataKey="stock_level"
                                    name="Stock Level"
                                    stroke="#70091f"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: "#70091f", stroke: "#ffffff", strokeWidth: 2 }}
                                    activeDot={{ r: 7, fill: "#8b1505", stroke: "#ffffff", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex h-[200px] flex-col items-center justify-center text-center">
                        <Activity className="h-8 w-8 text-stone-300 dark:text-stone-700" />
                        <p className="mt-2 text-xs font-semibold text-stone-600 dark:text-stone-400">
                            No transaction history available yet for this selection.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
