"use client"

import React from "react"
import { Typography } from "@heroui/react"
import {
    BookmarkSimpleIcon,
    CalendarIcon,
    ChartBarIcon,
    NewspaperIcon,
    ShieldCheckIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useHasPermission } from "@/hooks/useHasPermission"

/** Shared look for one rail row (icon + label). */
const ROW_CLASS =
    "flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground no-underline transition-colors hover:bg-default/40"

/**
 * Left community rail (`xl`+): shortcut rows for the actions hidden behind the
 * ⋯ menu on smaller screens — Nhóm, Sự kiện, Blog, Đã lưu, Bình chọn, Kiểm duyệt.
 * ponytail: plain rows in the community panel idiom; no data.
 *
 * Blog moved here (2026-08-19) when Leaderboard took its slot in the header nav:
 * editorial posts are a reading surface of the community, not a top-level module.
 */
export const NavRail = () => {
    const t = useTranslations("communityHub")
    // Moderation is a role-restricted queue: a viewer without `community.moderate`
    // only ever gets a "restricted" empty state on the page, so the shortcut is not
    // shown at all (the CommunityModeration page keeps a fallback for direct-URL
    // access). Same permission the CommunityModeration page gates its fetch on.
    const canModerate = useHasPermission("community.moderate")

    return (
        <nav
            aria-label={t("title")}
            className="flex flex-col rounded-3xl border border-separator bg-surface p-2"
        >
            <Link href="/groups" className={ROW_CLASS}>
                <UsersThreeIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.groups")}</Typography>
            </Link>
            {/* Danh sách này ĐỘC LẬP với `MENU_ITEMS` của `CommunityShell` (dropdown ⋯ dưới xl):
                thêm lối tắt mới phải sửa cả hai chỗ mới đủ mọi breakpoint. */}
            <Link href="/events" className={ROW_CLASS}>
                <CalendarIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.events")}</Typography>
            </Link>
            <Link href="/blog" className={ROW_CLASS}>
                <NewspaperIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.blog")}</Typography>
            </Link>
            <Link href="/community/saved" className={ROW_CLASS}>
                <BookmarkSimpleIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.saved")}</Typography>
            </Link>
            <Link href="/community/poll" className={ROW_CLASS}>
                <ChartBarIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.poll")}</Typography>
            </Link>
            {canModerate ? (
                <Link href="/community/moderation" className={ROW_CLASS}>
                    <ShieldCheckIcon aria-hidden focusable="false" className="size-5" />
                    <Typography type="body-sm">{t("menu.moderation")}</Typography>
                </Link>
            ) : null}
        </nav>
    )
}
