import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useState } from 'react'

export function DashboardLayout() {
    const [desktopOpen, setDesktopOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar
                mobileOpen={mobileOpen}
                desktopOpen={desktopOpen}
                onMobileClose={() => setMobileOpen(false)}
                onDesktopToggle={() => setDesktopOpen(!desktopOpen)}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
