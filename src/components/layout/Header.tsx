import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Menu,
    X,
    Bell,
    Trash2,
    ChevronDown,
    Sun,
    Moon,
    Activity,
    Stethoscope,
    Users,
    Pill,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Clock,
    AlertTriangle,
    Check,
    CheckCheck,
    LogOut,
} from "lucide-react";
import tccLogo from "../../assets/tcc-logo.png";
import api from "../../services/api";
import { invalidateRecordCache } from "../../services/recordCache";
import {
    type ClinicNotification,
    fetchClinicNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteClinicNotification,
    clearAllClinicNotifications,
    getStoredNotifications,
} from "../../services/notifications";
import {
    requestDeviceNotificationPermission,
    syncDeviceNotifications,
    sendDeviceNotification,
    getDeviceNotificationPermissionStatus,
    getNotificationEnvironmentInfo,
} from "../../services/deviceNotifications";
import { useTheme } from "../../utils/theme";
import { Avatar } from "../dashboard/DashboardWidgets";
import { ConfirmationModal } from "../student-management/FieldsAndModals";
import { PwaDropdownItem } from "../common/PwaInstallPrompt";

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
    sidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

function useOutsideClick(
    ref: React.RefObject<HTMLElement | null>,
    handler: () => void,
    active: boolean
) {
    useEffect(() => {
        if (!active) return;
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler, active]);
}

