import React, { useEffect, useState, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PageLoadingContent } from "./PageLoading";
import ErrorBoundary from "./ErrorBoundary";
import { PwaInstallPrompt } from "../common/PwaInstallPrompt";

const DashboardAssistant = React.lazy(() =>
    import("../dashboard/DashboardAssistant").then((m) => ({
        default: m.DashboardAssistant,
    }))
);

interface MainLayoutProps {
    children?: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps): React.JSX.Element {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem("tcc-sidebar-collapsed") === "true";
        } catch {
            return false;
        }
    });
    const location = useLocation();
    const isReports = location.pathname.toLowerCase().startsWith("/reports");
    const isOrganization =
        location.pathname.toLowerCase().startsWith("/organization") ||
        location.pathname.toLowerCase().startsWith("/staff");
    const hideAssistant = isReports || isOrganization;
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);

    const handleToggleSidebar = () => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) {
            setSidebarCollapsed((prev) => {
                const next = !prev;
                try {
                    localStorage.setItem("tcc-sidebar-collapsed", String(next));
                } catch {
                    // ignore
                }
                return next;
            });
        } else {
            setSidebarOpen((prev) => !prev);
        }
    };

    useEffect(() => {
        setIsPageTransitioning(true);
        const timer = setTimeout(() => {
            setIsPageTransitioning(false);
        }, 120);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        const isDark = localStorage.getItem("tcc-theme") === "dark";
        document.documentElement.classList.toggle("tcc-dark", isDark);
        document.documentElement.classList.toggle("dark", isDark);
    }, []);

    useEffect(() => {
        if (!sidebarOpen) return undefined;

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSidebarOpen(false);
            }
        };

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen bg-[#fcf8f8] dark:bg-[#15120f] transition-colors duration-200">
            {/* Sidebar Navigation */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                onToggleSidebar={handleToggleSidebar}
            />

            {/* Mobile Backdrop Overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setSidebarOpen(false)}
                    className="tcc-sidebar-overlay fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
                />
            )}

            {/* Main Column with Global Top Header */}
            <div
                className={`flex min-h-screen flex-col transition-[margin,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    sidebarCollapsed
                        ? "lg:ml-[78px] lg:w-[calc(100%-78px)]"
                        : "lg:ml-[264px] lg:w-[calc(100%-264px)]"
                }`}
            >
                {/* Global App Header for ALL pages */}
                <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={handleToggleSidebar}
                />

                {/* Top Route Transition Loading Bar */}
                {isPageTransitioning && (
                    <div className="sticky top-[68px] sm:top-[72px] left-0 right-0 z-50 h-0.5 overflow-hidden bg-stone-200/40 dark:bg-stone-800/40 pointer-events-none">
                        <div className="h-full w-full bg-gradient-to-r from-[#8a6f50] via-[#70091f] to-[#8a6f50] animate-pulse" />
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 w-full max-w-full pb-28 sm:pb-32">
                    <ErrorBoundary>
                        <Suspense fallback={<PageLoadingContent />}>
                            {children || <Outlet />}
                        </Suspense>
                    </ErrorBoundary>
                </main>
            </div>

            {/* AI Chatbot Assistant for internal portal tabs (hidden on reports and organization pages) */}
            {!hideAssistant && (
                <Suspense fallback={null}>
                    <DashboardAssistant />
                </Suspense>
            )}

            {/* Mobile PWA Install / Download prompt */}
            <PwaInstallPrompt />
        </div>
    );
}

export default MainLayout;
