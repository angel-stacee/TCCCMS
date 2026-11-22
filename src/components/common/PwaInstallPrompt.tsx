import React, { useEffect, useState } from "react";
import { Download, Smartphone, X, Share2, PlusSquare, Check } from "lucide-react";
import tccLogo from "../../assets/pwa-icon-512.png";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt(): React.JSX.Element | null {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check if already running as installed standalone app
        const isAppStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;

        if (isAppStandalone) {
            setIsStandalone(true);
            return;
        }

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
        setIsIos(isAppleMobile);

        // Check if user dismissed banner recently
        const dismissedUntil = localStorage.getItem("tcc-pwa-banner-dismissed");
        const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

        // Listen for Chromium beforeinstallprompt event (Android / Chrome / Edge)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            if (!isDismissed) {
                setShowBanner(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        // If iOS and not dismissed, show banner after brief delay
        if (isAppleMobile && !isDismissed) {
            const timer = setTimeout(() => {
                setShowBanner(true);
            }, 3000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
            };
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        } else if (isIos) {
            setShowIosGuide(true);
        } else {
            // General fallback
            alert("To install, tap your browser's menu (⋮) and select 'Install app' or 'Add to Home screen'.");
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        // Dismiss for 7 days
        localStorage.setItem("tcc-pwa-banner-dismissed", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    };

    if (isStandalone) return null;

    return (
        <>
            {/* Mobile Bottom Install Banner */}
            {showBanner && (
                <div className="fixed bottom-4 inset-x-3 z-50 sm:hidden animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#e8dfd4] bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-stone-800 dark:bg-[#1f1914]/95">
                        <img
                            src={tccLogo}
                            alt="TCC Logo"
                            className="h-10 w-10 shrink-0 rounded-xl object-contain border border-stone-200 p-0.5 dark:border-stone-700 bg-white"
                        />
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                Download TCC Clinic App
                            </p>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                                Live database access on your phone
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleInstallClick}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#70091f] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#8a132c] active:scale-95 cursor-pointer"
                            >
                                <Download size={13} strokeWidth={2.5} />
                                <span>Install</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDismiss}
                                aria-label="Close"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS Safari Installation Guide Modal */}
            {showIosGuide && (
                <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1f1914] border border-stone-200 dark:border-stone-800 animate-in slide-in-from-bottom duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                            <div className="flex items-center gap-2.5">
                                <img src={tccLogo} alt="TCC" className="h-8 w-8 rounded-lg" />
                                <div>
                                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                        Install on iPhone
                                    </h3>
                                    <p className="text-[11px] text-stone-500">TCC Clinic Management System</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowIosGuide(false)}
                                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3.5 text-xs text-stone-700 dark:text-stone-300">
                            <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/50">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#70091f]/10 text-[#70091f] font-bold">
                                    1
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                        Tap the Share button
                                        <Share2 size={13} className="text-blue-500" />
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        Located at the bottom of Safari's screen.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/50">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#70091f]/10 text-[#70091f] font-bold">
                                    2
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                        Tap "Add to Home Screen"
                                        <PlusSquare size={13} className="text-stone-700 dark:text-stone-300" />
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        Scroll down in the share sheet and tap Add.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <Check size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                                <p className="text-[11px] leading-relaxed">
                                    Done! TCC Clinic will appear on your home screen and open directly into the live clinic database.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowIosGuide(false)}
                            className="mt-5 w-full rounded-xl bg-[#70091f] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#8a132c]"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// Mobile Profile Dropdown Install Button
export function PwaDropdownItem(): React.JSX.Element | null {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const isAppStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;

        if (isAppStandalone) {
            setIsStandalone(true);
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIos(/iphone|ipad|ipod/.test(userAgent));

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);
        return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }, []);

    if (isStandalone) return null;

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            setDeferredPrompt(null);
        } else if (isIos) {
            setShowIosGuide(true);
        } else {
            alert("To install on your phone, open your browser menu (⋮) and tap 'Install app' or 'Add to Home screen'.");
        }
    };

    return (
        <>
            <div className="border-t border-[#eee7de] p-1.5 dark:border-stone-800/80 sm:hidden">
                <button
                    type="button"
                    onClick={handleInstall}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-stone-800 transition hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800/50 cursor-pointer"
                >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#70091f]/10 text-[#70091f] dark:bg-[#70091f]/30 dark:text-[#f8a598]">
                        <Smartphone size={15} strokeWidth={2.2} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                            Download Phone App
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                            Install on your cellphone
                        </p>
                    </div>
                </button>
            </div>

            {showIosGuide && (
                <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1f1914] border border-stone-200 dark:border-stone-800 animate-in slide-in-from-bottom duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                            <div className="flex items-center gap-2.5">
                                <img src={tccLogo} alt="TCC" className="h-8 w-8 rounded-lg" />
                                <div>
                                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                        Install on iPhone
                                    </h3>
                                    <p className="text-[11px] text-stone-500">TCC Clinic Management System</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowIosGuide(false)}
                                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3.5 text-xs text-stone-700 dark:text-stone-300">
                            <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/50">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#70091f]/10 text-[#70091f] font-bold">
                                    1
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                        Tap the Share button
                                        <Share2 size={13} className="text-blue-500" />
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        Located at the bottom of Safari's screen.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/50">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#70091f]/10 text-[#70091f] font-bold">
                                    2
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                        Tap "Add to Home Screen"
                                        <PlusSquare size={13} className="text-stone-700 dark:text-stone-300" />
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        Scroll down in the share sheet and tap Add.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowIosGuide(false)}
                            className="mt-5 w-full rounded-xl bg-[#70091f] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#8a132c]"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
