import React from "react";

export interface ReasonBadgeStyle {
    bg: string;
    text: string;
    border: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
    hex: string;
}

/**
 * Centralized color mapping for consultation reasons.
 * Ensures the exact same badge color is used consistently across
 * tables, dashboards, monthly reports, and clinic visit details.
 */
export const REASON_COLOR_MAP: Record<string, ReasonBadgeStyle> = {
    fever: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        darkBg: "dark:bg-red-950/50",
        darkText: "dark:text-red-300",
        darkBorder: "dark:border-red-800/60",
        hex: "#ef4444", // Red for fever / acute thermal
    },
    nosebleed: {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        darkBg: "dark:bg-rose-950/50",
        darkText: "dark:text-rose-300",
        darkBorder: "dark:border-rose-800/60",
        hex: "#e11d48", // Crimson rose for epistaxis / bleeding
    },
    headache: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        darkBg: "dark:bg-amber-950/50",
        darkText: "dark:text-amber-300",
        darkBorder: "dark:border-amber-800/60",
        hex: "#f59e0b", // Amber for cephalea / headache
    },
    dizziness: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        darkBg: "dark:bg-purple-950/50",
        darkText: "dark:text-purple-300",
        darkBorder: "dark:border-purple-800/60",
        hex: "#8b5cf6", // Purple / violet for vertigo / dizziness
    },
    stomach: {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        darkBg: "dark:bg-orange-950/50",
        darkText: "dark:text-orange-300",
        darkBorder: "dark:border-orange-800/60",
        hex: "#ea580c", // Orange for abdominal / gastrointestinal
    },
    cough: {
        bg: "bg-sky-50",
        text: "text-sky-700",
        border: "border-sky-200",
        darkBg: "dark:bg-sky-950/50",
        darkText: "dark:text-sky-300",
        darkBorder: "dark:border-sky-800/60",
        hex: "#0284c7", // Sky blue for respiratory / cough / cold
    },
    injury: {
        bg: "bg-rose-100",
        text: "text-rose-800",
        border: "border-rose-300",
        darkBg: "dark:bg-rose-950/60",
        darkText: "dark:text-rose-200",
        darkBorder: "dark:border-rose-800",
        hex: "#b91c1c", // Crimson red for trauma / wound
    },
    bodypain: {
        bg: "bg-fuchsia-50",
        text: "text-fuchsia-700",
        border: "border-fuchsia-200",
        darkBg: "dark:bg-fuchsia-950/50",
        darkText: "dark:text-fuchsia-300",
        darkBorder: "dark:border-fuchsia-800/60",
        hex: "#c026d3",
    },
    checkup: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        darkBg: "dark:bg-emerald-950/50",
        darkText: "dark:text-emerald-300",
        darkBorder: "dark:border-emerald-800/60",
        hex: "#10b981", // Emerald green for healthy / routine checkup
    },
    firstaid: {
        bg: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-200",
        darkBg: "dark:bg-teal-950/50",
        darkText: "dark:text-teal-300",
        darkBorder: "dark:border-teal-800/60",
        hex: "#0d9488", // Teal for nursing first aid
    },
    allergy: {
        bg: "bg-violet-50",
        text: "text-violet-700",
        border: "border-violet-200",
        darkBg: "dark:bg-violet-950/50",
        darkText: "dark:text-violet-300",
        darkBorder: "dark:border-violet-800/60",
        hex: "#7c3aed", // Violet for allergic reaction
    },
    medication: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        darkBg: "dark:bg-blue-950/50",
        darkText: "dark:text-blue-300",
        darkBorder: "dark:border-blue-800/60",
        hex: "#2563eb",
    },
    dysmenorrhea: {
        bg: "bg-pink-50",
        text: "text-pink-700",
        border: "border-pink-200",
        darkBg: "dark:bg-pink-950/50",
        darkText: "dark:text-pink-300",
        darkBorder: "dark:border-pink-800/60",
        hex: "#db2777",
    },
    asthma: {
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        border: "border-cyan-200",
        darkBg: "dark:bg-cyan-950/50",
        darkText: "dark:text-cyan-300",
        darkBorder: "dark:border-cyan-800/60",
        hex: "#0891b2",
    },
    dental: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-300",
        darkBg: "dark:bg-slate-800",
        darkText: "dark:text-slate-300",
        darkBorder: "dark:border-slate-700",
        hex: "#475569",
    },
    other: {
        bg: "bg-[#fdf5f3]",
        text: "text-[#70091f]",
        border: "border-[#ebdcd5]",
        darkBg: "dark:bg-[#70091f]/25",
        darkText: "dark:text-[#f8a598]",
        darkBorder: "dark:border-[#521320]",
        hex: "#70091f",
    },
};

