import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    Search,
    Loader2,
    ArrowRight,
    ArrowLeft,
    FileText,
    ChevronRight,
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
import { useTheme } from "../../utils/theme";
import { Avatar, StudentDetail, Skeleton } from "../dashboard/DashboardWidgets";
import { ConfirmationModal } from "../student-management/FieldsAndModals";

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

function getPersonName(person?: any) {
    if (!person) return "Unknown";
    if (person.name) return person.name;
    const fullName = `${person.first_name || ""} ${person.last_name || ""}`.trim();
    return fullName || "Unknown";
}

function getInitials(name?: string) {
    if (!name) return "?";
    return (
        name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "?"
    );
}

function getPersonId(person?: any) {
    return (
        person?.student_id ||
        person?.staff_id ||
        person?.employee_id ||
        person?.id ||
        ""
    );
}

function formatDisplayDate(raw?: string | null) {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
    "/dashboard": {
        title: "Dashboard",
        subtitle: "Overview & Clinic Analytics",
    },
    "/students": {
        title: "Patient Management",
        subtitle: "Students, Faculty & Staff Health Records",
    },
    "/clinic-visits": {
        title: "Clinic Visits",
        subtitle: "Consultations, Triage & Health Logs",
    },
    "/medicine": {
        title: "Medicine Inventory",
        subtitle: "Pharmaceutical Stocks & Dispensation",
    },
    "/reports": {
        title: "Reports & Analytics",
        subtitle: "Institutional Health Data & Summaries",
    },
    "/organization": {
        title: "Organizational Chart",
        subtitle: "Healthcare Staff & Administration",
    },
    "/staff": {
        title: "Organizational Chart",
        subtitle: "Healthcare Staff & Administration",
    },
    "/settings": {
        title: "Settings",
        subtitle: "Account Preferences & Configuration",
    },
    "/profile": {
        title: "My Profile",
        subtitle: "Personal Details & Account Activity",
    },
};

