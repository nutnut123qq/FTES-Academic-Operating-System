import React from "react"
import {
    CalendarIcon,
    FolderIcon,
    GearIcon,
    GraduationCapIcon,
    ShieldCheckIcon,
    SquaresFourIcon,
    UsersIcon,
    UsersThreeIcon,
    WrenchIcon,
} from "@phosphor-icons/react"
import type { StatusChipTone } from "@/components/blocks/chips/StatusChip"
import type { AdminSection, ContentStatus, ReportTarget, UserStatus } from "@/resources/constants/admin"

/** Per-section route + nav icon. Labels live at `admin.shell.sections.<key>`. */
export const ADMIN_SECTION_META: Record<AdminSection, { href: string; icon: React.ReactNode }> = {
    dashboard: { href: "/admin", icon: <SquaresFourIcon className="size-5" aria-hidden focusable="false" /> },
    users: { href: "/admin/users", icon: <UsersIcon className="size-5" aria-hidden focusable="false" /> },
    moderation: { href: "/admin/moderation", icon: <ShieldCheckIcon className="size-5" aria-hidden focusable="false" /> },
    courses: { href: "/admin/courses", icon: <GraduationCapIcon className="size-5" aria-hidden focusable="false" /> },
    resources: { href: "/admin/resources", icon: <FolderIcon className="size-5" aria-hidden focusable="false" /> },
    communities: { href: "/admin/communities", icon: <UsersThreeIcon className="size-5" aria-hidden focusable="false" /> },
    events: { href: "/admin/events", icon: <CalendarIcon className="size-5" aria-hidden focusable="false" /> },
    roles: { href: "/admin/roles", icon: <ShieldCheckIcon className="size-5" aria-hidden focusable="false" /> },
    // tools has no index route — link to the first tool page
    tools: { href: "/admin/tools/upload-video", icon: <WrenchIcon className="size-5" aria-hidden focusable="false" /> },
    config: { href: "/admin/config", icon: <GearIcon className="size-5" aria-hidden focusable="false" /> },
}

/** Nav clusters (labels at `admin.shell.groups.<key>`); rendered filtered by role access. */
export const ADMIN_NAV_GROUPS: Array<{ key: "operate" | "content" | "system"; sections: Array<AdminSection> }> = [
    { key: "operate", sections: ["dashboard", "users", "moderation"] },
    { key: "content", sections: ["courses", "resources", "communities", "events"] },
    { key: "system", sections: ["roles", "tools", "config"] },
]

/** StatusChip tone per user standing. */
export const USER_STATUS_TONE: Record<UserStatus, StatusChipTone> = {
    active: "success",
    suspended: "warning",
    banned: "danger",
}

/** StatusChip tone per CMS publication status. */
export const CMS_STATUS_TONE: Record<ContentStatus, StatusChipTone> = {
    draft: "neutral",
    published: "success",
    archived: "warning",
}

/** StatusChip tone per report target type (visual grouping only). */
export const REPORT_TARGET_TONE: Record<ReportTarget, StatusChipTone> = {
    post: "accent",
    comment: "neutral",
    resource: "warning",
}

/** Maps the layout segment under `/admin` to its console section (null = dashboard). */
export const segmentToSection = (segment: string | null): AdminSection => {
    const bySegment: Record<string, AdminSection> = {
        users: "users",
        moderation: "moderation",
        courses: "courses",
        resources: "resources",
        communities: "communities",
        events: "events",
        roles: "roles",
        tools: "tools",
        config: "config",
    }
    return segment ? bySegment[segment] ?? "dashboard" : "dashboard"
}
