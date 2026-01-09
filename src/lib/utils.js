import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { format, differenceInYears } from "date-fns"

// Profile image placeholders
export const MALE_PLACEHOLDER = 'https://uxewirvydfvkpmlucyos.supabase.co/storage/v1/object/public/photos/placeholders/male-placeholder.png'
export const FEMALE_PLACEHOLDER = 'https://uxewirvydfvkpmlucyos.supabase.co/storage/v1/object/public/photos/placeholders/female-placeholder.png'

export function getProfilePlaceholder(gender) {
    return gender === 'Male' ? MALE_PLACEHOLDER : FEMALE_PLACEHOLDER
}

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(date, formatStr = 'MMM dd, yyyy') {
    if (!date) return ''
    try {
        return format(new Date(date), formatStr)
    } catch (error) {
        console.error('Error formatting date:', error)
        return ''
    }
}

export function calculateAge(birthDate) {
    if (!birthDate) return null
    try {
        return differenceInYears(new Date(), new Date(birthDate))
    } catch (error) {
        console.error('Error calculating age:', error)
        return null
    }
}

export function formatCurrency(amount, currency = 'ZMW') {
    if (amount === null || amount === undefined) return ''
    try {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    } catch (error) {
        console.error('Error formatting currency:', error)
        return `${currency} ${amount}`
    }
}
