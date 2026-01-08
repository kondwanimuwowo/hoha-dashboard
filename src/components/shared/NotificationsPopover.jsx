import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Bell, Package, Calendar, AlertCircle } from 'lucide-react'

// Mock notifications
const NOTIFICATIONS = [
    {
        id: 1,
        title: 'Low Stock Alert',
        message: 'Maize meal inventory is below 20 bags.',
        time: '10 min ago',
        read: false,
        icon: Package,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
    },
    {
        id: 2,
        title: 'Attendance Reminder',
        message: 'Legacy Women session starts in 1 hour.',
        time: '1 hour ago',
        read: false,
        icon: Calendar,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
    },
    {
        id: 3,
        title: 'System Update',
        message: 'Dashboard maintenance scheduled for Sunday.',
        time: '2 hours ago',
        read: true,
        icon: AlertCircle,
        color: 'text-neutral-500',
        bg: 'bg-neutral-50',
    },
]

export function NotificationsPopover({ children }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                <DropdownMenuLabel className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">Notifications</span>
                        <span className="text-xs font-normal text-neutral-500">2 unread</span>
                    </div>
                </DropdownMenuLabel>

                <div className="max-h-80 overflow-y-auto">
                    {NOTIFICATIONS.map((notification) => {
                        const Icon = notification.icon
                        return (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-3 p-4 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-0 ${!notification.read ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className={`mt-0.5 rounded-full p-2 shrink-0 ${notification.bg}`}>
                                    <Icon className={`h-4 w-4 ${notification.color}`} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-neutral-500 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-[10px] text-neutral-400">
                                        {notification.time}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="p-2 border-t bg-neutral-50">
                    <Button variant="ghost" className="w-full h-8 text-xs">
                        Mark all as read
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
