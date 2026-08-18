"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { FireIcon, LightningIcon, RankingIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { formatXpShort } from "@/utils/xp-format"
import { useQueryMyGamificationSwr } from "../hooks/useQueryMyGamificationSwr"
import { tierFromXp } from "../leaderboardTiers"
import { useBadgeLabel } from "../useBadgeLabel"
import { StreakPopover } from "../StreakPopover"
import { GoalsCard } from "../GoalsCard"
import { GamificationEventHost } from "../GamificationEventHost"
import { SeasonBoards } from "../SeasonBoards"

/**
 * Gamification leaderboard + progression surface (§11) — the `/leaderboard` page.
 *
 * A dashboard driven by the live REST snapshots (`useQueryMyGamificationSwr`
 * composes the `/me/*` progression / streak / activity / badge endpoints): stat
 * cards (XP · Level · Streak · Rank+tier) where the Streak card opens the detail
 * popover; a "Cách tính điểm" guide link; the season boards
 * ({@link SeasonBoards}); the
 * Daily/Weekly goals block; and the viewer's earned badges. Quest-completion toasts
 * and the level-up moment are raised by the mounted {@link GamificationEventHost},
 * which diffs the same SWR caches. Guests see the public boards with dashed viewer
 * stats (no `/me/*` call fires). Every number is real backend data.
 *
 * ★ BẢNG CŨ ĐÃ ĐƯỢC THAY, KHÔNG PHẢI THÊM VÀO. Bảng phẳng `leaderboard(scope: GLOBAL)`
 * trước đây chính là "EXP mùa, gộp mọi nguồn" — tức là bảng TỔNG, chỉ thiếu phần chia
 * theo kì và phần tách nguồn. Giữ cả hai sẽ có hai bảng cùng tên "Bảng xếp hạng" trên
 * một trang mà số không khớp nhau. Hook cũ (`useQueryLeaderboardSwr`) VẪN CÒN vì thẻ
 * cộng đồng ở dashboard dùng nó.
 *
 * ★ THẺ "HẠNG" DÙNG CHUNG MỘT NGUỒN VỚI NAVBAR VÀ TRANG HỒ SƠ
 * (`useQueryMyGamificationSwr`). Đừng đổi riêng chỗ này sang `myRank` của bảng theo KỲ:
 * chip "#7" ở menu tài khoản điều hướng thẳng tới đúng trang này, nên hai con số cùng
 * tên "Hạng" mà khác nguồn (toàn sàn vs theo kỳ) sẽ đọc thành "hệ thống tính sai".
 * Hạng THEO KỲ vẫn có — nó nằm trong chính khối {@link SeasonBoards} bên dưới, ngay
 * cạnh cái bảng sinh ra nó, nơi câu chữ nói rõ nó là hạng của kỳ nào.
 */
