import { Skeleton } from '@/components/ui/skeleton'

export function StatCardsSkeleton({ count = 4 }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-white dark:bg-card p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function TableSkeleton({ rows = 8, columns = 5 }) {
    return (
        <div className="rounded-xl border bg-white dark:bg-card shadow-sm overflow-hidden">
            <div className="flex gap-4 px-4 py-3 border-b bg-muted/30">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    {Array.from({ length: columns - 1 }).map((_, j) => (
                        <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function ProfileHeroSkeleton() {
    return (
        <div className="rounded-xl border bg-white dark:bg-card shadow-sm overflow-hidden">
            <div className="h-2 bg-muted" />
            <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
                <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                <div className="space-y-2 flex-1 w-full">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
        </div>
    )
}

export function CardSkeleton({ lines = 4, title = true }) {
    return (
        <div className="rounded-xl border bg-white dark:bg-card p-6 shadow-sm space-y-3">
            {title && <Skeleton className="h-5 w-32 mb-1" />}
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
            ))}
        </div>
    )
}

export function OverviewSkeleton() {
    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-border">
                <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
                <div className="h-4 w-72 rounded-md bg-muted animate-pulse mt-2" />
            </div>
            <StatCardsSkeleton count={4} />
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                ))}
            </div>
            <CardSkeleton lines={6} />
        </div>
    )
}

export function FilterBarSkeleton({ filters = 3 }) {
    return (
        <div className="flex flex-wrap gap-3 mb-4">
            <Skeleton className="h-9 w-48 rounded-md" />
            {Array.from({ length: filters }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-32 rounded-md" />
            ))}
        </div>
    )
}

export function TabsSkeleton({ tabs = 3 }) {
    return (
        <div className="flex gap-1 rounded-lg bg-muted p-1 mb-6">
            {Array.from({ length: tabs }).map((_, i) => (
                <Skeleton key={i} className="h-8 flex-1 rounded-md" />
            ))}
        </div>
    )
}
