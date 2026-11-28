import React, { useCallback, useEffect, useState } from "react";
import {
    Activity,
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    Clock,
    Package,
    QrCode,
    RefreshCw,
    Search,
    ShieldCheck,
    TrendingUp,
    UserCheck,
} from "lucide-react";
import api from "../services/api";

type InsightTab = "queue" | "followups" | "inventory" | "trends" | "audit";

export default function ClinicInsights(): React.JSX.Element {
    const [tab, setTab] = useState<InsightTab>("queue");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    // Queue & QR state
    const [queueItems, setQueueItems] = useState<any[]>([]);
    const [queueCounts, setQueueCounts] = useState({ waiting: 0, in_consultation: 0, completed_today: 0 });
    const [qrInput, setQrInput] = useState("");
    const [resolvedPatient, setResolvedPatient] = useState<any>(null);
    const [qrToken, setQrToken] = useState("");
    const [priority, setPriority] = useState<"Routine" | "Urgent" | "Follow-up">("Routine");
    const [complaint, setComplaint] = useState("");
    const [timeline, setTimeline] = useState<any[]>([]);
    const [showTimeline, setShowTimeline] = useState(false);

    // Follow-ups state
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [followUpSummary, setFollowUpSummary] = useState({ overdue: 0, pending: 0, completed: 0 });

    // Inventory Intelligence state
    const [expiryData, setExpiryData] = useState<any>(null);
    const [forecastData, setForecastData] = useState<any>(null);
    const [forecastDays, setForecastDays] = useState<30 | 60 | 90>(30);

    // Health Trends state
    const [trendsData, setTrendsData] = useState<any>(null);

    // Audit Logs state
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditError, setAuditError] = useState("");

    const currentUserRole = (() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? String(JSON.parse(raw)?.role || "").toLowerCase() : "";
        } catch {
            return "";
        }
    })();

    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/queue");
            setQueueItems(res.data?.data || []);
            setQueueCounts(res.data?.counts || { waiting: 0, in_consultation: 0, completed_today: 0 });
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load clinic queue.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadFollowUps = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/follow-ups");
            setFollowUps(res.data?.data || []);
            setFollowUpSummary(res.data?.summary || { overdue: 0, pending: 0, completed: 0 });
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load follow-ups.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadInventoryIntelligence = useCallback(async (days: 30 | 60 | 90 = forecastDays) => {
        setLoading(true);
        setError("");
        try {
            const [expRes, fcRes] = await Promise.all([
                api.get("/medicines/expiry-intelligence"),
                api.get("/medicines/forecast", { params: { days } }),
            ]);
            setExpiryData(expRes.data);
            setForecastData(fcRes.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load inventory intelligence.");
        } finally {
            setLoading(false);
        }
    }, [forecastDays]);

    const loadTrends = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/reports/health-trends");
            setTrendsData(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load health trends.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadAuditLogs = useCallback(async () => {
        setLoading(true);
        setAuditError("");
        try {
            const res = await api.get("/audit-logs", { params: { per_page: 25 } });
            setAuditLogs(res.data?.data || []);
        } catch (err: any) {
            setAuditError(err?.response?.data?.message || "Admin permission required to view audit logs.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === "queue") loadQueue();
        else if (tab === "followups") loadFollowUps();
        else if (tab === "inventory") loadInventoryIntelligence(forecastDays);
        else if (tab === "trends") loadTrends();
        else if (tab === "audit") loadAuditLogs();
    }, [tab, forecastDays, loadQueue, loadFollowUps, loadInventoryIntelligence, loadTrends, loadAuditLogs]);

    const handleQrResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!qrInput.trim()) return;
        setError("");
        setToast("");
        try {
            const res = await api.get("/patients/qr-resolve", { params: { code: qrInput.trim() } });
            setResolvedPatient({ ...res.data.patient, patient_type: res.data.patient_type });
            setQrToken(res.data.qr_token || "");
            const tlRes = await api.get(`/patients/${res.data.patient_type}/${res.data.patient.id}/timeline`);
            setTimeline(tlRes.data?.timeline || []);
            setShowTimeline(true);
        } catch (err: any) {
            setResolvedPatient(null);
            setTimeline([]);
            setError(err?.response?.data?.message || "Patient not found for this QR code or ID.");
        }
    };

    const handleCheckIn = async () => {
        if (!resolvedPatient) return;
        setError("");
        try {
            await api.post("/queue", {
                patient_type: resolvedPatient.patient_type,
                patient_id: resolvedPatient.id,
                priority,
                chief_complaint: complaint.trim() || undefined,
            });
            setToast(`${resolvedPatient.full_name} added to clinic queue.`);
            setComplaint("");
            await loadQueue();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to add patient to queue.");
        }
    };

    const updateQueueStatus = async (id: number, status: string) => {
        try {
            await api.patch(`/queue/${id}/status`, { status });
            setToast(`Queue entry updated to ${status}.`);
            await loadQueue();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update queue status.");
        }
    };

    const updateFollowUpStatus = async (visitId: number, status: "completed" | "missed") => {
        try {
            await api.patch(`/clinic-visits/${visitId}/follow-up`, { follow_up_status: status });
            setToast(`Follow-up marked as ${status}.`);
            await loadFollowUps();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update follow-up.");
        }
    };

    const tabs: { id: InsightTab; label: string; icon: React.ComponentType<any>; adminOnly?: boolean }[] = [
        { id: "queue", label: "Queue & QR Check-In", icon: QrCode },
        { id: "followups", label: "Follow-ups", icon: CalendarClock },
        { id: "inventory", label: "Expiry & Forecast", icon: Package },
        { id: "trends", label: "Health Trends", icon: TrendingUp },
        { id: "audit", label: "Audit Logs", icon: ShieldCheck, adminOnly: true },
    ];

    return (
        <div className="tcc-module-page space-y-6 p-4 sm:p-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#1e1b18] dark:text-[#f4ecdf]">
                        <Activity className="h-6 w-6 text-[#70091f]" />
                        Clinic Operations &amp; Intelligence
                    </h1>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        Digital triage queue, QR patient lookup, follow-up monitoring, expiry risk, forecasting, and audit trail.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (tab === "queue") loadQueue();
                        else if (tab === "followups") loadFollowUps();
                        else if (tab === "inventory") loadInventoryIntelligence(forecastDays);
                        else if (tab === "trends") loadTrends();
                        else if (tab === "audit") loadAuditLogs();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e8dfd4] bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 dark:border-[#382f25] dark:bg-[#251f19] dark:text-stone-200"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </header>

            <div className="flex flex-wrap gap-2 border-b border-[#e8dfd4] pb-3 dark:border-[#382f25]">
                {tabs
                    .filter((t) => !t.adminOnly || currentUserRole === "admin")
                    .map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                                    active
                                        ? "bg-[#70091f] text-white shadow-sm"
                                        : "border border-[#e8dfd4] bg-white text-stone-700 hover:bg-stone-50 dark:border-[#382f25] dark:bg-[#251f19] dark:text-stone-300"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                            </button>
                        );
                    })}
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}
            {toast && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {toast}
                </div>
            )}

            {tab === "queue" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-xs dark:border-[#382f25] dark:bg-[#251f19]">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-[#1e1b18] dark:text-[#f4ecdf]">
                            <QrCode className="h-4 w-4 text-[#70091f]" />
                            QR / Institutional ID Lookup
                        </h2>
                        <form onSubmit={handleQrResolve} className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={qrInput}
                                onChange={(e) => setQrInput(e.target.value)}
                                placeholder="Scan QR token or enter ID..."
                                className="w-full rounded-xl border border-[#e8dfd4] bg-stone-50 px-3 py-2 text-xs dark:border-[#382f25] dark:bg-[#1b1612] dark:text-white"
                            />
                            <button
                                type="submit"
                                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#70091f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#590719]"
                            >
                                <Search className="h-3.5 w-3.5" />
                                Find
                            </button>
                        </form>

                        {resolvedPatient && (
                            <div className="mt-4 space-y-3 rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] p-3.5 text-xs dark:border-[#382f25] dark:bg-[#1e1914]">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-bold text-stone-900 dark:text-white">{resolvedPatient.full_name}</p>
                                        <p className="text-stone-500 dark:text-stone-400">
                                            {resolvedPatient.patient_type.toUpperCase()} • {resolvedPatient.identifier} • {resolvedPatient.department || "N/A"}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-[#70091f]/10 px-2 py-0.5 text-[10px] font-bold text-[#70091f] dark:text-rose-300">
                                        {resolvedPatient.visit_count} visits
                                    </span>
                                </div>
                                {qrToken && (
                                    <p className="truncate rounded bg-stone-100 px-2 py-1 font-mono text-[10px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                        QR Token: {qrToken}
                                    </p>
                                )}
                                <div className="space-y-2">
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full rounded-lg border border-[#e8dfd4] bg-white px-2.5 py-1.5 text-xs dark:border-[#382f25] dark:bg-[#251f19] dark:text-white"
                                    >
                                        <option value="Routine">Routine</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="Follow-up">Follow-up</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={complaint}
                                        onChange={(e) => setComplaint(e.target.value)}
                                        placeholder="Chief complaint (optional)"
                                        className="w-full rounded-lg border border-[#e8dfd4] bg-white px-2.5 py-1.5 text-xs dark:border-[#382f25] dark:bg-[#251f19] dark:text-white"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCheckIn}
                                            className="flex-1 rounded-lg bg-[#70091f] py-2 text-xs font-semibold text-white hover:bg-[#590719]"
                                        >
                                            Add to Queue
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTimeline((v) => !v)}
                                            className="rounded-lg border border-[#e8dfd4] px-3 py-2 text-xs font-semibold text-stone-700 dark:border-[#382f25] dark:text-stone-200"
                                        >
                                            Timeline ({timeline.length})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showTimeline && timeline.length > 0 && (
                            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Medical Timeline</p>
                                {timeline.map((v) => (
                                    <div key={v.id} className="rounded-lg border border-[#e8dfd4] p-2.5 text-xs dark:border-[#382f25]">
                                        <div className="flex justify-between font-semibold text-stone-800 dark:text-stone-100">
                                            <span>{v.visit_date}</span>
                                            <span>{v.reason}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                                            Temp: {v.temperature} • BP: {v.blood_pressure} • Med: {v.medicine_name || "N/A"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-xs dark:border-[#382f25] dark:bg-[#251f19] lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="flex items-center gap-2 text-sm font-bold text-[#1e1b18] dark:text-[#f4ecdf]">
                                <UserCheck className="h-4 w-4 text-[#70091f]" />
                                Active Clinic Queue
                            </h2>
                            <div className="flex gap-2 text-[11px] font-semibold">
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                    Waiting: {queueCounts.waiting}
                                </span>
                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                                    In Consultation: {queueCounts.in_consultation}
                                </span>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    Completed Today: {queueCounts.completed_today}
                                </span>
                            </div>
                        </div>

                        {queueItems.length === 0 ? (
                            <p className="mt-6 text-center text-xs text-stone-500">No patients currently in the active queue.</p>
                        ) : (
                            <div className="mt-4 space-y-2.5">
                                {queueItems.map((q) => (
                                    <div key={q.id} className="flex flex-col justify-between gap-3 rounded-xl border border-[#e8dfd4] p-3.5 sm:flex-row sm:items-center dark:border-[#382f25]">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#70091f] text-[11px] font-bold text-white">
                                                    #{q.queue_position}
                                                </span>
                                                <p className="text-sm font-bold text-stone-900 dark:text-white">{q.patient_name}</p>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    q.priority === "Urgent"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                                                        : q.priority === "Follow-up"
                                                          ? "bg-amber-100 text-amber-700"
                                                          : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                                }`}>
                                                    {q.priority}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                                {q.patient_identifier} • {q.department || "N/A"} • {q.chief_complaint || "General Consultation"}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {q.status === "Waiting" && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateQueueStatus(q.id, "In Consultation")}
                                                    className="rounded-lg bg-[#70091f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#590719]"
                                                >
                                                    Call Patient
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => updateQueueStatus(q.id, "Completed")}
                                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                            >
                                                Complete
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateQueueStatus(q.id, "Cancelled")}
                                                className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-500 hover:bg-stone-100 dark:border-[#382f25]"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === "followups" && (
                <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-xs dark:border-[#382f25] dark:bg-[#251f19]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-[#1e1b18] dark:text-[#f4ecdf]">Patient Follow-up Monitoring</h2>
                        <div className="flex gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-red-700">Overdue: {followUpSummary.overdue}</span>
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-700">Pending: {followUpSummary.pending}</span>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">Completed: {followUpSummary.completed}</span>
                        </div>
                    </div>
                    {followUps.length === 0 ? (
                        <p className="mt-6 text-center text-xs text-stone-500">No follow-up schedules recorded yet.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-[#e8dfd4] text-stone-500 dark:border-[#382f25]">
                                    <tr>
                                        <th className="py-2 pr-3">Patient</th>
                                        <th className="py-2 pr-3">Visit Date</th>
                                        <th className="py-2 pr-3">Follow-up Date</th>
                                        <th className="py-2 pr-3">Reason</th>
                                        <th className="py-2 pr-3">Status</th>
                                        <th className="py-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8dfd4] dark:divide-[#382f25]">
                                    {followUps.map((f) => (
                                        <tr key={f.visit_id}>
                                            <td className="py-2.5 pr-3 font-semibold text-stone-900 dark:text-white">{f.patient_name}</td>
                                            <td className="py-2.5 pr-3">{f.visit_date || "N/A"}</td>
                                            <td className="py-2.5 pr-3 font-medium">{f.follow_up_date || "N/A"}</td>
                                            <td className="py-2.5 pr-3">{f.reason || "N/A"}</td>
                                            <td className="py-2.5 pr-3 capitalize">{f.follow_up_status}</td>
                                            <td className="py-2.5 text-right">
                                                {f.follow_up_status !== "completed" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateFollowUpStatus(f.visit_id, "completed")}
                                                        className="rounded-lg bg-[#70091f] px-2.5 py-1 text-[11px] font-semibold text-white"
                                                    >
                                                        Mark Done
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === "inventory" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                            <p className="text-xs font-medium text-red-700 dark:text-red-300">Expired Batches</p>
                            <p className="mt-1 text-2xl font-bold text-red-900 dark:text-red-100">{expiryData?.summary?.expired_batches ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Expiring &le; 30 Days</p>
                            <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-100">{expiryData?.summary?.expiring_30d_batches ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-[#e8dfd4] bg-white p-4 dark:border-[#382f25] dark:bg-[#251f19]">
                            <p className="text-xs font-medium text-stone-500">Expiring &le; 60 Days</p>
                            <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-white">{expiryData?.summary?.expiring_60d_batches ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-[#e8dfd4] bg-white p-4 dark:border-[#382f25] dark:bg-[#251f19]">
                            <p className="text-xs font-medium text-stone-500">Expiring &le; 90 Days</p>
                            <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-white">{expiryData?.summary?.expiring_90d_batches ?? 0}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-xs dark:border-[#382f25] dark:bg-[#251f19]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-bold text-[#1e1b18] dark:text-[#f4ecdf]">Medicine Consumption Forecast</h2>
                            <div className="flex gap-1.5">
                                {([30, 60, 90] as const).map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setForecastDays(d)}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                            forecastDays === d
                                                ? "bg-[#70091f] text-white"
                                                : "border border-[#e8dfd4] text-stone-600 dark:border-[#382f25] dark:text-stone-300"
                                        }`}
                                    >
                                        {d}d
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-[#e8dfd4] text-stone-500 dark:border-[#382f25]">
                                    <tr>
                                        <th className="py-2 pr-3">Medicine</th>
                                        <th className="py-2 pr-3">Stock</th>
                                        <th className="py-2 pr-3">Avg Daily Use</th>
                                        <th className="py-2 pr-3">Est. Days Left</th>
                                        <th className="py-2 pr-3">Suggested Reorder</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8dfd4] dark:divide-[#382f25]">
                                    {(forecastData?.items || []).slice(0, 20).map((item: any) => (
                                        <tr key={item.medicine_id}>
                                            <td className="py-2.5 pr-3 font-semibold text-stone-900 dark:text-white">{item.medicine_name}</td>
                                            <td className="py-2.5 pr-3">{item.current_stock} {item.unit}</td>
                                            <td className="py-2.5 pr-3">
                                                {item.insufficient_data ? (
                                                    <span className="text-stone-400">Insufficient history</span>
                                                ) : (
                                                    `${item.avg_daily_consumption}/day`
                                                )}
                                            </td>
                                            <td className="py-2.5 pr-3">
                                                {item.estimated_days_remaining !== null ? `${item.estimated_days_remaining} days` : "N/A"}
                                            </td>
                                            <td className="py-2.5 pr-3 font-semibold text-[#70091f] dark:text-rose-300">
                                                {item.suggested_reorder_qty > 0 ? `+${item.suggested_reorder_qty} ${item.unit}` : "Sufficient"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === "trends" && (
                <div className="space-y-4 rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-xs dark:border-[#382f25] dark:bg-[#251f19]">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-[#1e1b18] dark:text-[#f4ecdf]">Health Trend Detection &amp; Executive Summary</h2>
                            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{trendsData?.disclaimer}</p>
                        </div>
                    </div>
                    {trendsData?.executive_summary && (
                        <div className="rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] p-4 text-xs font-medium text-stone-800 dark:border-[#382f25] dark:bg-[#1e1914] dark:text-stone-200">
                            {trendsData.executive_summary}
                        </div>
                    )}
                    {(trendsData?.alerts || []).length === 0 ? (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            No unusual symptom or visit increases detected over the past 7 days compared to the 28-day baseline.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {trendsData.alerts.map((a: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="font-bold">{a.reason}</p>
                                        <p className="mt-0.5">{a.notice}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === "audit" && (
                <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5 shadow-xs dark:border-[#382f25] dark:bg-[#251f19]">
                    <h2 className="text-sm font-bold text-[#1e1b18] dark:text-[#f4ecdf]">Immutable System Audit Trail</h2>
                    {auditError ? (
                        <p className="mt-4 text-xs text-red-600">{auditError}</p>
                    ) : auditLogs.length === 0 ? (
                        <p className="mt-6 text-center text-xs text-stone-500">No audit log entries recorded yet.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-[#e8dfd4] text-stone-500 dark:border-[#382f25]">
                                    <tr>
                                        <th className="py-2 pr-3">Timestamp</th>
                                        <th className="py-2 pr-3">User</th>
                                        <th className="py-2 pr-3">Action</th>
                                        <th className="py-2 pr-3">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8dfd4] dark:divide-[#382f25]">
                                    {auditLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="py-2 pr-3 whitespace-nowrap text-stone-500">
                                                <Clock className="mr-1 inline h-3 w-3" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="py-2 pr-3 font-medium">{log.user_name || "System"} ({log.user_role || "N/A"})</td>
                                            <td className="py-2 pr-3 font-mono text-[11px] text-[#70091f] dark:text-rose-300">{log.action}</td>
                                            <td className="py-2 pr-3">{log.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
