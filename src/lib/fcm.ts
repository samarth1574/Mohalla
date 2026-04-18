import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { db } from '@/lib/db';

// Initialize Firebase Admin SDK
let adminApp: App | undefined;

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccount) {
    try {
      adminApp = initializeApp({
        credential: cert(JSON.parse(serviceAccount))
      });
      console.log('[FCM] Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('[FCM] Failed to initialize Firebase Admin SDK:', error);
    }
  } else {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT_KEY not set - push notifications disabled');
  }
} else {
  adminApp = getApps()[0];
}

interface FCMNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send multicast notification to multiple tokens
 * @param tokens Array of FCM tokens
 * @param notification Notification payload with title, body, and optional data
 */
export async function sendMulticastNotification(
  tokens: string[],
  notification: FCMNotification
): Promise<void> {
  if (!adminApp || getApps().length === 0) {
    console.warn('[FCM] Skipping — FIREBASE_SERVICE_ACCOUNT_KEY not set');
    return;
  }

  if (tokens.length === 0) {
    console.log('[FCM] No tokens provided, skipping notification');
    return;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens
    };

    const messaging = getMessaging(adminApp);
    const response = await messaging.sendEachForMulticast(message);
    
    console.log(`[FCM] Sent ${response.successCount}/${tokens.length} notifications`);

    // Handle invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (resp.error) {
        const errorCode = resp.error.code;
        console.log(`[FCM] Error sending to token ${idx}: ${errorCode}`);
        
        if (errorCode === 'messaging/invalid-registration-token' || 
            errorCode === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // Clean up invalid tokens from database
    if (invalidTokens.length > 0) {
      console.log(`[FCM] Cleaning up ${invalidTokens.length} invalid tokens`);
      await db.user.updateMany({
        where: { fcmToken: { in: invalidTokens } },
        data: { fcmToken: null }
      });
    }
  } catch (error) {
    console.error('[FCM] Multicast send failed:', error);
    // Don't throw - we don't want to block SOS creation
  }
}

/**
 * Send notification to a single token
 * @param token FCM token
 * @param notification Notification payload
 */
export async function sendSingleNotification(
  token: string,
  notification: FCMNotification
): Promise<void> {
  if (!adminApp || getApps().length === 0) {
    console.warn('[FCM] Skipping — FIREBASE_SERVICE_ACCOUNT_KEY not set');
    return;
  }

  if (!token) {
    console.log('[FCM] No token provided, skipping notification');
    return;
  }

  try {
    const messaging = getMessaging(adminApp);
    await messaging.send({
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      token
    });

    console.log('[FCM] Single notification sent successfully');
  } catch (error: any) {
    console.error('[FCM] Single send failed:', error);
    
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('[FCM] Cleaning up invalid token');
      await db.user.updateMany({
        where: { fcmToken: token },
        data: { fcmToken: null }
      });
    }
  }
}
