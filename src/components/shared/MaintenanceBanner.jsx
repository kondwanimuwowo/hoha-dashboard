import { AlertCircle } from 'lucide-react'
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode'
import { useAuth } from '@/hooks/useAuth'

export function MaintenanceBanner() {
    const { isMaintenanceMode } = useMaintenanceMode()
    const { isAdmin } = useAuth()

    if (!isMaintenanceMode) return null

    return (
        <div className="bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium no-print">
            <AlertCircle className="h-4 w-4" />
            <span>
                Maintenance Mode is ACTIVE.
                {isAdmin ? ' You can access the app, but others will be redirected.' : ' Some features may be unavailable.'}
            </span>
        </div>
    )
}
