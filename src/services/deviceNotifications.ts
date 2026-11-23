import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { ClinicNotification } from "./notifications";

const PUSHED_NOTIF_KEY = "tcc-pushed-device-notifs-v2";
let channelCreated = false;

/**
 * Plays an audible clinic chime on the device speaker using Web Audio API.
 */
export function playNotificationChime(): void {
    try {
        if (typeof window === "undefined") return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Harmonious clinic alert tone (D5 to A5)
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch {
        // Audio might be constrained by browser autoplay policy before user gesture
    }
}

/**
 * Vibrates the cellphone hardware with a distinctive alert pattern.
 */
export function vibrateDevice(): void {
    try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([250, 100, 250]);
        }
    } catch {
        // Ignore if device doesn't support vibration
    }
}

/**
 * Ensures the Android 8+ Notification Channel exists with MAX importance so alerts
 * pop up directly on top of the screen (heads-up) with sound, light, and vibration.
 */
async function ensureNotificationChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform() || channelCreated) return;
    try {
        await LocalNotifications.createChannel({
            id: "tcc_clinic_alerts",
            name: "TCC Clinic Alerts",
            description: "High-priority clinic alerts, medication reminders, and vital signs triage",
            importance: 5, // MAX importance: heads-up banner on screen with sound & vibration
            visibility: 1, // Visible on lock screen
            vibration: true,
            sound: "default",
            lights: true,
            lightColor: "#70091f",
        });
        channelCreated = true;
    } catch (err) {
        console.warn("Could not create Android notification channel:", err);
    }
}

/**
 * Checks current notification permission status across Native Android and Web/Mobile browsers.
 */
export async function getDeviceNotificationPermissionStatus(): Promise<"granted" | "denied" | "default" | "unsupported"> {
    try {
        if (Capacitor.isNativePlatform()) {
            const check = await LocalNotifications.checkPermissions();
            if (check.display === "granted") return "granted";
            if (check.display === "denied") return "denied";
            return "default";
        }

        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission as "granted" | "denied" | "default";
        }
    } catch (e) {
        console.warn("Error checking notification permission:", e);
    }
    return "unsupported";
}

/**
 * Checks whether the current runtime environment can request and display push notifications.
 * Browsers strictly prohibit Notification and ServiceWorker APIs on insecure HTTP origins
 * (e.g., http://192.168.x.x:5173), allowing only HTTPS or localhost.
 */
export function getNotificationEnvironmentInfo(): {
    isNative: boolean;
    isSecure: boolean;
    isLocalhost: boolean;
    canPrompt: boolean;
    permission: "granted" | "denied" | "default" | "unsupported";
    reason?: string;
} {
    if (Capacitor.isNativePlatform()) {
        return {
            isNative: true,
            isSecure: true,
            isLocalhost: false,
            canPrompt: true,
            permission: "default",
        };
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
        return {
            isNative: false,
            isSecure: false,
            isLocalhost: false,
            canPrompt: false,
            permission: "unsupported",
            reason: "Notifications are not supported in this browser.",
        };
    }

    const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
    const isSecure = window.isSecureContext || isLocalhost;

    if (!isSecure) {
        return {
            isNative: false,
            isSecure: false,
            isLocalhost: false,
            canPrompt: false,
            permission: Notification.permission as any,
            reason: "Web browsers strictly block push notifications on plain HTTP (192.168.x.x). To receive notifications on your phone, use the native Android App (.apk) or open the live HTTPS site (https://tcc-clinic.cloud).",
        };
    }

    return {
        isNative: false,
        isSecure: true,
        isLocalhost,
        canPrompt: Notification.permission !== "denied",
        permission: Notification.permission as any,
        reason:
            Notification.permission === "denied"
                ? "Notifications were blocked in your browser settings. Please click the lock or settings icon next to the address bar to allow them."
                : undefined,
    };
}

/**
 * Initializes and requests notification permissions across both Native Android (Capacitor)
 * and Mobile Browser / PWA environments. Must be called in response to a user click gesture
 * for mobile web browsers to display the prompt.
 */
export async function requestDeviceNotificationPermission(): Promise<boolean> {
    try {
        if (Capacitor.isNativePlatform()) {
            await ensureNotificationChannel();
            const status = await LocalNotifications.requestPermissions();
            const granted = status.display === "granted";
            if (granted) {
                await ensureNotificationChannel();
            }
            return granted;
        }

        // Web / PWA / Android Chrome Browser
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
                return true;
            }
            if (Notification.permission !== "denied") {
                const res = await Notification.requestPermission();
                return res === "granted";
            }
        }
    } catch (err) {
        console.warn("Device notification permission request failed:", err);
    }
    return false;
}

/**
 * Sends a system push notification to the user's cellphone status bar / notification tray.
 */
