import { useNavigate } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, GraduationCap, Leaf, Package } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const TYPE_CONFIG = {
    follow_up_overdue: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    follow_up_upcoming: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    follow_up_undated: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    educare_enroll: { icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
    legacy_enroll: { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    food_distribution: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
}

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function NotificationsPopover({ children }) {
    const navigate = useNavigate()
    const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications()

    function handleClick(item) {
        if (!item.read) markRead(item.key)
        navigate(item.link)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                <DropdownMenuLabel className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="text-xs font-normal text-neutral-500">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                </DropdownMenuLabel>

                <div className="max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <LoadingSpinner size="sm" />
                    ) : notifications.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-400">
                            No new notifications
                        </p>
                    ) : (
                        notifications.map((item) => {
                            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.follow_up_upcoming
                            const Icon = config.icon
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => handleClick(item)}
                                    className={`flex items-start gap-3 p-4 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-0 ${!item.read ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className={`mt-0.5 rounded-full p-2 shrink-0 ${config.bg}`}>
                                        <Icon className={`h-4 w-4 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-neutral-500 line-clamp-2">
                                            {item.message}
                                        </p>
                                        <p className="text-[10px] text-neutral-400">
                                            {timeAgo(item.createdAt)}
                                        </p>
                                    </div>
                                    {!item.read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                <DropdownMenuSeparator className="m-0" />
                <div className="p-2 bg-neutral-50">
                    <Button
                        variant="ghost"
                        className="w-full h-8 text-xs"
                        disabled={unreadCount === 0}
                        onClick={markAllRead}
                    >
                        Mark all as read
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
