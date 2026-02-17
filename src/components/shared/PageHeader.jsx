import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function PageHeader({ title, description, action, actionLabel, actionIcon: ActionIcon }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                    {description && (
                        <p className="mt-2 text-muted-foreground">{description}</p>
                    )}
                </div>
                {action && actionLabel && (
                    <div className="no-print">
                        <Button onClick={action} size="lg">
                            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                            {actionLabel}
                        </Button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