export async function sendDeviceNotification(
    title: string,
    body: string,
    id?: number | string
): Promise<boolean> {
    // 1. Play tactile vibration and audio chime
    vibrateDevice();
    playNotificationChime();

    const notifNumericId = typeof id === "number" ? id : Math.floor(Math.random() * 1000000) + 1;
    const notifTitle = title || "TCC Clinic Alert";
    const notifBody = body || "You have a new update in TCC Clinic.";

    try {
        // 2. Native Android Mobile App (Capacitor)
        if (Capacitor.isNativePlatform()) {
            await ensureNotificationChannel();

            // Request permission on-the-fly if not yet granted
            const check = await LocalNotifications.checkPermissions();
            if (check.display !== "granted") {
                const req = await LocalNotifications.requestPermissions();
                if (req.display !== "granted") {
                    console.warn("LocalNotifications permission not granted on Android");
                    return false;
                }
            }

            // Schedule without 'at' to fire IMMEDIATELY via NotificationManager.notify()
            // (Avoids Android 12+ SCHEDULE_EXACT_ALARM restrictions)
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: notifTitle,
                        body: notifBody,
                        id: notifNumericId,
                        channelId: "tcc_clinic_alerts",
                        smallIcon: "ic_stat_clinic",
                        iconColor: "#70091f",
                        actionTypeId: "",
                        extra: { url: "/dashboard" },
                    },
                ],
            });
            return true;
        }

        // 3. Mobile Browser / PWA via ServiceWorker (Android Chrome lock screen & notification tray)
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission !== "granted") {
                try {
                    const req = await Notification.requestPermission();
                    if (req !== "granted") return false;
                } catch {
                    return false;
                }
            }

            let dispatched = false;

            // Try ServiceWorker message or showNotification
            if ("serviceWorker" in navigator) {
                try {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg && "showNotification" in reg) {
                        await reg.showNotification(notifTitle, {
                            body: notifBody,
                            icon: "/pwa-icon-192.png",
                            badge: "/pwa-icon-192.png",
                            tag: `tcc-alert-${id || Date.now()}`,
                            vibrate: [250, 100, 250],
                            data: { url: "/dashboard" },
                        } as any);
                        dispatched = true;
                    }

                    // Also post message to active service worker controller
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: "SHOW_NOTIFICATION",
                            title: notifTitle,
                            body: notifBody,
                            id: notifNumericId,
                            url: "/dashboard",
                        });
                    }
                } catch (swErr) {
                    console.warn("ServiceWorker notification dispatch error:", swErr);
                }
            }

            // Fallback to Window Notification if ServiceWorker wasn't available
            if (!dispatched) {
                try {
                    new Notification(notifTitle, {
                        body: notifBody,
                        icon: "/pwa-icon-192.png",
                    });
                    dispatched = true;
                } catch (winErr) {
                    console.warn("Window Notification dispatch error:", winErr);
                }
            }

            return dispatched;
        }
    } catch (err) {
        console.warn("Failed to dispatch device notification:", err);
    }
    return false;
}

/**
 * Checks incoming clinic notifications against already-pushed IDs and pushes new ones to the cellphone tray.
 */
export async function syncDeviceNotifications(
    notifications: ClinicNotification[]
): Promise<void> {
    if (!Array.isArray(notifications) || notifications.length === 0) return;

    try {
        const rawPushed = localStorage.getItem(PUSHED_NOTIF_KEY);
        let pushedIds: string[] = [];

        if (rawPushed) {
            try {
                pushedIds = JSON.parse(rawPushed);
            } catch {
                pushedIds = [];
            }
        } else {
            // First run on this cellphone: record all existing unread IDs so we don't spam
            const currentUnreadIds = notifications
                .filter((n) => !n.is_read && !n.read)
                .map((n) => String(n.id));
            localStorage.setItem(PUSHED_NOTIF_KEY, JSON.stringify(currentUnreadIds));

            // Notify the single latest unread item so the user gets notified right away!
            const unreadItems = notifications.filter((n) => !n.is_read && !n.read);
            if (unreadItems.length > 0) {
                const latest = unreadItems[0];
                await sendDeviceNotification(
                    latest.title || "TCC Clinic Alert",
                    latest.description || "Active clinic notification requiring attention.",
                    latest.id
                );
            }
            return;
        }

        const unreadItems = notifications.filter((n) => !n.is_read && !n.read);

        for (const item of unreadItems) {
            const notifIdStr = String(item.id);
            if (!pushedIds.includes(notifIdStr)) {
                // New notification detected! Send to cellphone status bar
                await sendDeviceNotification(
                    item.title || "TCC Clinic Notification",
                    item.description || "A new clinic event has occurred.",
                    item.id
                );
                pushedIds.push(notifIdStr);
            }
        }

        // Limit stored ID history to last 200 items
        if (pushedIds.length > 200) {
            pushedIds = pushedIds.slice(-150);
        }
        localStorage.setItem(PUSHED_NOTIF_KEY, JSON.stringify(pushedIds));
    } catch (err) {
        console.warn("Failed to sync device notifications:", err);
    }
}
