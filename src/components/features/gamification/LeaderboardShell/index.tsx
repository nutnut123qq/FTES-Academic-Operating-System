"use client"

import React from "react"
import { Button, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { StarIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useAppSelector } from "@/redux/hooks"
import { pathConfig } from "@/resources/path"
import { formatXpShort } from "@/utils/xp-format"
import { useQueryMyGamificationSwr } from "../hooks/useQueryMyGamificationSwr"
import { AchievementArt } from "../EquippedAchievement"
import { RANK_TIERS, tierFromXp } from "../leaderboardTiers"
import { useBadgeLabel } from "../useBadgeLabel"
import { GamificationEventHost } from "../GamificationEventHost"
import { SeasonBoards } from "../SeasonBoards"
import { RankTiersModal } from "./RankTiersModal"

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
    const { data: my, isLoading, mutate } = useQueryMyGamificationSwr()
    /**
     * "Phiên đã ngã ngũ chưa" — cờ do `authReady()` bật (xem `@/modules/auth/auth-ready`).
     * BẮT BUỘC phải đọc cờ này chứ không suy từ `my == null`: redux KHÔNG persist, nên
     * `authenticated` là `false` ở MỌI lần tải trang kể cả với người đang đăng nhập, và
     * suốt hai chặng mạng nối tiếp (`me` → `/profiles/me`) `false` có nghĩa "chưa biết",
     * không phải "khách".
     */
    const sessionSettled = useAppSelector((state) => state.keycloak.initialized)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const badgeLabel = useBadgeLabel()
    const rankTier = my ? tierFromXp(my.xp) : null
    const [tiersOpen, setTiersOpen] = React.useState(false)

    // Guide is a child route of /leaderboard. pathConfig has no dedicated
    // builder for it (shared file, owned elsewhere); derive it from the
    // leaderboard base rather than hand-templating the whole path. The base is
    // built LOCALE-LESS (`.locale()` with no argument) because the `Link` below
    // is the locale-aware one from `@/i18n/navigation` and adds the prefix itself.
    const guideHref = `${pathConfig().locale().leaderboard().build()}/guide`

    // CÁI HUY HIỆU LÀ MỘT CÁI NÚT, không phải `div` gắn `onClick`: bấm vào nó mở thang hạng
    // của cả hệ thống ({@link RankTiersModal}). `<button>` thật để đi được bằng Tab/Enter và
    // có vòng focus; ảnh vẫn `alt=""`/`aria-hidden` vì tên hành động nằm ở `aria-label` của
    // nút — để nguyên `alt` sẽ đọc thành hai thứ cho cùng một điểm dừng.
    const rankBadgeButton = (
        <button
            type="button"
            onClick={() => setTiersOpen(true)}
            aria-label={t("rankTiers.openAria")}
            className="shrink-0 rounded-2xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent"
        >
            <img
                src={(rankTier?.tier ?? RANK_TIERS[0]).badgeSrc}
                alt=""
                aria-hidden
                className={cn("size-16 object-contain", !rankTier && "opacity-60 grayscale")}
            />
        </button>
    )

    /**
     * Khung của BA trạng thái chưa-có-hạng. Huy hiệu vẫn render ở cả ba (thang hạng là
     * thông tin công khai, và huy hiệu là lối vào duy nhất người dùng biết để bấm); chỉ
     * phần chữ đổi theo trạng thái.
     *
     * @param body - dòng chữ mô tả đúng trạng thái đang xảy ra.
     */
    const rankPlaceholder = (body: React.ReactNode) => (
        <div className="flex min-w-0 items-center gap-3">
            {rankBadgeButton}
            <div className="flex min-w-0 flex-col gap-0.5">
                <Typography type="body-xs" color="muted">
                    {t("rankTiers.title")}
                </Typography>
                {body}
            </div>
        </div>
    )

    const rankSummary = my && rankTier ? (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    {rankBadgeButton}
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
    ) : !sessionSettled || isLoading ? (
        // CHƯA BIẾT. Phiên chưa ngã ngũ, hoặc `/me/progression` còn đang bay. Không được
        // nói gì về hạng — kể cả câu mời đăng nhập, vì ca này gồm CẢ người đang đăng nhập
        // (mọi lần tải trang đều đi qua đây). Khung xương là câu nói đúng duy nhất.
        rankPlaceholder(<Skeleton.Typography type="body-sm" className="w-40" />)
    ) : !authenticated ? (
        // KHÁCH — đã ngã ngũ và không có ai đăng nhập. Đây là ca DUY NHẤT lời mời đăng
        // nhập nói đúng sự thật.
        rankPlaceholder(
            <Typography type="body-sm" weight="medium">
                {t("rankTiers.guestHint")}
            </Typography>,
        )
    ) : (
        // ĐÃ ĐĂNG NHẬP nhưng không đọc được hạng (`/me/progression` lỗi, hoặc trả rỗng).
        // Trước đây ca này rơi chung vào `rankTiers.guestHint` nên người đang đăng nhập bị
        // nói là chưa đăng nhập — vĩnh viễn, ngay bên trên bảng theo kỳ vẫn in `#hạng` của
        // chính họ. Nói đúng chuyện đang xảy ra + cho một lối thử lại.
        rankPlaceholder(
            <div className="flex min-w-0 flex-col items-start gap-1">
                <Typography type="body-sm" weight="medium">
                    {t("currentRank.unavailable")}
                </Typography>
                <Button variant="tertiary" size="sm" onPress={() => void mutate()}>
                    {t("currentRank.retry")}
                </Button>
            </div>,
        )
    )

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <GamificationEventHost />

            {/* `my?.xp ?? null` — `null` là "chưa biết", KHÁC 0 EXP; thang hạng phân biệt
                hai thứ đó (xem doc-comment của {@link RankTiersModal}). */}
            <RankTiersModal
                isOpen={tiersOpen}
                onClose={() => setTiersOpen(false)}
                viewerXp={my?.xp ?? null}
            />

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