export const LeaderboardShell = () => {
    const t = useTranslations("gamification")
    const locale = useLocale()
    const { data: my } = useQueryMyGamificationSwr()
    const badgeLabel = useBadgeLabel()

    const { tier } = tierFromXp(my?.xp ?? 0)
    // XP still needed to reach the next level — the BE exposes only the next
    // threshold, so this is `nextThreshold − total` (0 while there is no snapshot).
    const toNext = my ? my.levelProgress.nextThreshold - my.levelProgress.current : 0
    // Guide is a child route of /leaderboard. pathConfig has no dedicated
    // builder for it (shared file, owned elsewhere); derive it from the
    // leaderboard base rather than hand-templating the whole path. The base is
    // built LOCALE-LESS (`.locale()` with no argument) because the `Link` below
    // is the locale-aware one from `@/i18n/navigation` and adds the prefix itself.
    const guideHref = `${pathConfig().locale().leaderboard().build()}/guide`

    // Viewer stats come from the composed snapshot; `null` (no snapshot yet /
    // guest) renders as an em-dash instead of a misleading zero.
    const stats: Array<{ key: "xp" | "level" | "streak" | "rank"; icon: React.ReactNode; value: number | null; hint: string | undefined; short?: boolean }> = [
        {
            key: "xp",
            icon: <LightningIcon className="size-5" aria-hidden focusable="false" />,
            value: my ? my.xp : null,
            hint: undefined,
            /** XP là con số duy nhất ở đây đủ lớn để cần rút gọn (thang đã nâng 166 lần). */
            short: true,
        },
        {
            key: "level",
            icon: <StarIcon className="size-5" aria-hidden focusable="false" />,
            value: my ? my.level : null,
            hint: my ? t("levelHint", { xp: toNext.toLocaleString(locale) }) : undefined,
        },
        {
            key: "streak",
            icon: <FireIcon className="size-5" aria-hidden focusable="false" />,
            value: my ? my.streak.current : null,
            hint: undefined,
        },
        {
            key: "rank",
            // CÙNG nguồn với chip hạng ở navbar và ở trang hồ sơ. `position` bằng 0 nghĩa
            // là người xem không nằm trong bảng đang tải về → hiện "—", KHÔNG hiện 0.
            icon: <RankingIcon className="size-5" aria-hidden focusable="false" />,
            value: my ? my.rank.position : null,
            hint: my ? t(`tiers.${tier.key}`) : undefined,
        },
    ]

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <GamificationEventHost />

            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0">
                    <Typography type="h4" weight="bold">
                        {t("title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("subtitle")}
                    </Typography>
                </div>
                <Link
                    href={guideHref}
                    className="shrink-0 text-sm font-medium text-accent no-underline hover:underline"
                >
                    {t("guide.link")}
                </Link>
            </div>

            {/* stat cards — the Streak card opens the detail popover */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                    // The streak card is clickable (opens the detail popover) → it
                    // gets the house interactive hover; the other three are static.
                    const interactive = stat.key === "streak"
                    const card = (
                        <div
                            className={`flex h-full flex-col gap-2 rounded-2xl bg-default/40 p-4 text-left ${
                                interactive ? "transition-colors group-hover:bg-default/60" : ""
                            }`}
                        >
                            <div className="flex items-center gap-2 text-muted">
                                {stat.icon}
                                <Typography type="body-xs" color="muted">
                                    {t(`stats.${stat.key}`)}
                                </Typography>
                            </div>
                            <Typography type="h5" weight="bold">
                                {/* Rank rides the real BE board — show "—" when the viewer is
                                    unranked (board empty/unseeded) or has no snapshot, not "0". */}
                                {stat.value == null || (stat.key === "rank" && stat.value < 1)
                                    ? "—"
                                    : stat.short
                                        ? formatXpShort(stat.value)
                                        : Math.round(stat.value).toLocaleString(locale)}
                            </Typography>
                            {stat.hint ? (
                                <Typography type="body-xs" color="muted">
                                    {stat.hint}
                                </Typography>
                            ) : null}
                        </div>
                    )
                    if (interactive) {
                        return (
                            <StreakPopover key={stat.key} placement="bottom start" className="text-left">
                                <button
                                    type="button"
                                    className="group h-full w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                    aria-label={t("streak.openDetail")}
                                >
                                    {card}
                                </button>
                            </StreakPopover>
                        )
                    }
                    return <React.Fragment key={stat.key}>{card}</React.Fragment>
                })}
            </div>

            {/* goals */}
            <GoalsCard />

            {/* Bảng xếp hạng theo kỳ (tổng · cộng đồng+workplace) */}
            <SeasonBoards />

            {/* badges row — the viewer's earned badges from the real snapshot */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <StarIcon className="size-5 text-accent" aria-hidden focusable="false" />
                    <Typography type="body" weight="medium">
                        {t("badges")}
                    </Typography>
                </div>
                {my && my.badges.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {my.badges.map((badge) => (
                            <div
                                key={badge.id}
                                className="flex flex-col items-center gap-2 rounded-2xl bg-default/40 p-4"
                            >
                                <TrophyIcon
                                    className="size-6 text-accent"
                                    weight="fill"
                                    aria-hidden
                                    focusable="false"
                                />
                                <Typography type="body-xs" weight="medium" className="text-center">
                                    {/* BE seed badge mới lúc nào không báo → thiếu bản dịch là
                                        lộ nguyên đường key ra mặt người dùng. Rơi về tên BE trả. */}
                                    {badgeLabel(badge.badgeKey, badge.fallbackName)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Typography type="body-sm" color="muted">
                        {t("badgesEmpty")}
                    </Typography>
                )}
            </div>
        </div>
    )
}
