import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw, Home, Loader2, Sparkles } from "lucide-react";
import tccLogo from "../../assets/tcc-logo.png";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isBuilding: boolean;
    countdown: number;
}

export class ErrorBoundary extends Component<Props, State> {
    private timer: ReturnType<typeof setInterval> | null = null;

    public state: State = {
        hasError: false,
        error: null,
        isBuilding: true,
        countdown: 3,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);

        const msg = String(error?.message || "").toLowerCase();
        const isChunkOrBuildError =
            msg.includes("dynamically imported module") ||
            msg.includes("failed to fetch") ||
            msg.includes("importing a module script failed") ||
            msg.includes("loading chunk") ||
            msg.includes("loading css chunk") ||
            msg.includes("unexpected token") ||
            error?.name === "ChunkLoadError";

        this.setState({
            hasError: true,
            error,
            isBuilding: isChunkOrBuildError,
            countdown: 3,
        });

        // Start countdown to auto-refresh seamlessly
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.setState((prev) => {
                if (prev.countdown <= 1) {
                    if (this.timer) clearInterval(this.timer);
                    this.handleReload();
                    return { ...prev, countdown: 0 };
                }
                return { ...prev, countdown: prev.countdown - 1 };
            });
        }, 1000);
    }

    public componentWillUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private handleReload = () => {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("tcc-eb-reload-ts");
            sessionStorage.removeItem("tcc-chunk-reload-ts");
            sessionStorage.removeItem("tcc-chunk-reload-retry");
            sessionStorage.removeItem("tcc-chunk-reload-occurred");
            window.location.reload();
        }
    };

    private handleGoHome = () => {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.setState({ hasError: false, error: null });
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("tcc-eb-reload-ts");
            sessionStorage.removeItem("tcc-chunk-reload-ts");
            sessionStorage.removeItem("tcc-chunk-reload-retry");
            sessionStorage.removeItem("tcc-chunk-reload-occurred");
            window.location.href = "/dashboard";
        }
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { countdown, isBuilding, error } = this.state;

            return (
                <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
                    <style>{`
                        @keyframes tccFloat {
                            0%, 100% { transform: translateY(0px) scale(1); }
                            50% { transform: translateY(-6px) scale(1.02); }
                        }
                        @keyframes tccGlow {
                            0%, 100% { opacity: 0.35; transform: scale(0.95); }
                            50% { opacity: 0.75; transform: scale(1.08); }
                        }
                        .animate-tcc-float {
                            animation: tccFloat 3s ease-in-out infinite;
                        }
                        .animate-tcc-glow {
                            animation: tccGlow 2.5s ease-in-out infinite;
                        }
                    `}</style>
                    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-lg dark:border-stone-800 dark:bg-stone-900 animate-in fade-in zoom-in-95 duration-300">
                        {/* Animated TCC Logo Container */}
                        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
                            {/* Ambient Glow */}
                            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#70091f]/30 via-amber-500/20 to-[#70091f]/30 blur-md animate-tcc-glow" />

                            {/* Ping Ring */}
                            <div className="absolute -inset-1 rounded-full border border-[#70091f]/30 animate-ping opacity-30" />

                            {/* Logo Frame with Floating Animation */}
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200 bg-white p-2 shadow-md dark:border-stone-700 dark:bg-stone-800 animate-tcc-float">
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
                                    className="h-16 w-16 rounded-full object-contain drop-shadow"
                                />
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-3 flex justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#70091f]/10 px-3 py-1 text-xs font-bold text-[#70091f] dark:bg-[#70091f]/25 dark:text-[#f8a598]">
                                <Loader2 size={13} className="animate-spin" />
                                {isBuilding ? "System Building & Updating" : "System Synchronizing"}
                            </span>
                        </div>

                        <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
                            {isBuilding ? "System is Building / Updating" : "Loading Latest Updates"}
                        </h2>

                        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                            The system is currently applying updates or compiling new changes.
                            Synchronizing latest clinic modules...
                        </p>

                        {/* Auto-refresh progress bar */}
                        <div className="mx-auto mt-4 max-w-xs">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                                <span>Auto-refreshing module</span>
                                <span className="font-mono text-[#70091f] dark:text-[#f8a598] font-bold">
                                    {countdown > 0 ? `${countdown}s` : "Reloading..."}
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                                <div
                                    className="h-full bg-[#70091f] transition-all duration-1000"
                                    style={{ width: `${Math.max(10, ((4 - countdown) / 3) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {error?.message && (
                            <details className="mt-4 text-left text-xs text-stone-500 dark:text-stone-400">
                                <summary className="cursor-pointer hover:underline text-center">
                                    Show Technical Details
                                </summary>
                                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-stone-50 p-2 font-mono text-[11px] text-stone-700 dark:bg-stone-950 dark:text-stone-300">
                                    {error.message}
                                </pre>
                            </details>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#70091f] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition-all duration-200 hover:bg-[#5b0719] hover:shadow-lg hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70091f] cursor-pointer"
                            >
                                <RotateCcw size={16} className="transition-transform duration-500 group-hover:-rotate-180" />
                                Reload Now
                            </button>

                            <button
                                type="button"
                                onClick={this.handleGoHome}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-xs transition-all duration-200 hover:bg-stone-100 hover:scale-[1.02] active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-750 cursor-pointer"
                            >
                                <Home size={16} />
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

