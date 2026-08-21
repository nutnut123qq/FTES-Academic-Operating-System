"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { StarIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { pathConfig } from "@/resources/path"
import { formatXpShort } from "@/utils/xp-format"
import { useQueryMyGamificationSwr } from "../hooks/useQueryMyGamificationSwr"
import { AchievementArt } from "../EquippedAchievement"
import { tierFromXp } from "../leaderboardTiers"
import { useBadgeLabel } from "../useBadgeLabel"
import { GamificationEventHost } from "../GamificationEventHost"
import { SeasonBoards } from "../SeasonBoards"

/**
 * Gamification leaderboard + progression surface (§11) — the `/leaderboard` page.
 *
 * A dashboard driven by the live REST snapshots (`useQueryMyGamificationSwr`
 * composes the `/me/*` progression / badge endpoints): the viewer's total-XP rank
 * and progress to the next tier; a "Cách tính điểm" guide link; the season boards
 * ({@link SeasonBoards}); and the viewer's earned badges.
 *
 * ★ KHỐI MỤC TIÊU ĐÃ CHUYỂN sang `/profile/progress`. Nó là việc riêng của từng người
 * (đặt mục tiêu ngày/tuần cho chính mình), không liên quan tới đua hạng — mà nó chiếm
 * TÁM trong mười hai nút của trang này, đẩy bảng xếp hạng xuống dưới màn hình đầu tiên. Quest-completion toasts
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
 * ★ KHỐI "HẠNG HIỆN TẠI" DÙNG CHUNG MỘT NGUỒN VỚI NAVBAR VÀ TRANG HỒ SƠ
 * (`useQueryMyGamificationSwr`). Đừng đổi riêng chỗ này sang `myRank` của bảng theo KỲ:
 * chip "#7" ở menu tài khoản điều hướng thẳng tới đúng trang này, nên hai con số cùng
 * tên "Hạng" mà khác nguồn (toàn sàn vs theo kỳ) sẽ đọc thành "hệ thống tính sai".
 * Hạng THEO KỲ vẫn có — nó nằm trong chính khối {@link SeasonBoards} bên dưới, ngay
 * cạnh cái bảng sinh ra nó, nơi câu chữ nói rõ nó là hạng của kỳ nào.
 */
export const LeaderboardShell = () => {
    const t = useTranslations("gamification")
    const { data: my } = useQueryMyGamificationSwr()
    const badgeLabel = useBadgeLabel()
    const rankTier = my ? tierFromXp(my.xp) : null

    // Guide is a child route of /leaderboard. pathConfig has no dedicated
    // builder for it (shared file, owned elsewhere); derive it from the
    // leaderboard base rather than hand-templating the whole path. The base is
    // built LOCALE-LESS (`.locale()` with no argument) because the `Link` below
    // is the locale-aware one from `@/i18n/navigation` and adds the prefix itself.
    const guideHref = `${pathConfig().locale().leaderboard().build()}/guide`

    const rankSummary = my && rankTier ? (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <img
                        src={rankTier.tier.badgeSrc}
                        alt=""
                        aria-hidden
                        className="size-16 shrink-0 object-contain"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <Typography type="body-xs" color="muted">
                            {t("currentRank.title")}
                        </Typography>
                        <Typography type="h5" weight="bold">
                            {t(`tiers.${my.rank.league}`)}
                        </Typography>
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <Typography type="h5" weight="bold">
                        {my.rank.position > 0 ? `#${my.rank.position}` : "—"}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("currentRank.totalXp", { xp: formatXpShort(my.xp) })}
                    </Typography>
                </div>
            </div>
            {rankTier.next ? (
                <ProgressMeter
                    value={my.xp - rankTier.tier.minXp}
                    max={rankTier.next.minXp - rankTier.tier.minXp}
                    label={t("currentRank.toNext", {
                        xp: formatXpShort(rankTier.next.minXp - my.xp),
                        tier: t(`tiers.${rankTier.next.key}`),
                    })}
                    aria-label={t("currentRank.progressAria", {
                        tier: t(`tiers.${rankTier.next.key}`),
                    })}
                />
            ) : (
                <Typography type="body-xs" color="muted">
                    {t("currentRank.topTier")}
                </Typography>
            )}
        </div>
    ) : null

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

            {/* Tổng rank + kỳ đang xem nằm chung một thẻ; SeasonBoards owns the selected
                season/scope, so the season half always follows the controls below. */}
            <SeasonBoards rankSummary={rankSummary} />

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
                        {my.badges.map((badge) => {
                            return (
                                <div
                                    key={badge.id}
                                    className="flex flex-col items-center gap-2 rounded-2xl bg-default/40 p-4"
                                >
                                    <AchievementArt
                                        achievement={{
                                            code: badge.badgeKey,
                                            name: badge.fallbackName,
                                            kind: badge.kind,
                                            iconUrl: badge.iconUrl,
                                        }}
                                        className="size-12"
                                    />
                                    <Typography type="body-xs" weight="medium" className="text-center">
                                        {/* BE seed badge mới lúc nào không báo → thiếu bản dịch là
                                            lộ nguyên đường key ra mặt người dùng. Rơi về tên BE trả. */}
                                        {badgeLabel(badge.badgeKey, badge.fallbackName)}
                                    </Typography>
                                </div>
                            )
                        })}
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
