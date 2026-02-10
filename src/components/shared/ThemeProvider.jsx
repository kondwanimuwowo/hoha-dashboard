/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
    theme: "system",
    setTheme: () => null,
})

export function ThemeProvider({
    children,
    defaultTheme = "light",
    storageKey = "vite-ui-theme",
    ...props
}) {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem(storageKey)
        return stored === "light" || stored === "dark" ? stored : defaultTheme
    })

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
