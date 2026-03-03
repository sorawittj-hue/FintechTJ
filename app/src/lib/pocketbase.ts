/**
 * PocketBase Client — Singleton
 *
 * Initializes a single PocketBase instance shared across the app.
 * URL is read from VITE_POCKETBASE_URL env var.
 *
 * If no URL is configured the app runs in "offline mode" — all PocketBase
 * operations are skipped gracefully and local state is used instead.
 *
 * Setup:
 *   1. Download PocketBase: https://pocketbase.io/docs/
 *   2. Run: ./pocketbase serve
 *   3. Add to .env: VITE_POCKETBASE_URL=http://127.0.0.1:8090
 */

import PocketBase from 'pocketbase';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL as string | undefined;

// Determines if PocketBase is configured
export const isPocketBaseEnabled = !!PB_URL && PB_URL.trim() !== '';

// Singleton instance — null when PocketBase is not configured
export const pb = isPocketBaseEnabled
    ? new PocketBase(PB_URL)
    : null;

// Keep auth token valid across page reloads (handled by PocketBase SDK automatically)
if (pb) {
    pb.autoCancellation(false); // prevent auto-cancel on component unmount in React
}

/**
 * Check if PocketBase server is reachable.
 * Returns true if healthy, false otherwise (never throws).
 */
export async function checkPocketBaseHealth(): Promise<boolean> {
    if (!pb) return false;
    try {
        const health = await pb.health.check();
        return health.code === 200;
    } catch {
        return false;
    }
}

/**
 * Type-safe helper to get the current authenticated user model, or null.
 */
export function getCurrentUser() {
    if (!pb) return null;
    return pb.authStore.isValid ? pb.authStore.model : null;
}

export type { RecordModel } from 'pocketbase';
