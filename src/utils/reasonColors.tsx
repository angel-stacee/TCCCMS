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
        bg: "bg-red-100/90",
        text: "text-red-950",
        border: "border-red-300",
        darkBg: "dark:bg-red-950/70",
        darkText: "dark:text-red-200",
        darkBorder: "dark:border-red-700/70",
        hex: "#8b1505", // Deep Crimson Burgundy
    },
    nosebleed: {
        bg: "bg-rose-100/90",
        text: "text-rose-950",
        border: "border-rose-300",
        darkBg: "dark:bg-rose-950/70",
        darkText: "dark:text-rose-200",
        darkBorder: "dark:border-rose-700/70",
        hex: "#a82236", // Crimson Wine
    },
    headache: {
        bg: "bg-amber-100/90",
        text: "text-amber-950",
        border: "border-amber-300",
        darkBg: "dark:bg-amber-950/70",
        darkText: "dark:text-amber-200",
        darkBorder: "dark:border-amber-700/70",
        hex: "#70091f", // Institutional Burgundy
    },
    dizziness: {
        bg: "bg-purple-100/90",
        text: "text-purple-950",
        border: "border-purple-300",
        darkBg: "dark:bg-purple-950/70",
        darkText: "dark:text-purple-200",
        darkBorder: "dark:border-purple-700/70",
        hex: "#b84255", // Warm Berry Burgundy
    },
    stomach: {
        bg: "bg-orange-100/90",
        text: "text-orange-950",
        border: "border-orange-300",
        darkBg: "dark:bg-orange-950/70",
        darkText: "dark:text-orange-200",
        darkBorder: "dark:border-orange-700/70",
        hex: "#932738", // Rich Wine
    },
    fatigue: {
        bg: "bg-indigo-100/90",
        text: "text-indigo-950",
        border: "border-indigo-300",
        darkBg: "dark:bg-indigo-950/70",
        darkText: "dark:text-indigo-200",
        darkBorder: "dark:border-indigo-700/70",
        hex: "#c95d6f", // Soft Wine Rose
    },
    cough: {
        bg: "bg-sky-100/90",
        text: "text-sky-950",
        border: "border-sky-300",
        darkBg: "dark:bg-sky-950/70",
        darkText: "dark:text-sky-200",
        darkBorder: "dark:border-sky-700/70",
        hex: "#7c1c2b", // Maroon Wine
    },
    injury: {
        bg: "bg-red-100",
        text: "text-red-950",
        border: "border-red-400",
        darkBg: "dark:bg-red-950/80",
        darkText: "dark:text-red-200",
        darkBorder: "dark:border-red-700",
        hex: "#851122", // Deep Burgundy Red
    },
    bodypain: {
        bg: "bg-fuchsia-100/90",
        text: "text-fuchsia-950",
        border: "border-fuchsia-300",
        darkBg: "dark:bg-fuchsia-950/70",
        darkText: "dark:text-fuchsia-200",
        darkBorder: "dark:border-fuchsia-700/70",
        hex: "#ad3c50", // Ruby Burgundy
    },
    checkup: {
        bg: "bg-emerald-100/90",
        text: "text-emerald-950",
        border: "border-emerald-300",
        darkBg: "dark:bg-emerald-950/70",
        darkText: "dark:text-emerald-200",
        darkBorder: "dark:border-emerald-700/70",
        hex: "#630b1c", // Darkest Velvet Burgundy
    },
    firstaid: {
        bg: "bg-teal-100/90",
        text: "text-teal-950",
        border: "border-teal-300",
        darkBg: "dark:bg-teal-950/70",
        darkText: "dark:text-teal-200",
        darkBorder: "dark:border-teal-700/70",
        hex: "#bf4e61", // Rose Burgundy
    },
    allergy: {
        bg: "bg-violet-100/90",
        text: "text-violet-950",
        border: "border-violet-300",
        darkBg: "dark:bg-violet-950/70",
        darkText: "dark:text-violet-200",
        darkBorder: "dark:border-violet-700/70",
        hex: "#9e2f42", // Velvet Wine
    },
    medication: {
        bg: "bg-blue-100/90",
        text: "text-blue-950",
        border: "border-blue-300",
        darkBg: "dark:bg-blue-950/70",
        darkText: "dark:text-blue-200",
        darkBorder: "dark:border-blue-700/70",
        hex: "#70091f", // Primary Burgundy
    },
    dysmenorrhea: {
        bg: "bg-pink-100/90",
        text: "text-pink-950",
        border: "border-pink-300",
        darkBg: "dark:bg-pink-950/70",
        darkText: "dark:text-pink-200",
        darkBorder: "dark:border-pink-700/70",
        hex: "#d67182", // Dusty Rose Burgundy
    },
    asthma: {
        bg: "bg-cyan-100/90",
        text: "text-cyan-950",
        border: "border-cyan-300",
        darkBg: "dark:bg-cyan-950/70",
        darkText: "dark:text-cyan-200",
        darkBorder: "dark:border-cyan-700/70",
        hex: "#8e2335", // Brick Burgundy
    },
    dental: {
        bg: "bg-slate-200/90",
        text: "text-slate-950",
        border: "border-slate-400",
        darkBg: "dark:bg-slate-800",
        darkText: "dark:text-slate-200",
        darkBorder: "dark:border-slate-600",
        hex: "#5a101d", // Deep Maroon
    },
    other: {
        bg: "bg-amber-100/80",
        text: "text-amber-950",
        border: "border-amber-300",
        darkBg: "dark:bg-amber-950/60",
        darkText: "dark:text-amber-200",
        darkBorder: "dark:border-amber-700",
        hex: "#70091f", // Primary Burgundy
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
    if (lower.includes("dizziness") || lower.includes("lightheaded") || lower.includes("vertigo")) {
        return REASON_COLOR_MAP.dizziness;
    }
    if (lower.includes("fatigue") || lower.includes("weakness") || lower.includes("tired") || lower.includes("malaise") || lower.includes("exhaustion")) {
        return REASON_COLOR_MAP.fatigue;
    }
    if (lower.includes("stomach") || lower.includes("abdominal") || lower.includes("hyperacidity") || lower.includes("nausea") || lower.includes("gastric")) {
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
 * Centralized React component to render consultation reason in clean text without color badges
 */
export function ReasonBadge({
    reason,
    symptoms,
    className = "",
}: {
    reason: string | null | undefined;
    symptoms?: string | null;
    className?: string;
    showSymptoms?: boolean;
}) {
    if (!reason || reason === "-") {
        return <span className="text-xs text-stone-400 italic">None</span>;
    }

    const lower = reason.toLowerCase().trim();
    const displayText = lower === "other" && symptoms ? symptoms : reason.trim();
    const tooltipText = symptoms && symptoms.trim() && symptoms.trim() !== displayText
        ? `Reason: ${displayText} • Symptoms: ${symptoms.trim()}`
        : displayText;

    return (
        <span
            className={`inline-block text-xs font-semibold text-[#3c332a] dark:text-stone-200 break-words leading-snug ${className}`}
            title={tooltipText}
        >
            {displayText}
        </span>
    );
}

export function renderReasonBadge(reason: string | null | undefined, symptoms?: string | null) {
    return <ReasonBadge reason={reason} symptoms={symptoms} />;
}
