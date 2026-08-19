"use client"

import React from "react"
import { Typography } from "@heroui/react"
import {
    BookmarkSimpleIcon,
    CalendarIcon,
    ChartBarIcon,
    HouseIcon,
    NewspaperIcon,
    ShieldCheckIcon,
    UsersThreeIcon,
    type Icon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { useHasPermission } from "@/hooks/useHasPermission"

/** Shared look for one rail row (icon + label). */
const ROW_CLASS =
    "flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground no-underline transition-colors hover:bg-default/40"

/** Rail rows: i18n key under `communityHub.menu.*` + absolute href + icon. */
const ROWS: Array<{ key: string; href: string; icon: Icon; moderatorOnly?: boolean }> = [
    { key: "feed", href: "/community", icon: HouseIcon },
    { key: "groups", href: "/groups", icon: UsersThreeIcon },
    { key: "events", href: "/events", icon: CalendarIcon },
    { key: "blog", href: "/blog", icon: NewspaperIcon },
    { key: "saved", href: "/community/saved", icon: BookmarkSimpleIcon },
    { key: "poll", href: "/community/poll", icon: ChartBarIcon },
    // Moderation is a role-restricted queue: a viewer without `community.moderate`
    // only ever gets a "restricted" empty state on the page, so the shortcut is not
    // shown at all (the CommunityModeration page keeps a fallback for direct-URL
    // access). Same permission the CommunityModeration page gates its fetch on.
    { key: "moderation", href: "/community/moderation", icon: ShieldCheckIcon, moderatorOnly: true },
]

/**
 * Left community rail (`xl`+): shortcut rows for the actions hidden behind the
 * ⋯ menu on smaller screens — Cộng đồng, Nhóm, Sự kiện, Blog, Đã lưu, Bình chọn,
 * Kiểm duyệt. ponytail: plain rows in the community panel idiom; no data.
 *
 * Blog moved here (2026-08-19) when Leaderboard took its slot in the header nav:
 * editorial posts are a reading surface of the community, not a top-level module.
 *
 * Góp ý #21: rail giờ được dùng bởi CẢ `/community/**` lẫn `/groups`, `/events`,
 * `/blog` (qua {@link CommunityNavShell}), nên nó phải trả lời được "tôi đang ở
 * đâu" — thiếu trạng thái active thì rail chỉ là danh sách link, đứng ở đâu cũng
 * như nhau. Và phải có lối về chính bảng tin (`/community`): trước đây rail liệt
 * kê mọi đích ĐI mà không có đường VỀ, nên từ /groups chỉ còn nút "<" của trình
 * duyệt.
 */
export const NavRail = () => {
    const t = useTranslations("communityHub")
    const pathname = usePathname()
    const canModerate = useHasPermission("community.moderate")

    const rows = canModerate ? ROWS : ROWS.filter((row) => !row.moderatorOnly)
    // Đích DÀI NHẤT khớp mới là đích đang mở: `/community/saved` cũng bắt đầu bằng
    // `/community`, so-khớp-prefix đơn thuần sẽ sáng cả hai dòng.
    const activeHref = rows
        .filter((row) => pathname === row.href || pathname.startsWith(`${row.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href

    return (
        <nav
            aria-label={t("title")}
            className="flex flex-col rounded-3xl border border-separator bg-surface p-2"
        >
            {/* Danh sách này ĐỘC LẬP với `MENU_ITEMS` của `CommunityShell` (dropdown ⋯ dưới xl):
                thêm lối tắt mới phải sửa cả hai chỗ mới đủ mọi breakpoint. */}
            {rows.map((row) => {
                const RowIcon = row.icon
                const isActive = row.href === activeHref
                return (
                    <Link
                        key={row.key}
                        href={row.href}
                        aria-current={isActive ? "page" : undefined}
                        className={
                            isActive ? `${ROW_CLASS} bg-default/60 font-semibold` : ROW_CLASS
                        }
                    >
                        <RowIcon
                            aria-hidden
                            focusable="false"
                            className="size-5"
                            weight={isActive ? "fill" : "regular"}
                        />
                        <Typography type="body-sm">{t(`menu.${row.key}`)}</Typography>
                    </Link>
                )
            })}
        </nav>
    )
}
