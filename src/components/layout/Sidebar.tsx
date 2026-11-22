import React from "react";
import tccLogo from "../../assets/tcc-logo.png";
import api from "../../services/api";
import { invalidateRecordCache } from "../../services/recordCache";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Pill,
    BarChart3,
    Network,
    Settings,
    LogOut,
    X,
    Menu,
} from "lucide-react";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    sidebarCollapsed?: boolean;
    setSidebarCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
    onToggleSidebar?: () => void;
}

const routePrefetchers: Record<string, () => void> = {
    "/dashboard": () => { import("../../pages/Dashboard"); },
    "/students": () => { import("../../pages/StudentManagement"); },
    "/clinic-visits": () => { import("../../pages/ClinicVisits"); },
    "/medicine": () => { import("../../pages/Medicine"); },
    "/reports": () => { import("../../pages/Reports"); },
    "/organization": () => { import("../../pages/Organization"); },
    "/settings": () => { import("../../pages/Settings"); },
    "/profile": () => { import("../../pages/Profile"); },
};

function Sidebar({
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed = false,
    onToggleSidebar,
}: SidebarProps): React.JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();
    const [pendingPath, setPendingPath] = React.useState<string | null>(null);

    React.useEffect(() => {
        setPendingPath(null);
    }, [location.pathname]);

    // Prefetch all other route chunks on browser idle so clicks load instantaneously
    React.useEffect(() => {
        const timer = setTimeout(() => {
            Object.values(routePrefetchers).forEach((prefetch) => {
                try {
                    prefetch();
                } catch {
                    // ignore
                }
            });
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = async () => {
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

    const menuItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Patients",
            path: "/students",
            icon: Users,
        },
        {
            name: "Clinic Visits",
            path: "/clinic-visits",
            icon: Stethoscope,
        },
        {
            name: "Medicines",
            path: "/medicine",
            icon: Pill,
        },
        {
            name: "Reports",
            path: "/reports",
            icon: BarChart3,
        },
        {
            name: "Organization",
            path: "/organization",
            icon: Network,
        },
        {
            name: "Settings",
            path: "/settings",
            icon: Settings,
        },
    ];

    const handleNavigation = (path: string) => {
        if (path !== location.pathname) {
            setPendingPath(path);
            handlePrefetch(path);
        }
        if (setSidebarOpen) {
            setSidebarOpen(false);
        }
    };

    const handlePrefetch = (path: string) => {
        try {
            routePrefetchers[path]?.();
        } catch {
            // ignore
        }
    };

    return (
        <aside
            id="primary-navigation"
            className={`
                tcc-sidebar
                ${sidebarOpen ? "is-open" : ""}
                fixed inset-y-0 left-0 z-30 lg:z-20
                flex flex-col
                ${sidebarCollapsed ? "lg:w-[78px]" : "lg:w-[264px]"}
                w-[264px]
                bg-gradient-to-b from-[#5c0819] via-[#480613] to-[#2e030c]
                text-white
                shadow-[8px_0_30px_rgba(0,0,0,0.35)]
                transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                lg:translate-x-0
                ${
                    sidebarOpen
                        ? "translate-x-0 !z-50"
                        : "-translate-x-full"
                }
            `}
        >
            {/* Mobile close button */}
            <div className="flex justify-end px-4 pt-4 lg:hidden">
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition duration-200 hover:rotate-90 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcebe7] cursor-pointer"
                    aria-label="Close sidebar"
                >
                    <X size={22} />
                </button>
            </div>

            {/* Logo and Brand Header */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "px-2 pb-4 pt-5" : "px-5 pb-6 pt-7"}`}>
                {sidebarCollapsed ? (
                    /* Collapsed view: centered hamburger button to expand */
                    <div className="flex items-center justify-center">
                        {onToggleSidebar && (
                            <button
                                type="button"
                                onClick={onToggleSidebar}
                                className="hidden lg:flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#fcebe7] transition-all duration-200 hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                                title="Expand sidebar"
                                aria-label="Expand sidebar"
                            >
                                <Menu size={22} />
                            </button>
                        )}
                    </div>
                ) : (
                    /* Expanded view: Logo + Title + collapse hamburger button */
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex shrink-0 items-center justify-center rounded-full bg-white/10 p-1 transition-all duration-300 h-13 w-13">
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
                                    className="h-11 w-11 rounded-full object-contain transition-all duration-300 hover:rotate-6 hover:scale-105"
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-base font-bold text-[#fcebe7]">
                                    TCC Clinic
                                </p>

                                <p className="truncate text-xs font-medium text-[#fcebe7]/75">
                                    Management System
                                </p>
                            </div>
                        </div>

                        {/* Toggle Button inside sidebar on desktop */}
                        {onToggleSidebar && (
                            <button
                                type="button"
                                onClick={onToggleSidebar}
                                className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
                                title="Collapse sidebar"
                                aria-label="Collapse sidebar"
                            >
                                <Menu size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={`border-t border-white/10 ${sidebarCollapsed ? "mx-2" : "mx-5"}`} />

            {/* Navigation Menu */}
            <nav
                aria-label="Main navigation"
                className={`flex-1 overflow-y-auto py-5 transition-all duration-300 ${
                    sidebarCollapsed ? "px-2" : "px-4"
                }`}
            >
                {!sidebarCollapsed && (
                    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#fcebe7]/60">
                        Main Menu
                    </p>
                )}

                <div className="space-y-1.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        const isActive =
                            location.pathname === item.path ||
                            location.pathname.startsWith(
                                `${item.path}/`
                            );

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => handleNavigation(item.path)}
                                onMouseEnter={() => handlePrefetch(item.path)}
                                onFocus={() => handlePrefetch(item.path)}
                                aria-current={isActive ? "page" : undefined}
                                title={item.name}
                                className={`
                                    group flex h-11 items-center
                                    ${sidebarCollapsed ? "justify-center px-0 w-11 mx-auto" : "gap-3 px-3.5 w-full"}
                                    rounded-xl
                                    transition-all duration-200 ease-out
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcebe7]
                                    ${
                                        isActive
                                            ? "bg-[#70091f] text-white shadow-md ring-1 ring-white/20"
                                            : "text-[#fcebe7]/80 hover:bg-white/10 hover:text-white"
                                    }
                                `}
                            >
                                <div
                                    className={`
                                        flex h-9 w-9 shrink-0
                                        items-center justify-center
                                        rounded-lg transition-transform duration-200 group-hover:scale-105
                                        ${
                                            isActive
                                                ? "bg-[#8b1505] text-white shadow-sm"
                                                : ""
                                        }
                                    `}
                                >
                                    <Icon
                                        size={20}
                                        strokeWidth={
                                            isActive ? 2.5 : 2
                                        }
                                    />
                                </div>

                                {!sidebarCollapsed && (
                                    <span className="truncate text-[14px] font-medium">
                                        {item.name}
                                    </span>
                                )}

                                {!sidebarCollapsed && pendingPath === item.path && location.pathname !== item.path && (
                                    <span className="ml-auto flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fcebe7] opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fcebe7]" />
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Actions */}
            <div className={`pb-5 space-y-3 transition-all duration-300 ${sidebarCollapsed ? "px-2" : "px-4"}`}>
                {/* Log Out Button */}
                <button
                    type="button"
                    onClick={handleLogout}
                    title="Log Out"
                    aria-label="Log Out"
                    className={`group flex h-11 items-center rounded-xl border border-white/15 bg-white/5 text-left text-[#fcebe7]/90 transition-all duration-200 hover:border-red-400/50 hover:bg-red-500/20 hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-[0.98] cursor-pointer ${
                        sidebarCollapsed ? "w-11 mx-auto justify-center px-0" : "w-full gap-3 px-3.5"
                    }`}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-900/40 text-red-300 transition-all duration-200 group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white">
                        <LogOut size={16} strokeWidth={2.2} />
                    </div>

                    {!sidebarCollapsed && (
                        <span className="truncate text-sm font-semibold tracking-tight">
                            Log Out
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
