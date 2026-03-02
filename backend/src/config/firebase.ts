import admin from "firebase-admin";
import { env } from "./env";

// Initialize Firebase Admin SDK
// Uses GOOGLE_APPLICATION_CREDENTIALS environment variable for service account authentication
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  });
}

// Export the storage bucket (bypasses all security rules)
export const bucket = admin.storage().bucket();
