import api from "./api";
import { sendDeviceNotification } from "./deviceNotifications";

export interface ClinicNotification {
    id: number | string;
    key?: string;
    user_id?: number | null;
    category: "medication_reminder" | "patient_attention" | "low_stock" | "expired_medicine" | "general" | string;
    type: "info" | "warning" | "danger" | "success" | string;
    title: string;
    description: string;
    metadata?: Record<string, any> | null;
    unique_key?: string | null;
    is_read: boolean;
    read_at?: string | null;
    created_at?: string;
    updated_at?: string;
    // Compatibility fields with previous mock
    date?: string;
    read?: boolean;
}

export interface NotificationResponse {
    status: string;
    unread_count: number;
    counts: {
        total: number;
        unread: number;
        medication_reminders: number;
        patient_attention: number;
        low_stock: number;
        expired_medicine: number;
    };
    data: ClinicNotification[];
}

const STORAGE_KEY = "tcc-clinic-notifications-cache-v2";

export async function fetchClinicNotifications(category?: string): Promise<NotificationResponse> {
    try {
        const params: Record<string, any> = {};
        if (category && category !== "all") {
            params.category = category;
        }
        const res = await api.get<NotificationResponse>("/notifications", { params });
        if (res.data && Array.isArray(res.data.data)) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
            } catch {}
            return res.data;
        }
    } catch (e) {
        console.warn("Unable to fetch notifications from backend, using cache:", e);
    }

    // Fallback to cache if offline
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed;
        }
    } catch {}

    return {
        status: "fallback",
        unread_count: 0,
        counts: {
            total: 0,
            unread: 0,
            medication_reminders: 0,
            patient_attention: 0,
            low_stock: 0,
            expired_medicine: 0,
        },
        data: [],
    };
}

export async function markNotificationAsRead(id: number | string): Promise<void> {
    try {
        await api.put(`/notifications/${id}/read`);
    } catch (e) {
        console.warn("Failed to mark notification as read on backend:", e);
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tcc-notifications-updated"));
    }
}

export async function markAllNotificationsAsRead(): Promise<void> {
    try {
        await api.put("/notifications/read-all");
    } catch (e) {
        console.warn("Failed to mark all as read on backend:", e);
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tcc-notifications-updated"));
    }
}

export async function deleteClinicNotification(id: number | string): Promise<void> {
    try {
        await api.delete(`/notifications/${id}`);
    } catch (e) {
        console.warn("Failed to delete notification on backend:", e);
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tcc-notifications-updated"));
    }
}

export async function clearAllClinicNotifications(): Promise<void> {
    try {
        await api.delete("/notifications");
    } catch (e) {
        console.warn("Failed to clear all notifications on backend:", e);
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tcc-notifications-updated"));
    }
}

// Retain legacy helpers for any modules that call addClinicNotification
export function addClinicNotification(item: {
    type: "add" | "delete" | "edit" | "info" | string;
    title: string;
    description: string;
    category?: string;
    key?: string;
}): void {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tcc-notifications-updated"));
    }

    // Deduplicate device sound/vibration chimes by key so page reloads don't spam alerts
    const dedupeKey = item.key || `${item.type}:${item.title}:${item.description}`;
    try {
        const pushedRaw = localStorage.getItem("tcc-pushed-device-notifs-v2");
        const pushed: string[] = pushedRaw ? JSON.parse(pushedRaw) : [];
        if (pushed.includes(dedupeKey)) {
            return;
        }
        const nextPushed = [dedupeKey, ...pushed].slice(0, 100);
        localStorage.setItem("tcc-pushed-device-notifs-v2", JSON.stringify(nextPushed));
    } catch {
        // ignore storage errors
    }

    // Also dispatch to cellphone / device notification tray
    sendDeviceNotification(item.title, item.description).catch(() => {});
}

export function getStoredNotifications(): ClinicNotification[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return parsed.data || [];
        }
    } catch {}
    return [];
}

const DISMISSED_ACTIVITIES_KEY = "tcc-dismissed-activities";

export function getDismissedActivityKeys(): string[] {
    try {
        const raw = localStorage.getItem(DISMISSED_ACTIVITIES_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch {}
    return [];
}

export function dismissActivity(key: string): void {
    try {
        const keys = getDismissedActivityKeys();
        if (!keys.includes(key)) {
            keys.push(key);
            localStorage.setItem(DISMISSED_ACTIVITIES_KEY, JSON.stringify(keys));
        }
    } catch {}
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tcc-dismissed-activities-updated"));
    }
}

export function dismissAllActivities(keysToAdd: string[]): void {
    try {
        const keys = getDismissedActivityKeys();
        const merged = Array.from(new Set([...keys, ...keysToAdd]));
        localStorage.setItem(DISMISSED_ACTIVITIES_KEY, JSON.stringify(merged));
    } catch {}
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tcc-dismissed-activities-updated"));
    }
}

