import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    Heart,
    UtensilsCrossed,
    Package,
    HandHeart,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
    {
        name: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        exact: true
    },
    {
        name: 'Educare Africa',
        href: '/educare',
        icon: GraduationCap,
        description: 'Student management'
    },
    {
        name: 'Legacy Women',
        href: '/legacy',
        icon: Users,
        description: 'Women empowerment'
    },
    {
        name: 'Clinicare Africa',
        href: '/clinicare',
        icon: Heart,
        description: 'Healthcare services'
    },
    {
        name: 'Food Distribution',
        href: '/food',
        icon: UtensilsCrossed,
        description: 'Quarterly hampers'
    },
    {
        name: 'Emergency Relief',
        href: '/emergency-relief',
        icon: Package,
        description: 'Crisis support'
    },
    {
        name: 'Community Outreach',
        href: '/community-outreach',
        icon: HandHeart,
        description: 'Weekly outreach'
    },
    {
        name: 'Reports',
        href: '/reports',
        icon: BarChart3,
        description: 'Analytics & insights'
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'System settings'
    }
]

export function Sidebar({ mobileOpen, desktopOpen, onMobileClose, onDesktopToggle }) {
    const { isAdmin } = useAuth()

    const fullNavigation = [
        ...navigation,
        ...(isAdmin ? [{
            name: 'User Management',
            href: '/admin/users',
            icon: Users,
            description: 'Manage users & roles'
        }] : [])
    ]

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: desktopOpen ? 280 : 80
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:flex flex-col border-r border-neutral-200 dark:border-border bg-card no-print"
            >
                {/* Logo Section */}
                <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-200 dark:border-border">
                    <AnimatePresence mode="wait">
                        {desktopOpen ? (
                            <motion.div
                                key="logo-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center space-x-3"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-lg shadow-md">
                                    H
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-neutral-900 dark:text-foreground">HOHA</h1>
                                    <p className="text-xs text-neutral-500 dark:text-muted-foreground">Dashboard</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="logo-compact"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-lg shadow-md"
                            >
                                H
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                    {fullNavigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            end={item.exact}
                            className={({ isActive }) =>
                                cn(
                                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary/10 dark:text-primary'
                                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        className={cn(
                                            'h-5 w-5 shrink-0 transition-colors',
                                            isActive ? 'text-primary-600 dark:text-primary' : 'text-neutral-400 group-hover:text-neutral-600 dark:text-muted-foreground dark:group-hover:text-accent-foreground'
                                        )}
                                    />
                                    <AnimatePresence mode="wait">
                                        {desktopOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="ml-3 flex-1"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{item.name}</span>
                                                </div>
                                                {item.description && (
                                                    <p className="text-xs text-neutral-500 mt-0.5">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Toggle Button */}
                <div className="border-t border-neutral-200 dark:border-border p-3">
                    <button
                        onClick={onDesktopToggle}
                        className="flex w-full items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                        aria-label={desktopOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {desktopOpen ? (
                            <ChevronLeft className="h-5 w-5" />
                        ) : (
                            <ChevronRight className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Sidebar - Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onMobileClose}
                            className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden"
                        />

                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-neutral-200 dark:border-border bg-card lg:hidden no-print"
                        >
                            {/* Logo Section */}
                            <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-200 dark:border-border">
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-lg shadow-md">
                                        H
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-neutral-900 dark:text-foreground">HOHA</h1>
                                        <p className="text-xs text-neutral-500 dark:text-muted-foreground">Dashboard</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                                {fullNavigation.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        end={item.exact}
                                        onClick={onMobileClose}
                                        className={({ isActive }) =>
                                            cn(
                                                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                                isActive
                                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary/10 dark:text-primary'
                                                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
                                            )
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <item.icon
                                                    className={cn(
                                                        'h-5 w-5 shrink-0 transition-colors',
                                                        isActive ? 'text-primary-600 dark:text-primary' : 'text-neutral-400 group-hover:text-neutral-600 dark:text-muted-foreground dark:group-hover:text-accent-foreground'
                                                    )}
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span>{item.name}</span>
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-0.5">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
