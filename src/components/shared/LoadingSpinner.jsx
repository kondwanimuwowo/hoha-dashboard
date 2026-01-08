import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingSpinner({ className, size = 'default' }) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2
                className={cn(
                    'animate-spin text-primary-600',
                    size === 'sm' && 'h-4 w-4',
                    size === 'default' && 'h-8 w-8',
                    size === 'lg' && 'h-12 w-12',
                    className
                )}
            />
        </div>
    )
}