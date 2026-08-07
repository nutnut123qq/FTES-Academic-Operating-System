import React from "react"
import {
    RobotIcon,
} from "@phosphor-icons/react"
import { pathConfig } from "@/resources/path"

/**
 * One discovery shortcut in the account popup's "Khám phá" (Explore) section —
 * the relocated header discovery entries (see change `app-shell-header-nav`:
 * the header carries plain module links only, so `/ai` enters the app from
 * HERE). Recommendations was folded into the AI Assistant hub, Trending into
 * Community, and "Dành cho bạn" (For you) removed (the community feed is reached
 * from the Community tab), so only the AI Assistant remains here.
 */
export interface ExploreShortcut {
    id: "ai"
    icon: React.ReactNode
    /** Full i18n key of the shortcut label (`profileMenu.explore.*`). */
    labelKey: string
    /** Destination path (locale-less; the proxy re-adds the locale). */
    path: () => string
    /** Guests must sign in first (personalized surface); public ones navigate. */
    authGated: boolean
}

/** The Explore shortcuts, in display order. Shared by authed + guest menus. */
export const EXPLORE_SHORTCUTS: Array<ExploreShortcut> = [
    {
        id: "ai",
        icon: <RobotIcon className="size-5" aria-hidden focusable="false" />,
        labelKey: "profileMenu.explore.ai",
        path: () => pathConfig().locale().ai().build(),
        authGated: true,
    },
]
