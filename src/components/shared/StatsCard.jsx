import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Derive a border-top accent color from the icon background class
// e.g. "bg-blue-50 text-blue-600" → "border-blue-400"
function accentBorderFromColorClass(colorClass = '') {
    const match = colorClass.match(/bg-(\w+)-\d+/)
    if (!match) return 'border-primary-400'
    return `border-${match[1]}-400`
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    colorClass = 'bg-primary-50 text-primary-600'
}) {
    const accentBorder = accentBorderFromColorClass(colorClass)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={cn(
                'bg-white dark:bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200',
                'border-t-4',
                accentBorder
            )}>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold text-foreground">{value}</p>
                            {subtitle && (
                                <p className="text-sm text-muted-foreground/70">{subtitle}</p>
                            )}
                            {trend && (
                                <div className={cn(
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    trend > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                )}>
                                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                                </div>
                            )}
                        </div>
                        <div className={cn('rounded-xl p-3', colorClass)}>
                            <Icon className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