/**
 * Resolves the consistent style for a consultation reason string
 */
export function getReasonBadgeStyle(reason: string | null | undefined): ReasonBadgeStyle {
    if (!reason) {
        return REASON_COLOR_MAP.other;
    }

    const lower = reason.toLowerCase().trim();

    if (lower.includes("fever") || lower.includes("chills")) {
        return REASON_COLOR_MAP.fever;
    }
    if (lower.includes("nosebleed") || lower.includes("epistaxis") || lower.includes("bleed")) {
        return REASON_COLOR_MAP.nosebleed;
    }
    if (lower.includes("allergy") || lower.includes("allergic")) {
        return REASON_COLOR_MAP.allergy;
    }
    if (lower.includes("headache") || lower.includes("migraine")) {
        return REASON_COLOR_MAP.headache;
    }
    if (lower.includes("dizziness") || lower.includes("lightheaded")) {
        return REASON_COLOR_MAP.dizziness;
    }
    if (lower.includes("stomach") || lower.includes("abdominal") || lower.includes("hyperacidity") || lower.includes("nausea")) {
        return REASON_COLOR_MAP.stomach;
    }
    if (lower.includes("cough") || lower.includes("cold") || lower.includes("flu") || lower.includes("sore throat")) {
        return REASON_COLOR_MAP.cough;
    }
    if (lower.includes("injury") || lower.includes("wound") || lower.includes("cut") || lower.includes("sprain") || lower.includes("laceration") || lower.includes("abrasion")) {
        return REASON_COLOR_MAP.injury;
    }
    if (lower.includes("body pain") || lower.includes("muscle") || lower.includes("back pain")) {
        return REASON_COLOR_MAP.bodypain;
    }
    if (lower.includes("check-up") || lower.includes("consultation") || lower.includes("medical concern")) {
        return REASON_COLOR_MAP.checkup;
    }
    if (lower.includes("first aid")) {
        return REASON_COLOR_MAP.firstaid;
    }
    if (lower.includes("medication") || lower.includes("medicine")) {
        return REASON_COLOR_MAP.medication;
    }
    if (lower.includes("dysmenorrhea") || lower.includes("menstrual") || lower.includes("cramps")) {
        return REASON_COLOR_MAP.dysmenorrhea;
    }
    if (lower.includes("asthma") || lower.includes("breathing") || lower.includes("hyperventilation")) {
        return REASON_COLOR_MAP.asthma;
    }
    if (lower.includes("tooth") || lower.includes("dental")) {
        return REASON_COLOR_MAP.dental;
    }

    return REASON_COLOR_MAP.other;
}

/**
 * Returns the hex color code for chart visualization
 */
export function getReasonColorHex(reason: string): string {
    return getReasonBadgeStyle(reason).hex;
}

/**
 * Centralized React component to render consultation reason badge
 */
export function ReasonBadge({
    reason,
    symptoms,
    className = "",
}: {
    reason: string | null | undefined;
    symptoms?: string | null;
    className?: string;
}) {
    if (!reason || reason === "-") {
        return <span className="text-xs text-stone-400 italic">N/A</span>;
    }

    const style = getReasonBadgeStyle(reason);
    const lower = reason.toLowerCase().trim();
    const displayText = lower === "other" && symptoms ? symptoms : reason.trim();

    const colorClasses = `${style.bg} ${style.text} ${style.border} ${style.darkBg} ${style.darkText} ${style.darkBorder}`;

    return (
        <div className={`flex flex-col items-start gap-0.5 ${className}`}>
            <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs ${colorClasses}`}
            >
                {displayText}
            </span>
            {lower !== "other" && symptoms && symptoms.trim() !== "" && symptoms.trim() !== reason.trim() && (
                <span
                    className="max-w-[190px] truncate text-[10px] text-stone-500 pl-1 dark:text-stone-400"
                    title={symptoms}
                >
                    {symptoms}
                </span>
            )}
        </div>
    );
}

export function renderReasonBadge(reason: string | null | undefined, symptoms?: string | null) {
    return <ReasonBadge reason={reason} symptoms={symptoms} />;
}
