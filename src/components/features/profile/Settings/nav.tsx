import React from "react"
import {
    BookmarkSimpleIcon as BookmarkIcon,
    ChartBarIcon as UsageIcon,
    CreditCardIcon as SubscriptionIcon,
    DesktopIcon as SessionsIcon,
    PencilSimpleIcon as EditIcon,
    ShieldCheckIcon as SecurityIcon,
    SlidersHorizontalIcon as AiSettingsIcon,
    StarIcon as MembershipIcon,
    GraduationCapIcon as CourseHistoryIcon,
} from "@phosphor-icons/react"
import { pathConfig } from "@/resources/path"

/** One settings destination. */
export interface SettingsNavItem {
    /** Stable key + i18n label suffix (`profileSettings.items.<key>`). */
    key: string
    /** Absolute href (locale-prefixed) for the destination. */
    href: string
    /** Leading icon. */
    icon: React.ReactNode
}

/** A labelled group of settings destinations. */
export interface SettingsNavGroup {
    /** Stable key + i18n label suffix (`profileSettings.groups.<key>`). */
    key: string
    /** The destinations in this group. */
    items: Array<SettingsNavItem>
}

/**
 * Build the grouped settings navigation for a locale. Single source of truth for
 * both the sidebar ({@link SettingsLayout}) and the hub landing, so the two never
 * drift. Hrefs are resolved via `pathConfig`.
 *
 * @param locale - the active locale (for locale-prefixed hrefs).
 * @returns the grouped settings destinations.
 */
export const getSettingsGroups = (locale: string): Array<SettingsNavGroup> => {
    const profile = pathConfig().locale(locale).profile()
    return [
        {
            key: "account",
            items: [
                { key: "editProfile", href: profile.edit().build(), icon: <EditIcon className="size-5" /> },
                { key: "security", href: profile.security().build(), icon: <SecurityIcon className="size-5" /> },
                { key: "sessions", href: profile.sessions().build(), icon: <SessionsIcon className="size-5" /> },
            ],
        },
        {
            key: "learning",
            items: [
                { key: "courseHistory", href: profile.learning().build(), icon: <CourseHistoryIcon className="size-5" /> },
            ],
        },
        {
            key: "ai",
            items: [
                { key: "aiSettings", href: profile.aiSettings().build(), icon: <AiSettingsIcon className="size-5" /> },
                { key: "aiSubscription", href: profile.aiSubscription().build(), icon: <SubscriptionIcon className="size-5" /> },
                { key: "aiUsage", href: profile.aiUsage().build(), icon: <UsageIcon className="size-5" /> },
            ],
        },
        {
            // bookmarks + membership share one trailing group so neither is a lone
            // single-item group fenced by its own divider (fragmented look)
            key: "content",
            items: [
                { key: "bookmarks", href: profile.bookmarks().build(), icon: <BookmarkIcon className="size-5" /> },
                { key: "membership", href: profile.membership().build(), icon: <MembershipIcon className="size-5" /> },
            ],
        },
    ]
}
