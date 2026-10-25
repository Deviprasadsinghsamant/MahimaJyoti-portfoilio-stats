// Firebase Client Configuration
// ─────────────────────────────
// Initialize Firebase in the browser. All Firebase services
// are lazy-loaded to keep the initial bundle small.

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, type Functions } from "firebase/functions";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

// Region the portal's callable Cloud Functions are deployed to.
// Keep in sync with REGION in mj-func/src/domains/staff/handlers.ts.
export const FUNCTIONS_REGION = "asia-south1";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;

function getFirebaseApp(): FirebaseApp {
    if (!app) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    }
    return app;
}

export function getFirebaseAuth(): Auth {
    if (!auth) {
        auth = getAuth(getFirebaseApp());
    }
    return auth;
}

export function getFirebaseDb(): Firestore {
    if (!db) {
        // Persistent IndexedDB cache — repeat reads return from local storage
        // with zero network + zero billable doc reads. Shared across tabs.
        // Falls back to memory cache automatically in server / SSR contexts.
        const application = getFirebaseApp();
        if (typeof window === "undefined") {
            db = initializeFirestore(application, {});
        } else {
            db = initializeFirestore(application, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager(),
                }),
            });
        }
    }
    return db;
}

export function getFirebaseFunctions(): Functions {
    if (!functions) {
        functions = getFunctions(getFirebaseApp(), FUNCTIONS_REGION);
    }
    return functions;
}

export { getFirebaseApp };
