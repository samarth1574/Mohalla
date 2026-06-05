"use client";

import { useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase app
let app: any = null;
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('[PWA] Firebase initialization error:', error);
  }
}

export function PwaRegister() {
  useEffect(() => {
    // Service Worker registration
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[SW] Registered:", reg.scope))
        .catch((err) => console.error("[SW] Registration failed:", err));
    }

    // FCM token registration
    const registerFCMToken = async () => {
      if (typeof Notification === 'undefined' || !app) {
        return;
      }

      if (Notification.permission === 'denied') {
        console.log('[FCM] Notification permission denied');
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const messaging = getMessaging(app);
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
          });

          if (token) {
            console.log('[FCM] Token obtained:', token.substring(0, 20) + '...');
            
            // Save to database
            const response = await fetch('/api/fcm/save-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });

            if (response.ok) {
              console.log('[FCM] Token saved successfully');
            } else {
              console.error('[FCM] Failed to save token');
            }
          }
        }
      } catch (error) {
        console.error('[FCM] Token registration error:', error);
      }
    };

    // Register FCM token after a short delay to ensure auth is ready
    const timer = setTimeout(() => {
      registerFCMToken();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
