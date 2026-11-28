
import axios from "axios";
import { invalidateRecordCache } from "./recordCache";

const cleanUrl = (url: unknown): string => {
    if (typeof url !== "string") return "";
    let clean = url.trim();
    while (
        (clean.startsWith('"') && clean.endsWith('"')) ||
        (clean.startsWith("'") && clean.endsWith("'"))
    ) {
        clean = clean.slice(1, -1).trim();
    }
    return clean.replace(/\/+$/, "");
};

const rawEnvUrl = cleanUrl(import.meta.env.VITE_API_URL);

export const getApiOrigin = (): string => {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;

        // In local development
        if (host === "localhost" || host === "127.0.0.1") {
            if (rawEnvUrl) {
                try {
                    return new URL(rawEnvUrl).origin;
                } catch {
                    console.error("Invalid VITE_API_URL:", rawEnvUrl);
                }
            }
            return "http://127.0.0.1:8000";
        }

        // In production: only use rawEnvUrl if it does NOT point to localhost
        if (rawEnvUrl && !rawEnvUrl.includes("localhost") && !rawEnvUrl.includes("127.0.0.1")) {
            try {
                return new URL(rawEnvUrl).origin;
            } catch {
                console.error("Invalid VITE_API_URL:", rawEnvUrl);
            }
        }

        // Live Railway production backend
        return "https://backend-clinic-production-f6503b5a.up.railway.app";
    }

    if (rawEnvUrl && !rawEnvUrl.includes("localhost") && !rawEnvUrl.includes("127.0.0.1")) {
        try {
            return new URL(rawEnvUrl).origin;
        } catch {}
    }

    return "http://127.0.0.1:8000";
};

export const getApiBaseUrl = (): string => {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;

        // In local development
        if (host === "localhost" || host === "127.0.0.1") {
            if (rawEnvUrl) {
                return rawEnvUrl;
            }
            return "http://127.0.0.1:8000/api";
        }

        // In production: only use rawEnvUrl if it does NOT point to localhost
        if (rawEnvUrl && !rawEnvUrl.includes("localhost") && !rawEnvUrl.includes("127.0.0.1")) {
            return rawEnvUrl.endsWith("/api") ? rawEnvUrl : `${rawEnvUrl}/api`;
        }

        // Live Railway production backend API
        return "https://backend-clinic-production-f6503b5a.up.railway.app/api";
    }

    if (rawEnvUrl && !rawEnvUrl.includes("localhost") && !rawEnvUrl.includes("127.0.0.1")) {
        return rawEnvUrl.endsWith("/api") ? rawEnvUrl : `${rawEnvUrl}/api`;
    }

    return "http://127.0.0.1:8000/api";
};

export const resolveImageUrl = (
    path: string | null | undefined
): string | null => {
    if (!path) return null;

    const trimmed = String(path).trim();

    if (!trimmed) return null;

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }

    const cleanPath = trimmed.startsWith("/")
        ? trimmed
        : `/${trimmed}`;

    return `${getApiOrigin()}${cleanPath}`;
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

const USER_SCOPED_STORAGE_KEYS = [
    "token",
    "user",
    "tcc-dashboard-cache",
    "tcc-dashboard-persisted",
    "tcc-ai-chat-sessions-v1",
    "tcc-ai-active-session-id-v1",
    "tcc-clinic-notifications-cache-v2",
    "tcc-dismissed-activities",
    "tcc-pushed-device-notifs-v2",
    "tcc_organization_data_v1",
];

export const clearAuthSession = (): void => {
    try {
        invalidateRecordCache();
    } catch {
        // ignore cache clear error
    }

    if (typeof window !== "undefined") {
        USER_SCOPED_STORAGE_KEYS.forEach((key) => {
            try {
                localStorage.removeItem(key);
            } catch {
                // ignore storage error
            }
        });
        try {
            sessionStorage.clear();
        } catch {
            // ignore sessionStorage error
        }
    }
};

api.interceptors.response.use(
    (response) => {
        const method = response.config.method?.toLowerCase() || "get";

        if (!["get", "head", "options"].includes(method)) {
            invalidateRecordCache();
        }

        return response;
    },
    (error) => {
        if (error?.response?.status === 401) {
            clearAuthSession();

            if (
                typeof window !== "undefined" &&
                !window.location.pathname.startsWith("/login")
            ) {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
