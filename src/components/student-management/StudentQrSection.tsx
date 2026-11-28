import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Eye, Mail, QrCode, ShieldCheck, X } from "lucide-react";
import api from "../../services/api";

export type QrPatientType = "student" | "faculty" | "staff";

interface QrPatientRecord {
    id: number;
    student_id?: string;
    employee_id?: string;
    staff_id?: string;
    qr_token?: string | null;
    first_name?: string;
    middle_name?: string | null;
    last_name?: string;
    course?: string;
    year_level?: string;
    position?: string;
    department?: string;
}

interface StudentQrSectionProps {
    patientType?: QrPatientType;
    patient?: QrPatientRecord;
    student?: QrPatientRecord;
    onQrUpdated?: (newToken: string) => void;
    onNotify?: (message: string) => void;
}

export default function StudentQrSection({
    patientType = "student",
    patient,
    student,
    onQrUpdated,
    onNotify,
}: StudentQrSectionProps): React.JSX.Element {
    const record = patient ?? student!;
    const endpointBase =
        patientType === "faculty"
            ? "/faculties"
            : patientType === "staff"
              ? "/staff"
              : "/students";
    const idLabel =
        patientType === "faculty"
            ? "Faculty ID"
            : patientType === "staff"
              ? "Staff ID"
              : "Student ID";
    const roleLabel =
        patientType === "faculty"
            ? "Faculty"
            : patientType === "staff"
              ? "Staff"
              : "Student";
    const identifier =
        patientType === "faculty"
            ? record.employee_id || ""
            : patientType === "staff"
              ? record.staff_id || record.employee_id || ""
              : record.student_id || "";
    const subMeta =
        patientType === "student"
            ? `${record.course || ""} ${record.year_level ? `• ${record.year_level}` : ""}`.trim()
            : `${record.position || ""} ${record.department ? `• ${record.department}` : ""}`.trim();

    const [qrToken, setQrToken] = useState<string>(record.qr_token || "");
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showConfirmRegen, setShowConfirmRegen] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [regenerating, setRegenerating] = useState(false);
    const [error, setError] = useState("");

    const fullName = [record.first_name, record.middle_name, record.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

    useEffect(() => {
        setQrToken(record.qr_token || "");
    }, [record.id, record.qr_token, patientType]);

    useEffect(() => {
        // Ensure existing patients without a qr_token receive one safely via show endpoint
        if (!record.qr_token && record.id) {
            api.get(`${endpointBase}/${record.id}`)
                .then((res) => {
                    const token = res.data?.qr_token;
                    if (token) {
                        setQrToken(token);
                        onQrUpdated?.(token);
                    }
                })
                .catch(() => {});
        }
    }, [record.id, record.qr_token, endpointBase, onQrUpdated]);

    useEffect(() => {
        if (!qrToken) {
            setQrDataUrl("");
            return;
        }
        let cancelled = false;
        QRCode.toDataURL(qrToken, {
            width: 320,
            margin: 2,
            color: {
                dark: "#70091f",
                light: "#ffffff",
            },
            errorCorrectionLevel: "M",
        })
            .then((url) => {
                if (!cancelled) setQrDataUrl(url);
            })
            .catch(() => {
                if (!cancelled) setQrDataUrl("");
            });
        return () => {
            cancelled = true;
        };
    }, [qrToken]);

    const handleDownloadPng = async () => {
        if (!qrToken) return;
        try {
            const qrImgUrl = await QRCode.toDataURL(qrToken, {
                width: 480,
                margin: 2,
                color: { dark: "#70091f", light: "#ffffff" },
                errorCorrectionLevel: "M",
            });

            const canvas = document.createElement("canvas");
            canvas.width = 560;
            canvas.height = 670;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Burgundy header bar
            ctx.fillStyle = "#70091f";
            ctx.fillRect(0, 0, canvas.width, 76);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("TCC CLINIC MANAGEMENT SYSTEM", canvas.width / 2, 36);
            ctx.font = "13px system-ui, -apple-system, sans-serif";
            ctx.fillStyle = "#f9e3e7";
            ctx.fillText("Tagoloan Community College — Patient QR Identification", canvas.width / 2, 58);

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 80, 100, 400, 400);

                ctx.fillStyle = "#1e1b18";
                ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
                ctx.fillText(fullName || `Registered ${roleLabel}`, canvas.width / 2, 540);

                ctx.fillStyle = "#57534e";
                ctx.font = "16px system-ui, -apple-system, sans-serif";
                ctx.fillText(`${idLabel}: ${identifier}`, canvas.width / 2, 570);
                ctx.fillText(subMeta, canvas.width / 2, 596);

                ctx.fillStyle = "#78716c";
                ctx.font = "12px monospace";
                ctx.fillText(`Token: ${qrToken}`, canvas.width / 2, 632);

                const link = document.createElement("a");
                link.download = `TCC-QR-${identifier || record.id}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            };
            img.src = qrImgUrl;
        } catch {
            setError("Unable to generate PNG download.");
        }
    };

    const handlePrintQr = () => {
        if (!qrDataUrl) return;
        const win = window.open("", "_blank", "width=460,height=600");
        if (!win) return;
        const safeName = (fullName || `Registered ${roleLabel}`).replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeId = String(identifier || "").replace(/</g, "&lt;");
        const safeCourse = subMeta;
        win.document.write(`
            <!doctype html>
            <html>
            <head>
                <title>TCC Clinic QR — ${safeId}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; padding: 24px; background: #fff; color: #1c1917; }
                    .card { border: 2px solid #70091f; border-radius: 14px; width: 320px; overflow: hidden; text-align: center; }
                    .hdr { background: #70091f; color: #fff; padding: 14px 12px; }
                    .hdr h2 { margin: 0; font-size: 15px; letter-spacing: 0.4px; }
                    .hdr p { margin: 3px 0 0; font-size: 11px; opacity: 0.9; }
                    .body { padding: 18px 16px; }
                    .body img { width: 220px; height: 220px; display: block; margin: 0 auto 12px; }
                    .name { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
                    .meta { font-size: 12px; color: #57534e; margin: 0 0 8px; }
                    .tok { font-family: monospace; font-size: 10px; color: #78716c; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="hdr">
                        <h2>TCC CLINIC IDENTIFICATION</h2>
                        <p>Tagoloan Community College Health Services</p>
                    </div>
                    <div class="body">
                        <img src="${qrDataUrl}" alt="Student QR Code" />
                        <p class="name">${safeName}</p>
                        <p class="meta">ID: ${safeId}${safeCourse ? ` • ${safeCourse}` : ""}</p>
                        <p class="tok">${qrToken}</p>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); };</script>
            </body>
            </html>
        `);
        win.document.close();
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!qrToken || !recipientEmail.trim()) return;
        setSendingEmail(true);
        setEmailError("");
        try {
            const qrImgUrl = await QRCode.toDataURL(qrToken, {
                width: 480,
                margin: 2,
                color: { dark: "#70091f", light: "#ffffff" },
                errorCorrectionLevel: "M",
            });
            await api.post("/patients/qr-send-email", {
                patient_type: patientType,
                patient_id: record.id,
                email: recipientEmail.trim(),
                qr_image: qrImgUrl,
            });
            setShowEmailModal(false);
            setRecipientEmail("");
            onNotify?.(`QR code sent to ${recipientEmail.trim()}.`);
        } catch (err: any) {
            setEmailError(err?.response?.data?.message || "Failed to send QR code email.");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleConfirmRegenerate = async () => {
        setRegenerating(true);
        setError("");
        try {
            const res = await api.post(`${endpointBase}/${record.id}/qr-regenerate`);
            const nextToken = res.data?.qr_token;
            if (nextToken) {
                setQrToken(nextToken);
                onQrUpdated?.(nextToken);
                onNotify?.("QR code regenerated. Previous QR codes are now invalid.");
            }
            setShowConfirmRegen(false);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to regenerate QR code.");
        } finally {
            setRegenerating(false);
        }
    };

    return (
        <div className="mb-5 rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] p-4 dark:border-[#382f25] dark:bg-[#1e1914]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-[#70091f]/25 bg-white p-1.5 shadow-xs">
                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt={`QR Code for ${fullName || identifier}`}
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <QrCode className="h-8 w-8 text-[#70091f]/50" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <QrCode className="h-4 w-4 text-[#70091f]" />
                            <h4 className="text-sm font-bold text-stone-800 dark:text-[#f4ecdf]">
                                Clinic QR Code Identification
                            </h4>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            Opaque secure token (contains zero personal or medical data)
                        </p>
                        {qrToken && (
                            <p className="mt-1 font-mono text-[11px] text-stone-500 dark:text-stone-400">
                                {qrToken}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        disabled={!qrDataUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#70091f] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#8b1505] disabled:opacity-50 cursor-pointer"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        View QR Code
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPng}
                        disabled={!qrDataUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8dfd4] bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 dark:border-[#382f25] dark:bg-[#251f19] dark:text-stone-200 cursor-pointer"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download PNG
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEmailError("");
                            setShowEmailModal(true);
                        }}
                        disabled={!qrDataUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8dfd4] bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 dark:border-[#382f25] dark:bg-[#251f19] dark:text-stone-200 cursor-pointer"
                    >
                        <Mail className="h-3.5 w-3.5" />
                        Send to Gmail
                    </button>
                </div>
            </div>

            {error && (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* View QR Code Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white shadow-xl dark:border-[#382f25] dark:bg-[#251f19]">
                        <div className="flex items-center justify-between bg-[#70091f] px-5 py-3.5 text-white">
                            <div className="flex items-center gap-2">
                                <QrCode className="h-4 w-4" />
                                <h3 className="text-sm font-bold">{roleLabel} Clinic QR Code</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer"
                                aria-label="Close QR preview"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="mx-auto inline-block rounded-2xl border-2 border-[#70091f]/20 bg-white p-3 shadow-xs">
                                <img src={qrDataUrl} alt={`${roleLabel} QR Code`} className="h-56 w-56 object-contain" />
                            </div>
                            <p className="mt-3 text-base font-bold text-stone-900 dark:text-[#f4ecdf]">{fullName}</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                ID: {identifier}{subMeta ? ` • ${subMeta}` : ""}
                            </p>
                            <p className="mt-2 rounded-lg bg-stone-100 px-2.5 py-1 font-mono text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                {qrToken}
                            </p>
                            <div className="mt-4 flex justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadPng}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#70091f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b1505] cursor-pointer"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download PNG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send to Gmail Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <form
                        onSubmit={handleSendEmail}
                        className="w-full max-w-md rounded-2xl border border-[#e8dfd4] bg-white p-6 shadow-xl dark:border-[#382f25] dark:bg-[#251f19]"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-stone-900 dark:text-[#f4ecdf]">
                                Send QR Code to Gmail
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowEmailModal(false)}
                                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300">
                            Enter the recipient's email address to send <strong>{fullName}</strong>'s clinic QR code as a PNG attachment.
                        </p>
                        <div className="mt-4">
                            <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-stone-200">
                                Recipient Email
                            </label>
                            <input
                                type="email"
                                required
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="example@gmail.com"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-white px-3.5 py-2 text-sm text-stone-900 outline-none focus:border-[#70091f] dark:border-[#382f25] dark:bg-[#1e1914] dark:text-[#f4ecdf]"
                            />
                        </div>
                        {emailError && (
                            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{emailError}</p>
                        )}
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowEmailModal(false)}
                                disabled={sendingEmail}
                                className="rounded-xl border border-[#e8dfd4] px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-[#382f25] dark:text-stone-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={sendingEmail || !recipientEmail.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#70091f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b1505] disabled:opacity-60 cursor-pointer"
                            >
                                <Mail className="h-3.5 w-3.5" />
                                {sendingEmail ? "Sending..." : "Send QR Code"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Regenerate Confirmation Modal */}
            {showConfirmRegen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-[#e8dfd4] bg-white p-6 shadow-xl dark:border-[#382f25] dark:bg-[#251f19]">
                        <h3 className="text-base font-bold text-stone-900 dark:text-[#f4ecdf]">
                            Regenerate {roleLabel} QR Code?
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                            This will generate a new unique QR token for <strong>{fullName}</strong>. Any previously downloaded or printed QR code for this {roleLabel.toLowerCase()} will immediately stop working.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmRegen(false)}
                                disabled={regenerating}
                                className="rounded-xl border border-[#e8dfd4] px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-[#382f25] dark:text-stone-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRegenerate}
                                disabled={regenerating}
                                className="rounded-xl bg-[#70091f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b1505] disabled:opacity-60 cursor-pointer"
                            >
                                {regenerating ? "Regenerating..." : "Yes, Regenerate QR"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
