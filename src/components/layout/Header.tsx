import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Menu,
    X,
    Bell,
    Trash2,
    ChevronDown,
    Settings,
    User as UserIcon,
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
} from "lucide-react";
import tccLogo from "../../assets/tcc-logo.png";
import api from "../../services/api";
import { invalidateRecordCache } from "../../services/recordCache";
import {
    type ClinicNotification,
    clearAllClinicNotifications,
    deleteClinicNotification,
    getStoredNotifications,
    markAllNotificationsAsRead,
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
    const { isDark, toggleTheme } = useTheme();

    const bellRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [bellOpen, setBellOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
    const [notifications, setNotifications] = useState<ClinicNotification[]>(() =>
        getStoredNotifications()
    );

    const [user, setUser] = useState<any>(() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

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

    // Listen to notifications update events
    useEffect(() => {
        const handleNotifUpdate = () => {
            setNotifications(getStoredNotifications());
        };
        window.addEventListener("tcc-notifications-updated", handleNotifUpdate);
        window.addEventListener("storage", handleNotifUpdate);
        return () => {
            window.removeEventListener("tcc-notifications-updated", handleNotifUpdate);
            window.removeEventListener("storage", handleNotifUpdate);
        };
    }, []);

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

    const unreadCount = useMemo(() => {
        return notifications.filter((n) => !n.read).length;
    }, [notifications]);

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

    const handleClearAll = () => {
        clearAllClinicNotifications();
        setNotifications([]);
    };

    const handleDeleteOne = (idOrKey: string) => {
        deleteClinicNotification(idOrKey);
        setNotifications((prev) => prev.filter((n) => n.id !== idOrKey && n.key !== idOrKey));
    };

    const handleLogout = async () => {
        try {
            api.post("/logout", {}, { timeout: 3000 }).catch(() => {});
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

    const getNotificationIcon = (category?: string, type?: string) => {
        if (category === "patient") return <Users size={15} />;
        if (category === "visit") return <Stethoscope size={15} />;
        if (category === "medicine") return <Pill size={15} />;
        if (type === "add") return <CheckCircle2 size={15} />;
        if (type === "delete") return <AlertCircle size={15} />;
        return <Activity size={15} />;
    };

    return (
        <header className="sticky top-0 z-30 flex h-[68px] sm:h-[72px] w-full items-center justify-between border-b border-[#eee7de] bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur shadow-xs transition-colors duration-200 dark:border-stone-800 dark:bg-[#16120e]/95">
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
                </div>

                {/* Global Search Bar (replacing Dashboard / Page Title) */}
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
                        <div className="absolute left-0 top-full z-50 mt-2 max-h-[calc(100vh-90px)] w-[min(880px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl transition-all duration-200 dark:border-stone-800 dark:bg-[#1a1511]">
                            {selectedPerson ? (
                                <div>
                                    {/* Patient Header Row matching preview card */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPerson(null)}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-[#faf7f4] text-stone-600 transition hover:bg-[#fcebe7] hover:text-[#70091f] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                                            aria-label="Back to search results"
                                            title="Back to search results"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fcebe7] text-sm font-bold text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                            {getInitials(getPersonName(selectedPerson))}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                                                    {getPersonName(selectedPerson)}
                                                </h3>
                                                <span className="rounded-full bg-[#fcebe7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                    {selectedPerson._type || "Student"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 dark:text-stone-400">
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
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 cursor-pointer"
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
                    )}
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
                                    markAllNotificationsAsRead();
                                    setNotifications((items) =>
                                        items.map((n) => ({ ...n, read: true }))
                                    );
                                }
                                return next;
                            });
                        }}
                        aria-label="Notifications"
                        aria-expanded={bellOpen}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#766959] transition duration-200 hover:bg-[#fcebe7] hover:text-[#70091f] focus:outline-none dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-[#f8a598]"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#70091f] ring-2 ring-white dark:ring-stone-900 animate-pulse" />
                        )}
                    </button>

                    {bellOpen && (
                        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-2xl dark:border-stone-800 dark:bg-[#1f1914] animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between border-b border-[#eee7de] px-4 py-3 dark:border-stone-800">
                                <div>
                                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                        Notifications
                                    </p>
                                    <p className="text-[11px] text-[#887d70] dark:text-stone-400">
                                        {notifications.length} recent system event{notifications.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmClearNotifications(true)}
                                        className="text-xs font-semibold text-[#70091f] hover:underline dark:text-[#f8a598] cursor-pointer"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {notifications.length ? (
                                <ul className="max-h-80 overflow-y-auto divide-y divide-[#eee7de] dark:divide-stone-800/80">
                                    {notifications.map((item) => (
                                        <li
                                            key={item.id || item.key}
                                            className="group flex items-start gap-3 px-4 py-3 transition hover:bg-stone-50 dark:hover:bg-stone-800/40"
                                        >
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fcebe7] text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                                                {getNotificationIcon(item.category, item.type)}
                                            </div>

                                            <div className="min-w-0 flex-1 text-left">
                                                <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-100">
                                                    {item.title}
                                                </p>
                                                <p className="line-clamp-2 text-[11px] text-[#887d70] dark:text-stone-400">
                                                    {item.description}
                                                </p>
                                                <span className="mt-1 inline-block text-[10px] text-[#a99d8f] dark:text-stone-500">
                                                    {formatRelative(item.date)}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNotifToDelete(item);
                                                }}
                                                title="Delete notification"
                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-stone-400 opacity-60 transition hover:bg-rose-50 hover:text-rose-600 hover:opacity-100 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="px-4 py-8 text-center text-xs text-[#a99d8f] dark:text-stone-500">
                                    You're all caught up! No new notifications.
                                </p>
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
                            <div className="border-b border-[#eee7de] p-1.5 dark:border-stone-800">
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

                            {/* Navigation Links */}
                            <div className="p-1 space-y-0.5">
                                <Link
                                    to="/profile"
                                    onClick={() => setProfileMenuOpen(false)}
                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-[#fcebe7]/60 hover:text-[#70091f] dark:text-stone-300 dark:hover:bg-stone-800/60 dark:hover:text-[#f8a598]"
                                >
                                    <UserIcon size={15} className="text-[#70091f] dark:text-[#f8a598]" />
                                    <span>My Profile</span>
                                </Link>
                                <Link
                                    to="/settings"
                                    onClick={() => setProfileMenuOpen(false)}
                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-[#fcebe7]/60 hover:text-[#70091f] dark:text-stone-300 dark:hover:bg-stone-800/60 dark:hover:text-[#f8a598]"
                                >
                                    <Settings size={15} className="text-[#70091f] dark:text-[#f8a598]" />
                                    <span>Settings</span>
                                </Link>
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
        </header>
    );
}

export default Header;