function formatRelative(dateStr?: string) {
    if (!dateStr) return "Just now";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function formatRole(role?: string) {
    if (!role) return "Clinic Staff";
    return role;
}


export function Header({
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed = false,
    onToggleSidebar,
}: HeaderProps): React.JSX.Element {
    const navigate = useNavigate();    const { isDark, toggleTheme } = useTheme();

    const bellRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const [bellOpen, setBellOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [confirmClearNotifications, setConfirmClearNotifications] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState<any | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<ClinicNotification[]>(() =>
        getStoredNotifications()
    );
    const [categoryCounts, setCategoryCounts] = useState({
        total: 0,
        unread: 0,
        medication_reminders: 0,
        patient_attention: 0,
        low_stock: 0,
        expired_medicine: 0,
    });
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [deviceNotifPerm, setDeviceNotifPerm] = useState<string>("default");

    const [user, setUser] = useState<any>(() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const loadNotifications = async (cat?: string) => {
        try {
            setLoadingNotifs(true);
            const res = await fetchClinicNotifications(cat !== undefined ? cat : selectedCategory);
            if (res && Array.isArray(res.data)) {
                setNotifications(res.data);
                setUnreadCount(res.unread_count ?? res.counts?.unread ?? 0);
                if (res.counts) {
                    setCategoryCounts(res.counts);
                }
                // Automatically push new notifications to the cellphone / device tray!
                syncDeviceNotifications(res.data).catch(() => {});
            }
        } catch (e) {
            console.warn("Error loading notifications:", e);
        } finally {
            setLoadingNotifs(false);
        }
    };

    // Check and request cellphone / browser push notification permission on mount
    useEffect(() => {
        getDeviceNotificationPermissionStatus().then((status) => {
            setDeviceNotifPerm(status);
            if (status === "granted") {
                requestDeviceNotificationPermission().catch(() => {});
            }
        });
    }, []);

    // Listen to user changes (e.g. Profile updates)
    useEffect(() => {
        const handleStorage = () => {
            try {
                const raw = localStorage.getItem("user");
                setUser(raw ? JSON.parse(raw) : null);
            } catch {
                // ignore
            }
        };
        window.addEventListener("storage", handleStorage);
        window.addEventListener("tcc-user-updated", handleStorage);
        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("tcc-user-updated", handleStorage);
        };
    }, []);

    // Listen to notifications update events and sync periodically
    useEffect(() => {
        loadNotifications(selectedCategory);
        const interval = setInterval(() => {
            loadNotifications(selectedCategory);
        }, 20000);

        const handleNotifUpdate = () => {
            loadNotifications(selectedCategory);
        };
        window.addEventListener("tcc-notifications-updated", handleNotifUpdate);
        window.addEventListener("storage", handleNotifUpdate);
        return () => {
            clearInterval(interval);
            window.removeEventListener("tcc-notifications-updated", handleNotifUpdate);
            window.removeEventListener("storage", handleNotifUpdate);
        };
    }, [selectedCategory]);

    const handleLogout = async () => {
        setProfileMenuOpen(false);
        if (setSidebarOpen) {
            setSidebarOpen(false);
        }

        try {
            api.post("/logout", {}, { timeout: 3000 }).catch((logoutError) => {
                console.error("Logout error:", logoutError);
            });
        } catch {
            // ignore
        }

        const { clearAuthSession } = await import("../../services/api");
        clearAuthSession();

        navigate("/login", { replace: true });
    };

    useOutsideClick(bellRef, () => setBellOpen(false), bellOpen);
    useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false), profileMenuOpen);

    const handleClearAll = async () => {
        await clearAllClinicNotifications();
        setNotifications([]);
        setUnreadCount(0);
        setConfirmClearNotifications(false);
    };

    const handleDeleteOne = async (idOrKey: string | number) => {
        await deleteClinicNotification(idOrKey);
        setNotifications((prev) => prev.filter((n) => n.id !== idOrKey && n.key !== idOrKey));
        loadNotifications(selectedCategory);
    };

    const handleMarkOneRead = async (idOrKey: string | number) => {
        await markNotificationAsRead(idOrKey);
        setNotifications((prev) =>
            prev.map((n) => (n.id === idOrKey || n.key === idOrKey ? { ...n, is_read: true, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true, read: true }))
        );
        setUnreadCount(0);
    };

    const getNotificationVisuals = (category?: string, type?: string) => {
        switch (category) {
            case "medication_reminder":
                return {
                    label: "Medication Reminder",
                    icon: <Clock size={15} />,
                    iconBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                    badge: "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
                };
            case "patient_attention":
                return {
                    label: "Patient Attention",
                    icon: <Stethoscope size={15} />,
                    iconBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
                    badge: "bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60",
                };
            case "low_stock":
                return {
                    label: "Low Stock Alert",
                    icon: <AlertTriangle size={15} />,
                    iconBg: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
                    badge: "bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/60",
                };
            case "expired_medicine":
                return {
                    label: "Expired Medicine",
                    icon: <AlertCircle size={15} />,
                    iconBg: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
                    badge: "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
                };
            default:
                return {
                    label: "Clinic Alert",
                    icon: <Activity size={15} />,
                    iconBg: "bg-[#fcebe7] text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]",
                    badge: "bg-stone-50 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700",
                };
        }
    };

    return (
        <header className="print:hidden sticky top-0 z-30 flex h-[68px] sm:h-[72px] w-full items-center justify-between border-b border-[#eee7de] bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur shadow-xs transition-colors duration-200 dark:border-stone-800 dark:bg-[#16120e]/95">
            {/* Left side: Mobile Hamburger & Logo */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 mr-3 sm:mr-6">
                <button
                    type="button"
                    onClick={() => setSidebarOpen((prev) => !prev)}
                    className="flex lg:hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#70091f] transition duration-200 hover:bg-[#fcebe7] active:scale-95 dark:text-[#f8a598] dark:hover:bg-stone-800 cursor-pointer"
                    aria-label="Toggle Navigation Sidebar"
                    title="Open Navigation Menu"
                    aria-expanded={sidebarOpen}
                >
                    <Menu size={22} />
                </button>

                {/* Mobile Logo & Title display */}
                <div className="flex items-center gap-2 lg:hidden shrink-0">
                    <img
                        src={tccLogo}
                        alt="TCC Logo"
                        onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                                target.dataset.fallback = "1";
                                target.src = "/tcc-logo.png";
                            } else if (target.dataset.fallback === "1") {
                                target.dataset.fallback = "2";
                                target.src = "/tcc-logo.jpg";
                            }
                        }}
                        className="h-8 w-8 rounded-full object-contain ring-1 ring-[#70091f]/20"
                    />
                    <span className="font-bold text-sm tracking-tight text-[#70091f] dark:text-[#f8a598]">
                        TCC Clinic
                    </span>
                </div>
            </div>

            {/* Right side: Notifications Bell & Profile Dropdown */}
            <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Notifications Bell */}
                <div ref={bellRef} className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setBellOpen((prev) => {
                                const next = !prev;
                                if (next) {
                                    loadNotifications(selectedCategory);
                                }
                                return next;
                            });
                        }}
                        aria-label="Notifications"
                        aria-expanded={bellOpen}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#766959] transition duration-200 hover:bg-[#fcebe7] hover:text-[#70091f] focus:outline-none dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-[#f8a598] cursor-pointer"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#70091f] px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-stone-900 shadow-sm animate-pulse">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {bellOpen && (
                        <>
                            {/* Mobile dark backdrop to easily dismiss */}
                            <div
                                className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] sm:hidden"
                                onClick={() => setBellOpen(false)}
                                aria-hidden="true"
                            />
                            <div className="fixed inset-x-2.5 top-16 z-50 flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1a1511] animate-in fade-in zoom-in-95 duration-150 sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-[420px] sm:max-h-[560px]">
                                {/* Notification Header */}
                            <div className="flex items-center justify-between border-b border-[#eee7de] bg-[#fcfaf7] px-4 py-3 dark:border-stone-800 dark:bg-[#1f1914]">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                        Notifications
                                    </p>
                                    {unreadCount > 0 ? (
                                        <span className="rounded-full bg-[#70091f]/10 px-2 py-0.5 text-[10px] font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                            {unreadCount} unread
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            All caught up
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const env = getNotificationEnvironmentInfo();
                                            if (!env.isNative && !env.isSecure) {
                                                alert(
                                                    "⚠️ Browser Security Restriction:\n\n" +
                                                    "Web browsers (Chrome/Edge/Safari) strictly block push notifications on plain HTTP IP addresses like " +
                                                    window.location.host + ".\n\n" +
                                                    "To receive notifications on your cellphone:\n" +
                                                    "1. Use the official TCC Clinic Android App (.apk), OR\n" +
                                                    "2. Open the live HTTPS site: https://tcc-clinic.cloud\n" +
                                                    "3. Or open on your PC via: http://localhost:5173"
                                                );
                                                return;
                                            }

                                            const granted = await requestDeviceNotificationPermission();
                                            setDeviceNotifPerm(granted ? "granted" : "denied");
                                            if (granted) {
                                                const sent = await sendDeviceNotification(
                                                    "TCC Clinic Notification",
                                                    "Cellphone notifications are active! You will receive live alerts for medication reminders and patient attention."
                                                );
                                                if (!sent) {
                                                    alert("Alert sent! If it did not pop up, please check if your phone's notification volume is on or Do Not Disturb is off.");
                                                }
                                            } else {
                                                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied") {
                                                    alert(
                                                        "Notification permission is blocked in your browser.\n\n" +
                                                        "To enable it:\n" +
                                                        "1. Tap the tune/padlock icon next to the URL in your browser address bar.\n" +
                                                        "2. Tap 'Permissions' -> 'Notifications'.\n" +
                                                        "3. Change it from Block to 'Allow'."
                                                    );
                                                } else {
                                                    alert("Notification permission is not enabled yet. Please tap 'Allow' when your browser or phone asks for permission.");
                                                }
                                            }
                                        }}
                                        title="Send a test notification to your cellphone"
                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 transition cursor-pointer"
                                    >
                                        <span>📱 Test Alert</span>
                                    </button>
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleMarkAllRead}
                                            title="Mark all as read"
                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#70091f] hover:bg-[#fcebe7] dark:text-[#f8a598] dark:hover:bg-stone-800 transition cursor-pointer"
                                        >
                                            <CheckCheck size={14} />
                                            <span>Mark read</span>
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmClearNotifications(true)}
                                            className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Enable Phone Notifications Activation Banner */}
                            {deviceNotifPerm !== "granted" && (
                                <div className="mx-3 my-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 dark:border-amber-800/60 dark:bg-amber-950/30">
                                    <div className="flex items-start gap-2">
                                        <span className="text-base">🔔</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                                Enable Cellphone Alerts
                                            </p>
                                            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug mt-0.5">
                                                Allow notifications so you receive alerts on your cellphone status bar for visits & medication reminders.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const env = getNotificationEnvironmentInfo();
                                                    if (!env.isNative && !env.isSecure) {
                                                        alert(
                                                            "⚠️ Browser Security Restriction:\n\n" +
                                                            "Web browsers (Chrome/Edge/Safari) strictly block push notifications on plain HTTP IP addresses like " +
                                                            window.location.host + ".\n\n" +
                                                            "To receive notifications on your cellphone:\n" +
                                                            "1. Use the official TCC Clinic Android App (.apk), OR\n" +
                                                            "2. Open the live HTTPS site: https://tcc-clinic.cloud\n" +
                                                            "3. Or open on your PC via: http://localhost:5173"
                                                        );
                                                        return;
                                                    }

                                                    const ok = await requestDeviceNotificationPermission();
                                                    setDeviceNotifPerm(ok ? "granted" : "denied");
                                                    if (ok) {
                                                        await sendDeviceNotification(
                                                            "TCC Clinic Alerts Active",
                                                            "Your cellphone will now receive alerts for clinic visits, reminders, and emergencies."
                                                        );
                                                    } else {
                                                        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied") {
                                                            alert(
                                                                "Notifications are blocked in your browser settings.\n\n" +
                                                                "Please tap the lock/settings icon next to the address bar, go to Permissions -> Notifications, and select 'Allow'."
                                                            );
                                                        } else {
                                                            alert("Notification permission was not granted. Please check your phone settings or tap the lock icon in your browser address bar to allow notifications.");
                                                        }
                                                    }
                                                }}
                                                className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-[#70091f] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#8b1505] transition cursor-pointer shadow-sm"
                                            >
                                                <span>Allow Cellphone Alerts</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Category Filter Tabs */}
                            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#eee7de] bg-[#faf7f4] px-3 py-2 text-xs dark:border-stone-800 dark:bg-[#18130f] scrollbar-none">
                                {[
                                    { id: "all", label: "All", count: categoryCounts.total },
                                    { id: "medication_reminder", label: "Medication", count: categoryCounts.medication_reminders },
                                    { id: "patient_attention", label: "Patient Care", count: categoryCounts.patient_attention },
                                    { id: "low_stock", label: "Low Stock", count: categoryCounts.low_stock },
                                    { id: "expired_medicine", label: "Expired", count: categoryCounts.expired_medicine },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(tab.id);
                                            loadNotifications(tab.id);
                                        }}
                                        className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                                            selectedCategory === tab.id
                                                ? "bg-[#70091f] text-white shadow-xs"
                                                : "text-stone-600 hover:bg-stone-200/60 dark:text-stone-400 dark:hover:bg-stone-800"
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        {tab.count > 0 && (
                                            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                                selectedCategory === tab.id
                                                    ? "bg-white/20 text-white"
                                                    : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Notifications List */}
                            {loadingNotifs && notifications.length === 0 ? (
                                <div className="p-8 text-center text-xs text-stone-400">
                                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#70091f]" />
                                    <span>Updating alerts...</span>
                                </div>
                            ) : notifications.length ? (
                                <ul className="max-h-[380px] overflow-y-auto divide-y divide-[#eee7de] dark:divide-stone-800/80">
                                    {notifications.map((item) => {
                                        const isUnread = !item.is_read && !item.read;
                                        const visuals = getNotificationVisuals(item.category, item.type);
                                        const dateStr = item.created_at || item.date || item.updated_at;
                                        const itemId = item.id || item.key;

                                        return (
                                            <li
                                                key={item.id || item.key || item.unique_key}
                                                onClick={() => {
                                                    if (isUnread && itemId) handleMarkOneRead(itemId);
                                                    setBellOpen(false);
                                                    if (item.category === "low_stock" || item.category === "expired_medicine") {
                                                        navigate("/medicine");
                                                    } else if (item.category === "medication_reminder" || item.category === "patient_attention") {
                                                        navigate("/clinic-visits");
                                                    }
                                                }}
                                                className={`group flex items-start gap-3 p-3.5 transition cursor-pointer ${
                                                    isUnread
                                                        ? "bg-[#fffdfa] dark:bg-[#251e18] hover:bg-[#fcf8f2] dark:hover:bg-[#2a221b]"
                                                        : "hover:bg-stone-50 dark:hover:bg-stone-800/40"
                                                }`}
                                            >
                                                {/* Category Icon */}
                                                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs ${visuals.iconBg}`}>
                                                    {visuals.icon}
                                                </div>

                                                {/* Content */}
                                                <div className="min-w-0 flex-1 text-left">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${visuals.badge}`}>
                                                            {visuals.label}
                                                        </span>
                                                        {isUnread && (
                                                            <span className="flex h-2 w-2 rounded-full bg-[#70091f] dark:bg-rose-500 animate-pulse" title="Unread" />
                                                        )}
                                                        <span className="ml-auto text-[10px] text-stone-400 dark:text-stone-500 shrink-0">
                                                            {formatRelative(dateStr)}
                                                        </span>
                                                    </div>

                                                    <p className={`text-xs font-bold leading-snug ${
                                                        isUnread ? "text-stone-900 dark:text-stone-100" : "text-stone-700 dark:text-stone-300"
                                                    }`}>
                                                        {item.title}
                                                    </p>

                                                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col items-center gap-1 shrink-0 ml-1">
                                                    {isUnread && itemId && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkOneRead(itemId);
                                                            }}
                                                            title="Mark as read"
                                                            className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition cursor-pointer"
                                                        >
                                                            <Check size={13} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setNotifToDelete(item);
                                                        }}
                                                        title="Delete notification"
                                                        className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400">
                                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                                    <p className="font-semibold text-stone-700 dark:text-stone-300">You're all caught up!</p>
                                    <p className="mt-0.5 text-[11px]">No active notifications in this category.</p>
                                </div>
                            )}
                        </div>
                    </>
                    )}
                </div>

                <div className="h-7 w-px bg-[#eee7de] dark:bg-stone-800" />

                {/* Profile Avatar & Interactive Dropdown Menu */}
                <div ref={profileMenuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setProfileMenuOpen((prev) => !prev)}
                        aria-expanded={profileMenuOpen}
                        aria-haspopup="true"
                        aria-label="User profile menu"
                        className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-stone-100 sm:gap-2.5 sm:px-2.5 sm:py-1.5 dark:hover:bg-stone-800/60 focus:outline-none"
                    >
                        <Avatar user={user} size={38} iconSize={20} />

                        <div className="hidden text-left sm:block">
                            <p className="text-sm font-semibold leading-tight text-stone-800 dark:text-stone-200">
                                {user?.name || "Clinic Staff"}
                            </p>
                            <p className="text-xs text-[#887d70] leading-tight dark:text-stone-400">
                                {formatRole(user?.role)}
                            </p>
                        </div>

                        <ChevronDown
                            size={14}
                            className={`hidden text-stone-400 transition-transform duration-200 sm:block ${
                                profileMenuOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {profileMenuOpen && (
                        <div className="absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#e8dfd4] bg-white p-2 shadow-2xl dark:border-stone-800 dark:bg-[#1f1914] animate-in fade-in zoom-in-95 duration-150">
                            {/* User Info Header */}
                            <div className="flex items-center gap-3 border-b border-[#eee7de] px-3 py-3 dark:border-stone-800">
                                <Avatar user={user} size={42} iconSize={22} />
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                                        {user?.name || "Clinic Staff"}
                                    </p>
                                    <p className="truncate text-xs text-[#887d70] dark:text-stone-400">
                                        {user?.email || "admin.clinic.edu@gmail.com"}
                                    </p>
                                    <span className="mt-1.5 inline-block rounded-full bg-[#70091f]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                        {formatRole(user?.role)}
                                    </span>
                                </div>
                            </div>

                            {/* Dark Mode / Light Mode Switcher Row */}
                            <div className="p-1.5">
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    role="switch"
                                    aria-checked={isDark}
                                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 transition hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                                            {isDark ? <Moon size={15} /> : <Sun size={15} />}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                                                {isDark ? "Dark Mode" : "Light Mode"}
                                            </p>
                                            <p className="text-[10px] text-[#887d70] dark:text-stone-400">
                                                Tap to switch theme
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                                            isDark ? "bg-[#70091f]" : "bg-stone-300 dark:bg-stone-600"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                                isDark ? "translate-x-4" : "translate-x-1"
                                            }`}
                                        />
                                    </div>
                                </button>
                            </div>

                            {/* Download / Install App option on mobile */}
                            <PwaDropdownItem />

                            {/* Log Out Row - Visible ONLY on mobile view */}
                            <div className="border-t border-[#eee7de] p-1.5 dark:border-stone-800/80 sm:hidden">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        setConfirmLogout(true);
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-red-600 transition hover:bg-red-50/80 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                        <LogOut size={15} strokeWidth={2.2} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                            Log Out
                                        </p>
                                        <p className="text-[10px] text-red-400/80 dark:text-red-400/60">
                                            Sign out of your account
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal for Clear All Notifications */}
            <ConfirmationModal
                open={confirmClearNotifications}
                title="Clear All Notifications"
                message="Are you sure you want to clear all notifications? This action cannot be undone."
                confirmText="Yes, Clear All"
                cancelText="Cancel"
                danger={true}
                onConfirm={() => {
                    handleClearAll();
                    setConfirmClearNotifications(false);
                }}
                onClose={() => setConfirmClearNotifications(false)}
            />

            {/* Confirmation Modal for Individual Notification Delete */}
            <ConfirmationModal
                open={Boolean(notifToDelete)}
                title="Delete Notification"
                message={
                    notifToDelete
                        ? `Are you sure you want to delete "${notifToDelete.title}"? This action cannot be undone.`
                        : "Are you sure you want to delete this notification?"
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                danger={true}
                onConfirm={() => {
                    if (notifToDelete) {
                        handleDeleteOne(notifToDelete.id || notifToDelete.key);
                        setNotifToDelete(null);
                    }
                }}
                onClose={() => setNotifToDelete(null)}
            />

            {/* Confirmation Modal for Logout */}
            <ConfirmationModal
                open={confirmLogout}
                title="Log Out Confirmation"
                message="Are you sure you want to log out of your session? Any unsaved changes may be lost."
                confirmText="Log Out"
                cancelText="Stay Logged In"
                danger={true}
                onConfirm={handleLogout}
                onClose={() => setConfirmLogout(false)}
            />
        </header>
    );
}

export default Header;
