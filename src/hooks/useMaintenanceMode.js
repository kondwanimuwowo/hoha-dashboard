import { useMemo } from 'react'

/**
 * Hook to check if the application is in maintenance mode.
 * Maintenance mode is controlled via an environment variable.
 * Admins can still access the app even when maintenance mode is active.
 */
export function useMaintenanceMode() {
    // Check environment variable
    // Note: VITE_ variables are baked in at build time.
    // For a real production app, you might want to fetch this from Supabase instead
    // for dynamic switching without redeploying.
    const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

    return {
        isMaintenanceMode
    }
}
