import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { apiClient } from "./api-client";

export type PushRegistrationStatus = "unsupported" | "prompt" | "denied" | "ready";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let foregroundListenerRegistered = false;

function isFirebaseMessagingConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      vapidKey,
  );
}

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

async function registerDeviceToken(token: string) {
  await apiClient.post<{ ok: boolean }>("/v1/notifications/devices", {
    token,
    deviceLabel: "Browser",
  });
}

async function ensureServiceWorker() {
  return navigator.serviceWorker.register(new URL("../../firebase-messaging-sw.ts", import.meta.url), {
    type: "module",
  });
}

export async function registerPushNotifications(): Promise<PushRegistrationStatus> {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    typeof Notification === "undefined" ||
    !isFirebaseMessagingConfigured()
  ) {
    return "unsupported";
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return "unsupported";
  }

  if (Notification.permission === "default") {
    return "prompt";
  }

  if (Notification.permission !== "granted") {
    return "denied";
  }

  const registration = await ensureServiceWorker();
  const messaging = getMessaging(getFirebaseApp());
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    return "prompt";
  }

  await registerDeviceToken(token);

  if (!foregroundListenerRegistered) {
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "Getswyft";
      const body = payload.notification?.body || "You have a new workspace notification.";
      window.dispatchEvent(
        new CustomEvent("getswyft:push-received", {
          detail: {
            title,
            body,
            payload,
          },
        }),
      );
    });
    foregroundListenerRegistered = true;
  }

  return "ready";
}

export async function requestPushNotificationsAccess() {
  if (typeof Notification === "undefined") {
    return "unsupported" as PushRegistrationStatus;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return permission === "denied" ? "denied" : "prompt";
  }

  return registerPushNotifications();
}
