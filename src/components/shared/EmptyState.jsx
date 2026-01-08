import { Button } from '@/components/ui/button'

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    actionLabel
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-neutral-100 p-4 mb-4">
                <Icon className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm">{description}</p>
            {action && actionLabel && (
                <Button onClick={action}>{actionLabel}</Button>
            )}
        </div>
    )
}