export function Header({
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed = false,
    onToggleSidebar,
}: HeaderProps): React.JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboardPage = location.pathname.toLowerCase() === "/dashboard" || location.pathname === "/";
    const { isDark, toggleTheme } = useTheme();

    const bellRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [bellOpen, setBellOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [confirmClearNotifications, setConfirmClearNotifications] = useState(false);
    const [notifToDelete, setNotifToDelete] = useState<any | null>(null);
    const [headerSearch, setHeaderSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
    const [personVisits, setPersonVisits] = useState<any[]>([]);
    const [personRecords, setPersonRecords] = useState<any[]>([]);
    const [personDetailsLoading, setPersonDetailsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<{
        students: any[];
        staff: any[];
        faculties: any[];
    }>({ students: [], staff: [], faculties: [] });
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
            }
        } catch (e) {
            console.warn("Error loading notifications:", e);
        } finally {
            setLoadingNotifs(false);
        }
    };

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

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("tcc-dashboard-cache");
        try {
            invalidateRecordCache();
        } catch {
            // ignore
        }

        navigate("/login", { replace: true });
    };

    useOutsideClick(bellRef, () => setBellOpen(false), bellOpen);
    useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false), profileMenuOpen);
    useOutsideClick(searchContainerRef, () => setSearchOpen(false), searchOpen);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const term = headerSearch.trim();
        if (!term) return;

        if (selectedPerson) {
            setSearchOpen(false);
            const targetType = selectedPerson._type || "student";
            const targetId = getPersonId(selectedPerson);
            navigate(
                `/students?${
                    targetType !== "student" ? `tab=${targetType}&` : ""
                }profile_type=${encodeURIComponent(targetType)}&profile_code=${encodeURIComponent(
                    targetId
                )}&search=${encodeURIComponent(targetId)}`
            );
            return;
        }

        const allPeople = [
            ...searchResults.students.map((s) => ({ ...s, _type: "student" })),
            ...searchResults.staff.map((st) => ({ ...st, _type: "staff" })),
            ...searchResults.faculties.map((f) => ({ ...f, _type: "faculty" })),
        ];

        const exact = allPeople.find(
            (p) =>
                String(getPersonId(p)).toLowerCase() === term.toLowerCase() ||
                getPersonName(p).toLowerCase() === term.toLowerCase()
        );

        if (exact) {
            setSelectedPerson(exact);
            setSearchOpen(true);
            return;
        }

        if (allPeople.length > 0) {
            setSelectedPerson(allPeople[0]);
            setSearchOpen(true);
            return;
        }

        setSearchOpen(false);
        navigate(`/students?search=${encodeURIComponent(term)}`);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                isDashboardPage &&
                e.key === "/" &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA"
            ) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const term = headerSearch.trim();
        if (!term || term.length < 2) {
            setSearchResults({ students: [], staff: [], faculties: [] });
            setIsSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const [studentsRes, staffRes, facultyRes] = await Promise.allSettled([
                    api.get("/students", { params: { search: term, per_page: 5 } }),
                    api.get("/staff", { params: { search: term, per_page: 5 } }),
                    api.get("/faculties", { params: { search: term, per_page: 5 } }),
                ]);

                const extractData = (res: PromiseSettledResult<any>) => {
                    if (res.status !== "fulfilled") return [];
                    const d = res.value?.data;
                    return Array.isArray(d) ? d : (d?.data || d?.students || d?.staff || d?.faculties || []);
                };

                setSearchResults({
                    students: extractData(studentsRes),
                    staff: extractData(staffRes),
                    faculties: extractData(facultyRes),
                });
            } catch {
                // ignore
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [headerSearch]);

    // Fetch visits and health records when a person is clicked from search results
    useEffect(() => {
        let cancelled = false;
        if (!selectedPerson) {
            setPersonVisits([]);
            setPersonRecords([]);
            setPersonDetailsLoading(false);
            return;
        }

        const loadPersonDetails = async () => {
            setPersonDetailsLoading(true);
            try {
                const personPk = selectedPerson.id ?? getPersonId(selectedPerson);
                const param =
                    selectedPerson._type === "faculty"
                        ? `faculty_id=${encodeURIComponent(personPk)}`
                        : selectedPerson._type === "staff"
                        ? `staff_id=${encodeURIComponent(personPk)}`
                        : `student_id=${encodeURIComponent(personPk)}`;

                const res = await api.get(`/clinic-visits?${param}`);
                if (cancelled) return;

                const data = res.data;
                const visits = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
                setPersonVisits(visits);
                setPersonRecords(
                    visits
                        .filter(
                            (v: any) =>
                                v.assessment ||
                                v.treatment ||
                                v.remarks ||
                                v.symptoms ||
                                v.diagnosis ||
                                v.notes
                        )
                        .map((v: any) => ({
                            id: `record-${v.id}`,
                            record_type: v.reason || "Clinic Visit",
                            record_date: v.visit_date || v.created_at,
                            diagnosis: v.diagnosis || v.assessment,
                            notes: v.notes || v.remarks || v.treatment,
                            allergies: v.allergies,
                        }))
                );
            } catch {
                if (!cancelled) {
                    setPersonVisits([]);
                    setPersonRecords([]);
                }
            } finally {
                if (!cancelled) {
                    setPersonDetailsLoading(false);
                }
            }
        };

        loadPersonDetails();
        return () => {
            cancelled = true;
        };
    }, [selectedPerson]);

    const currentMeta = useMemo(() => {
        const path = location.pathname.toLowerCase();
        for (const key of Object.keys(PAGE_META)) {
            if (path === key || path.startsWith(`${key}/`)) {
                return PAGE_META[key];
            }
        }
        return {
            title: "TCC Clinic",
            subtitle: "Health Services & Clinic Management",
        };
    }, [location.pathname]);

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
            {/* Left side: Mobile Hamburger & Logo + Global Search Bar (replacing Title per user request) */}
            <div className="flex flex-1 items-center gap-2.5 sm:gap-4 min-w-0 mr-3 sm:mr-6">
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

                {/* Mobile Logo display */}
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
                    {!isDashboardPage && (
                        <span className="text-sm sm:text-base font-bold tracking-tight text-[#70091f] dark:text-[#f8a598] whitespace-nowrap">
                            TCC Clinic
                        </span>
                    )}
                </div>

                {/* Global Search Bar (ONLY displayed on the Dashboard) */}
                {isDashboardPage && (
                    <div ref={searchContainerRef} className="relative flex-1 max-w-md lg:max-w-xl">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                        <div className="relative flex items-center">
                            <Search size={17} className="pointer-events-none absolute left-3.5 text-stone-500 dark:text-stone-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={headerSearch}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setHeaderSearch(val);
                                    setSelectedPerson(null);
                                    if (val.trim().length >= 2) setSearchOpen(true);
                                }}
                                onFocus={() => {
                                    if (headerSearch.trim().length >= 2 || selectedPerson) setSearchOpen(true);
                                }}
                                placeholder="Search patients, ID, staff..."
                                className="w-full rounded-full border border-stone-300/90 bg-[#faf7f4] py-2 pl-10 pr-10 text-sm font-medium text-stone-900 shadow-2xs outline-none transition placeholder:font-normal placeholder:text-stone-500 hover:bg-white focus:border-[#70091f] focus:bg-white focus:ring-2 focus:ring-[#70091f]/15 dark:border-stone-700 dark:bg-[#1c1713] dark:text-stone-100 dark:placeholder:text-stone-400 dark:hover:bg-[#221b16] dark:focus:bg-[#16120e]"
                            />
                            <div className="absolute right-3 flex items-center gap-1.5">
                                {isSearching ? (
                                    <Loader2 size={15} className="animate-spin text-[#70091f] dark:text-[#f8a598]" />
                                ) : headerSearch ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHeaderSearch("");
                                            setSelectedPerson(null);
                                            setSearchOpen(false);
                                        }}
                                        className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
                                    >
                                        <X size={15} />
                                    </button>
                                ) : (
                                    <kbd className="hidden sm:inline-flex h-5.5 items-center rounded-md border border-stone-300 bg-white px-1.5 text-xs font-semibold text-stone-600 shadow-2xs dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                        /
                                    </kbd>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Instant Search Results Dropdown & Rich Patient Flyout Card */}
                    {searchOpen && (headerSearch.trim().length >= 2 || selectedPerson) && (
                        <>
                            {/* Mobile overlay backdrop */}
                            <div
                                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] sm:hidden"
                                onClick={() => {
                                    setSearchOpen(false);
                                    setSelectedPerson(null);
                                }}
                            />
                            <div className="fixed inset-x-2.5 top-16 z-50 mt-1 max-h-[calc(100dvh-76px)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3.5 shadow-2xl transition-all duration-200 dark:border-stone-800 dark:bg-[#1a1511] sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-[calc(100vh-90px)] sm:w-[min(840px,calc(100vw-48px))] sm:p-4">
                                {selectedPerson ? (
                                    <div>
                                        {/* Patient Header Row matching preview card */}
                                        <div className="flex items-center gap-2.5 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPerson(null)}
                                                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-[#faf7f4] text-stone-600 transition hover:bg-[#fcebe7] hover:text-[#70091f] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                                                aria-label="Back to search results"
                                                title="Back to search results"
                                            >
                                                <ArrowLeft size={16} />
                                            </button>

                                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-[#fcebe7] text-xs sm:text-sm font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                {getInitials(getPersonName(selectedPerson))}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                                                        {getPersonName(selectedPerson)}
                                                    </h3>
                                                    <span className="rounded-full bg-[#fcebe7] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                        {selectedPerson._type || "Student"}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                                                    {selectedPerson._type === "faculty"
                                                        ? "Faculty ID"
                                                        : selectedPerson._type === "staff"
                                                        ? "Staff ID"
                                                        : "Student ID"}
                                                    : {getPersonId(selectedPerson)}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchOpen(false);
                                                    setSelectedPerson(null);
                                                    setHeaderSearch("");
                                                }}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 cursor-pointer"
                                                aria-label="Close search preview"
                                            >
                                                <X size={17} />
                                            </button>
                                        </div>

                                    {/* Demographics Details Grid */}
                                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                                        {selectedPerson._type === "student" ? (
                                            <>
                                                <StudentDetail label="COURSE" value={selectedPerson.course} />
                                                <StudentDetail label="YEAR LEVEL" value={selectedPerson.year_level} />
                                                <StudentDetail label="SECTION" value={selectedPerson.section} />
                                            </>
                                        ) : (
                                            <>
                                                <StudentDetail label="POSITION" value={selectedPerson.position} />
                                                <StudentDetail label="DEPARTMENT" value={selectedPerson.department} />
                                            </>
                                        )}
                                        <StudentDetail label="SEX" value={selectedPerson.sex || selectedPerson.gender} />
                                        <StudentDetail label="BIRTH DATE" value={formatDisplayDate(selectedPerson.birth_date)} />
                                        <StudentDetail label="CONTACT" value={selectedPerson.contact_number || selectedPerson.contact} />
                                    </div>

                                    {selectedPerson.address && (
                                        <div className="mt-2.5">
                                            <StudentDetail label="ADDRESS" value={selectedPerson.address} />
                                        </div>
                                    )}

                                    {/* Clinic Visits Section */}
                                    <div className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-800">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Clinic Visits</p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                                    Visit history for this {selectedPerson._type === "faculty" ? "faculty member" : selectedPerson._type === "staff" ? "staff member" : "student"}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-[#fcebe7] px-2.5 py-0.5 text-xs font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                {personVisits.length}
                                            </span>
                                        </div>

                                        {personDetailsLoading ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-16 w-full rounded-xl" />
                                                <Skeleton className="h-16 w-full rounded-xl" />
                                            </div>
                                        ) : personVisits.length > 0 ? (
                                            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                                {personVisits.map((visit: any, index: number) => (
                                                    <div
                                                        key={visit.id ?? `visit-${index}`}
                                                        className="rounded-xl border border-stone-200/90 bg-[#faf7f4]/80 p-3 transition dark:border-stone-800 dark:bg-[#1f1914]"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                                                    {visit.reason?.trim()?.toLowerCase() === "other" && visit.symptoms?.trim()
                                                                        ? visit.symptoms.trim()
                                                                        : visit.reason?.trim() || "Clinic Visit"}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                                                                    {formatDisplayDate(visit.visit_date || visit.created_at)}
                                                                </p>
                                                            </div>
                                                            <Stethoscope size={16} className="shrink-0 text-[#70091f] dark:text-[#f8a598]" />
                                                        </div>
                                                        {(visit.notes || visit.symptoms || visit.diagnosis || visit.remarks || visit.treatment) && (
                                                            <p className="mt-2 text-xs leading-5 text-stone-600 dark:text-stone-300">
                                                                {visit.notes || visit.symptoms || visit.diagnosis || visit.remarks || visit.treatment}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="rounded-xl bg-[#faf7f4] px-3 py-4 text-center text-xs text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                                                No clinic visits found for this {selectedPerson._type || "student"}.
                                            </p>
                                        )}
                                    </div>

                                    {/* Medical / Health Records Section */}
                                    <div className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-800">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Medical / Health Records</p>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                                    Health details recorded with clinic visits
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-[#fcebe7] px-2.5 py-0.5 text-xs font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                {personRecords.length}
                                            </span>
                                        </div>

                                        {personDetailsLoading ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-16 w-full rounded-xl" />
                                                <Skeleton className="h-16 w-full rounded-xl" />
                                            </div>
                                        ) : personRecords.length > 0 ? (
                                            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                                {personRecords.map((record: any, index: number) => (
                                                    <div
                                                        key={record.id ?? `record-${index}`}
                                                        className="rounded-xl border border-stone-200/90 bg-[#faf7f4]/80 p-3 transition dark:border-stone-800 dark:bg-[#1f1914]"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                                                    {record.record_type || record.type || record.title || "Health Record"}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                                                                    {formatDisplayDate(record.record_date || record.date || record.created_at)}
                                                                </p>
                                                            </div>
                                                            <FileText size={16} className="shrink-0 text-[#70091f] dark:text-[#f8a598]" />
                                                        </div>
                                                        <div className="mt-2 space-y-1 text-xs text-stone-600 dark:text-stone-300">
                                                            {record.diagnosis && (
                                                                <p>
                                                                    <span className="font-semibold text-stone-800 dark:text-stone-200">Diagnosis:</span>{" "}
                                                                    {record.diagnosis}
                                                                </p>
                                                            )}
                                                            {record.notes && (
                                                                <p>
                                                                    <span className="font-semibold text-stone-800 dark:text-stone-200">Notes:</span>{" "}
                                                                    {record.notes}
                                                                </p>
                                                            )}
                                                            {record.allergies && (
                                                                <p>
                                                                    <span className="font-semibold text-stone-800 dark:text-stone-200">Allergies:</span>{" "}
                                                                    {record.allergies}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="rounded-xl bg-[#faf7f4] px-3 py-4 text-center text-xs text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                                                No medical or health records found for this {selectedPerson._type || "student"}.
                                            </p>
                                        )}
                                    </div>

                                    {/* View Profile Action Button */}
                                    <Link
                                        to={`/students?${
                                            selectedPerson._type !== "student" ? `tab=${selectedPerson._type}&` : ""
                                        }profile_type=${encodeURIComponent(
                                            selectedPerson._type || "student"
                                        )}&profile_code=${encodeURIComponent(
                                            getPersonId(selectedPerson)
                                        )}&search=${encodeURIComponent(getPersonId(selectedPerson))}`}
                                        onClick={() => {
                                            setSearchOpen(false);
                                            setSelectedPerson(null);
                                        }}
                                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#70091f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#590718] active:scale-[0.99] cursor-pointer"
                                    >
                                        <span>
                                            View {selectedPerson._type === "faculty" ? "Faculty" : selectedPerson._type === "staff" ? "Staff" : "Student"} Profile
                                        </span>
                                        <ChevronRight size={15} />
                                    </Link>
                                </div>
                            ) : (
                                <div>
                                    {/* Students */}
                                    {searchResults.students.length > 0 && (
                                        <div className="mb-2">
                                            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                Students ({searchResults.students.length})
                                            </p>
                                            {searchResults.students.map((s) => (
                                                <button
                                                    key={`search-student-${s.id || s.student_id}`}
                                                    type="button"
                                                    onClick={() => setSelectedPerson({ ...s, _type: "student" })}
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-stone-800 hover:bg-[#fcebe7]/60 dark:text-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fcebe7] text-xs font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                        {getInitials(getPersonName(s))}
                                                    </div>
                                                    <div className="min-w-0 flex-1 truncate">
                                                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                                            {getPersonName(s)}
                                                        </p>
                                                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                                            Student · {getPersonId(s)} {s.course ? `· ${s.course}` : ""} {s.year_level ? `· ${s.year_level}` : ""}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={15} className="text-stone-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Staff */}
                                    {searchResults.staff.length > 0 && (
                                        <div className="mb-2">
                                            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                Staff ({searchResults.staff.length})
                                            </p>
                                            {searchResults.staff.map((st) => (
                                                <button
                                                    key={`search-staff-${st.id || st.employee_id || st.staff_id}`}
                                                    type="button"
                                                    onClick={() => setSelectedPerson({ ...st, _type: "staff" })}
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-stone-800 hover:bg-[#fcebe7]/60 dark:text-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fcebe7] text-xs font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                        {getInitials(getPersonName(st))}
                                                    </div>
                                                    <div className="min-w-0 flex-1 truncate">
                                                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                                            {getPersonName(st)}
                                                        </p>
                                                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                                            Staff · {getPersonId(st)} {st.position ? `· ${st.position}` : ""}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={15} className="text-stone-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Faculties */}
                                    {searchResults.faculties.length > 0 && (
                                        <div className="mb-2">
                                            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                                Faculty ({searchResults.faculties.length})
                                            </p>
                                            {searchResults.faculties.map((f) => (
                                                <button
                                                    key={`search-faculty-${f.id || f.faculty_id || f.employee_id}`}
                                                    type="button"
                                                    onClick={() => setSelectedPerson({ ...f, _type: "faculty" })}
                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-stone-800 hover:bg-[#fcebe7]/60 dark:text-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fcebe7] text-xs font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                        {getInitials(getPersonName(f))}
                                                    </div>
                                                    <div className="min-w-0 flex-1 truncate">
                                                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                                                            {getPersonName(f)}
                                                        </p>
                                                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                                            Faculty · {getPersonId(f)} {f.department ? `· ${f.department}` : ""}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={15} className="text-stone-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {!isSearching &&
                                        searchResults.students.length === 0 &&
                                        searchResults.staff.length === 0 &&
                                        searchResults.faculties.length === 0 && (
                                            <div className="py-4 text-center text-sm font-medium text-stone-500 dark:text-stone-400">
                                                No records found for "{headerSearch}"
                                            </div>
                                        )}

                                    <div className="border-t border-stone-200 pt-1.5 dark:border-stone-800">
                                        <button
                                            type="button"
                                            onClick={() => handleSearchSubmit()}
                                            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-[#70091f] hover:bg-[#fcebe7]/60 dark:text-[#f8a598] dark:hover:bg-stone-800 cursor-pointer"
                                        >
                                            <span>View all results for "{headerSearch}"</span>
                                            <ArrowRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                    )}
                </div>
                )}
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
                        <div className="absolute right-0 top-12 z-50 w-[380px] sm:w-[440px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1a1511] animate-in fade-in zoom-in-95 duration-150">
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
                                                        className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
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

                            {/* Log Out Row */}
                            <div className="border-t border-[#eee7de] p-1.5 dark:border-stone-800/80">
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
