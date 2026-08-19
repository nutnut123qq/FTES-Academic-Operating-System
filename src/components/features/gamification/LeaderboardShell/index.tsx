"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FireIcon, StarIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { useQueryMyGamificationSwr } from "../hooks/useQueryMyGamificationSwr"
import { badgeKindIcon } from "../badgeIcon"
import { useBadgeLabel } from "../useBadgeLabel"
import { StreakPopover } from "../StreakPopover"
import { GamificationEventHost } from "../GamificationEventHost"
import { SeasonBoards } from "../SeasonBoards"

/**
 * Gamification leaderboard + progression surface (§11) — the `/leaderboard` page.
 *
 * A dashboard driven by the live REST snapshots (`useQueryMyGamificationSwr`
 * composes the `/me/*` progression / streak / activity / badge endpoints): stat
 * cards (XP · Level · Streak · Rank+tier) where the Streak card opens the detail
 * popover; a "Cách tính điểm" guide link; the season boards
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
 * ★ THẺ "HẠNG" DÙNG CHUNG MỘT NGUỒN VỚI NAVBAR VÀ TRANG HỒ SƠ
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

    // Guide is a child route of /leaderboard. pathConfig has no dedicated
    // builder for it (shared file, owned elsewhere); derive it from the
    // leaderboard base rather than hand-templating the whole path. The base is
    // built LOCALE-LESS (`.locale()` with no argument) because the `Link` below
    // is the locale-aware one from `@/i18n/navigation` and adds the prefix itself.
    const guideHref = `${pathConfig().locale().leaderboard().build()}/guide`

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

            {/* Chuỗi ngày: giữ đường vào popover chi tiết, nhưng là MỘT DÒNG chứ không phải
                một thẻ to. Bốn thẻ cũ (XP · Cấp · Chuỗi · Hạng) đã gỡ: ba trong bốn con số đó
                lặp lại đúng thứ dải mùa giải đang nói, và thẻ "Hạng" còn mâu thuẫn ra mặt —
                nó đọc hạng TOÀN SÀN nên hiện "—" ngay cạnh dải ghi "#5" của kỳ. Hai con số
                cùng tên mà khác nhau thì người dùng đọc thành "hệ thống tính sai". */}
            <div className="flex items-center gap-2">
                <StreakPopover placement="bottom start" className="text-left">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label={t("streak.openDetail")}
                    >
                        <FireIcon className="size-4" aria-hidden focusable="false" />
                        <span>{t("stats.streak")}: {my ? my.streak.current : "—"}</span>
                    </button>
                </StreakPopover>
            </div>

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
                        {my.badges.map((badge) => {
                            // Same fallback the profile badge catalog uses — one shared
                            // mapping (`badgeKindIcon`), so a badge without artwork can
                            // never read as a trophy here and a medal there.
                            const Icon = badgeKindIcon(badge.kind)
                            return (
                                <div
                                    key={badge.id}
                                    className="flex flex-col items-center gap-2 rounded-2xl bg-default/40 p-4"
                                >
                                    {badge.iconUrl ? (
                                        // Plain <img>: the icon host is whatever the backend
                                        // seeded, so it cannot be pinned in the next/image
                                        // remote-pattern allowlist. Decorative — the label
                                        // right below already names the badge.
                                        <img
                                            src={badge.iconUrl}
                                            alt=""
                                            aria-hidden
                                            className="size-6 object-contain"
                                        />
                                    ) : (
                                        <Icon
                                            className="size-6 text-accent"
                                            weight="fill"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    )}
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
