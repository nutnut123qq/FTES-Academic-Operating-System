"use client"

import React from "react"
import { Typography } from "@heroui/react"
import {
    ChartBarIcon,
    ShieldCheckIcon,
    TrophyIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

/** Shared look for one rail row (icon + label). */
const ROW_CLASS =
    "flex items-center gap-2 rounded-large px-2 py-2 text-sm text-foreground no-underline transition-colors hover:bg-default/40"

/**
 * Left community rail (`xl`+): shortcut rows for the actions hidden behind the
 * ⋯ menu on smaller screens — Nhóm, Bảng uy tín, Bình chọn, Kiểm duyệt. ponytail: plain
 * rows in the community panel idiom; no data.
 */
export const NavRail = () => {
    const t = useTranslations("communityHub")

    return (
        <nav
            aria-label={t("title")}
            className="flex flex-col rounded-3xl border border-separator bg-surface p-2"
        >
            <Link href="/groups" className={ROW_CLASS}>
                <UsersThreeIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.groups")}</Typography>
            </Link>
            <Link href="/community/reputation" className={ROW_CLASS}>
                <TrophyIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.reputation")}</Typography>
            </Link>
            <Link href="/community/poll" className={ROW_CLASS}>
                <ChartBarIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.poll")}</Typography>
            </Link>
            <Link href="/community/moderation" className={ROW_CLASS}>
                <ShieldCheckIcon aria-hidden focusable="false" className="size-5" />
                <Typography type="body-sm">{t("menu.moderation")}</Typography>
            </Link>
        </nav>
    )
}
