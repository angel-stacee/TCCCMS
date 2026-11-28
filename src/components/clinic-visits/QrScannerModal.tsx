import React, { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, QrCode, Search, X } from "lucide-react";
import api from "../../services/api";

export interface ResolvedQrPatient {
    patient_type: "student" | "faculty" | "staff";
    qr_token: string;
    patient: {
        id: number;
        identifier: string;
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        full_name: string;
        department?: string | null;
        sex?: string | null;
        visit_count: number;
    };
}

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPatientResolved: (resolved: ResolvedQrPatient) => void;
}

export default function QrScannerModal({
    isOpen,
    onClose,
    onPatientResolved,
}: QrScannerModalProps): React.JSX.Element | null {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);

    const [manualCode, setManualCode] = useState("");
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [lookupError, setLookupError] = useState("");
    const [resolving, setResolving] = useState(false);

    const stopCamera = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const resolveCode = useCallback(
        async (rawCode: string) => {
            const code = rawCode.trim();
            if (!code || resolving) return;
            setResolving(true);
            setLookupError("");
            try {
                const res = await api.get<ResolvedQrPatient & { found: boolean }>("/patients/qr-resolve", {
                    params: { code },
                });
                if (res.data?.found && res.data?.patient) {
                    stopCamera();
                    onPatientResolved(res.data);
                } else {
                    setLookupError("No registered patient matched this QR code.");
                }
            } catch (err: any) {
                setLookupError(err?.response?.data?.message || "Invalid or unrecognized QR code.");
            } finally {
                setResolving(false);
            }
        },
        [onPatientResolved, resolving, stopCamera]
    );

    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setManualCode("");
            setCameraError("");
            setLookupError("");
        }
        return () => stopCamera();
    }, [isOpen, stopCamera]);

    const startCamera = async () => {
        setCameraError("");
        setLookupError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            streamRef.current = stream;
            setCameraActive(true);

            // Wait a tick for <video> to mount if needed, then attach stream
            requestAnimationFrame(async () => {
                if (videoRef.current && streamRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    try {
                        await videoRef.current.play();
                    } catch {
                        // Ignore autoplay interruption
                    }
                }
            });

            const scanFrame = () => {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "attemptBoth",
                        });
                        if (decoded?.data) {
                            resolveCode(decoded.data);
                            return;
                        }
                    }
                }
                rafRef.current = requestAnimationFrame(scanFrame);
            };
            rafRef.current = requestAnimationFrame(scanFrame);
        } catch {
            setCameraError("Camera access is unavailable or was denied. You can paste or scan the QR token below.");
            setCameraActive(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-xl dark:border-[#382f25] dark:bg-[#251f19]">
                <div className="flex items-center justify-between bg-[#70091f] px-5 py-3.5 text-white">
                    <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        <h3 className="text-sm font-bold">Scan Patient QR Code</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer"
                        aria-label="Close QR scanner"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div className="overflow-hidden rounded-xl border border-[#e8dfd4] bg-stone-950 text-center dark:border-[#382f25]">
                        {cameraActive ? (
                            <div className="relative">
                                <video ref={videoRef} className="h-56 w-full object-cover" muted playsInline />
                                <canvas ref={canvasRef} className="hidden" />
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="h-36 w-36 rounded-2xl border-2 border-[#d4a017]/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-44 flex-col items-center justify-center gap-2.5 p-4 text-stone-300">
                                <Camera className="h-8 w-8 text-[#d4a017]" />
                                <p className="text-xs text-stone-400">
                                    Use your device camera or a handheld QR scanner to identify an existing patient.
                                </p>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#70091f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b1505] cursor-pointer"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                    Start Camera Scanner
                                </button>
                            </div>
                        )}
                    </div>

                    {cameraError && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                            {cameraError}
                        </p>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            resolveCode(manualCode);
                        }}
                        className="space-y-2"
                    >
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                            Or enter / scan QR token manually
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="e.g. TCMS-QR-..."
                                className="w-full rounded-xl border border-[#e8dfd4] bg-stone-50 px-3 py-2 text-xs dark:border-[#382f25] dark:bg-[#1b1612] dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={resolving || !manualCode.trim()}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#70091f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b1505] disabled:opacity-50 cursor-pointer"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {resolving ? "Checking..." : "Retrieve"}
                            </button>
                        </div>
                    </form>

                    {lookupError && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                            {lookupError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
