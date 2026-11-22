import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { ClinicNotification } from "./notifications";

const PUSHED_NOTIF_KEY = "tcc-pushed-device-notifs-v1";
let channelCreated = false;

/**
 * Initializes and requests notification permissions across both Native Android (Capacitor)
 * and Mobile Browser / PWA environments.
 */
export async function requestDeviceNotificationPermission(): Promise<boolean> {
    try {
        if (Capacitor.isNativePlatform()) {
            const status = await LocalNotifications.requestPermissions();
            const granted = status.display === "granted";

            if (granted && !channelCreated) {
                try {
                    await LocalNotifications.createChannel({
                        id: "tcc_clinic_alerts",
                        name: "TCC Clinic Alerts",
                        description: "Vital alerts, medication reminders, and student triage updates",
                        importance: 5, // High priority (pops up on screen with sound & vibration)
                        visibility: 1, // Visible on lock screen
                        vibration: true,
                        sound: "default",
                        lights: true,
                        lightColor: "#70091f",
                    });
                    channelCreated = true;
                } catch (chErr) {
                    console.warn("Could not create Android notification channel:", chErr);
                }
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
 * Sends a system push notification to the user's cellphone or device tray.
 */
export async function sendDeviceNotification(
    title: string,
    body: string,
    id?: number | string
): Promise<void> {
    try {
        const notifNumericId = typeof id === "number" ? id : Math.floor(Math.random() * 1000000) + 1;

        // 1. Native Android Mobile App (Capacitor)
        if (Capacitor.isNativePlatform()) {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: title || "TCC Clinic Alert",
                        body: body || "You have a new update in TCC Clinic.",
                        id: notifNumericId,
                        schedule: { at: new Date(Date.now() + 100) }, // Near-instant schedule
                        channelId: "tcc_clinic_alerts",
                        smallIcon: "ic_launcher_round",
                        iconColor: "#70091f",
                        actionTypeId: "",
                        extra: { url: "/dashboard" },
                    },
                ],
            });
            return;
        }

        // 2. Mobile Browser / PWA via ServiceWorker (Android Chrome lock screen & notification tray)
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready.catch(() => null);
            if (registration && "showNotification" in registration) {
                await registration.showNotification(title || "TCC Clinic Alert", {
                    body: body || "You have a new clinic notification.",
                    icon: "/pwa-icon-192.png",
                    badge: "/pwa-icon-192.png",
                    tag: `tcc-notif-${id || Date.now()}`,
                    vibrate: [200, 100, 200],
                    data: { url: "/dashboard" },
                });
                return;
            }
        }

        // 3. Fallback: Standard Web Notification
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(title || "TCC Clinic Alert", {
                body: body || "You have a new clinic notification.",
                icon: "/pwa-icon-192.png",
            });
        }
    } catch (err) {
        console.warn("Failed to dispatch device notification:", err);
    }
}

/**
 * Checks a list of incoming clinic notifications against already-pushed IDs.
 * Automatically dispatches phone notifications for newly arrived unread items.
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
            // First run on this browser/cellphone: seed existing unread IDs so we don't spam 20 notifications at once
            const currentUnreadIds = notifications
                .filter((n) => !n.is_read && !n.read)
                .map((n) => String(n.id));
            localStorage.setItem(PUSHED_NOTIF_KEY, JSON.stringify(currentUnreadIds));
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
        console.warn("Error synchronizing device notifications:", err);
    }
}
