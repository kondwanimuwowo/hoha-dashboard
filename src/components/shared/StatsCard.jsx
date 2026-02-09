import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    colorClass = 'bg-primary-50 text-primary-600'
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="border-border">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
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
                        <div className={cn('rounded-lg p-3', colorClass)}>
                            <Icon className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

