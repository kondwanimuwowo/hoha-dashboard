import { motion } from 'framer-motion'
import { Settings, Tool, Clock, Mail } from 'lucide-react'

export function MaintenanceMode() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center space-y-8"
            >
                {/* Logo area */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
                        <span className="text-4xl font-bold text-white">H</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-neutral-900">Scheduled Maintenance</h1>
                    <p className="text-lg text-neutral-600">
                        We're currently performing some scheduled updates to improve the HOHA Dashboard.
                    </p>
                </div>

                <div className="grid gap-4 py-8">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-neutral-200 text-left">
                        <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-neutral-900">Est. Completion</p>
                            <p className="text-sm text-neutral-600">Within the next 2 hours</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-neutral-200 text-left">
                        <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-neutral-900">Urgent Matters</p>
                            <p className="text-sm text-neutral-600">contact@example.com</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-2 text-neutral-400">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                        <Settings className="h-6 w-6" />
                    </motion.div>
                </div>

                <p className="text-sm text-neutral-500 italic">
                    Thank you for your patience as we build a better experience for HOHA.
                </p>
            </motion.div>
        </div>
    )
}
