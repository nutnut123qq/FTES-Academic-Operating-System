"use client"

import React from "react"
import { Chip, Skeleton, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircleIcon, LockSimpleIcon, TimerIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useAppSelector } from "@/redux/hooks"
import type { AvatarFrameLadderItemView } from "@/modules/api/rest/gamification"
import { useQueryAvatarFrameLadderSwr } from "../hooks/useQueryAvatarFrameLadderSwr"
import { useBoardFailureContent } from "../SeasonBoards/useBoardFailureContent"
import { FrameAvatar } from "./FrameAvatar"
import {
    frameProgress,
    isFrameExpired,
    lifetimeFrames,
    nextLifetimeFrame,
    seasonTopFrames,
    wornFrame,
} from "./model"

/** Ngày ngắn theo locale; chuỗi hỏng ⇒ null (không in "Invalid Date"). */
const shortDate = (value: string, locale: string): string | null => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
}

const LadderSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-20 w-full rounded-2xl" />
        ))}
    </div>
)

/**
 * Thang khung avatar: khung ĐANG ĐEO + các bậc kế tiếp + điều kiện mở từng bậc.
 *
 * Hai nhóm được tách hẳn ra vì luật của chúng khác nhau:
 *  - bậc mở bằng EXP TRỌN ĐỜI thì giữ vĩnh viễn (mất khung khi sang kì mới là phạt
 *    người dùng vì thời gian trôi — họ không làm gì sai),
 *  - khung TOP MÙA có hạn, hết kì sau là mất, và phải giành lại.
 *
 * Bậc chưa mở hiện XÁM kèm mốc — dùng lại đúng idiom badge chưa đạt ở
 * `BadgeCatalogRow`: xám hoá phần DANH TÍNH của khung (hình + tên) nhưng KHÔNG xám
 * dòng "cần bao nhiêu EXP", vì đó chính là thứ người ta vào đây để đọc.
 */
export const AvatarFrameLadder = () => {
    const t = useTranslations("gamification.frames")
    const locale = useLocale()
    const failureContent = useBoardFailureContent()
    const viewer = useAppSelector((state) => state.user.user)

    const { ladder, items, lifetimeXp, isGuest, isLoading, error, mutate } =
        useQueryAvatarFrameLadderSwr()

    const failure = failureContent(error, "GET /gamification/me/avatar-frames", () => void mutate())
    const worn = wornFrame(ladder)
    const next = nextLifetimeFrame(items, lifetimeXp)

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-0">
                <Typography type="h5" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {isGuest ? (
                // Khách chưa đăng nhập: không tải gì cả. Không phải lỗi, cũng không phải
                // rỗng — nói đúng việc phải làm thay vì hiện danh sách trống.
                <Typography type="body-sm" color="muted">
                    {t("guest")}
                </Typography>
            ) : (
                <AsyncContent
                    isLoading={isLoading && items.length === 0}
                    skeleton={<LadderSkeleton />}
                    isEmpty={items.length === 0}
                    emptyContent={{ title: t("empty"), description: t("emptyHint") }}
                    error={failure ? error : undefined}
                    errorContent={failure ?? undefined}
                >
                    <div className="flex flex-col gap-6">
                        {/* Khung đang đeo + bậc kế tiếp */}
                        <div className="flex items-center gap-4 rounded-2xl bg-default/40 p-4">
                            <FrameAvatar
                                username={viewer?.displayName ?? viewer?.username ?? null}
                                avatar={viewer?.avatar ?? null}
                                seed={viewer?.id ?? null}
                                size="lg"
                                frame={worn}
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <Typography type="body-xs" color="muted">
                                    {t("worn")}
                                </Typography>
                                <Typography type="body" weight="semibold">
                                    {worn?.nameVi ?? t("wornNone")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("lifetimeXp", { xp: lifetimeXp.toLocaleString(locale) })}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {next
                                        ? t("next", {
                                            name: next.frame.nameVi,
                                            xp: next.remainingXp.toLocaleString(locale),
                                        })
                                        : t("maxed")}
                                </Typography>
                            </div>
                        </div>

                        <FrameGroup
                            title={t("lifetimeSection")}
                            frames={lifetimeFrames(items)}
                            lifetimeXp={lifetimeXp}
                        />
                        <FrameGroup
                            title={t("seasonSection")}
                            frames={seasonTopFrames(items)}
                            lifetimeXp={lifetimeXp}
                        />
                    </div>
                </AsyncContent>
            )}
        </section>
    )
}

/** Một nhóm khung (trọn đời / top mùa). Nhóm rỗng thì tự ẩn, không để tiêu đề trơ. */
const FrameGroup = ({
    title,
    frames,
    lifetimeXp,
}: {
    title: string
    frames: Array<AvatarFrameLadderItemView>
    lifetimeXp: number
}) => {
    if (frames.length === 0) {
        return null
    }
    return (
        <div className="flex flex-col gap-3">
            <Typography type="body-sm" weight="medium">
                {title}
            </Typography>
            <ul className="flex flex-col gap-2">
                {frames.map((frame) => (
                    <FrameRow key={frame.code} frame={frame} lifetimeXp={lifetimeXp} />
                ))}
            </ul>
        </div>
    )
}

/** Một bậc khung: hình khung, tên, điều kiện mở, tiến độ (nếu đo được), hạn dùng. */
const FrameRow = ({
    frame,
    lifetimeXp,
}: {
    frame: AvatarFrameLadderItemView
    lifetimeXp: number
}) => {
    const t = useTranslations("gamification.frames")
    const tBoards = useTranslations("gamification.seasonBoards.tabs")
    const locale = useLocale()

    const expired = isFrameExpired(frame, new Date())
    // Khung top mùa hết hạn = KHÔNG còn đeo được nữa; đọc như chưa mở về mặt hình ảnh,
    // nhưng chip nói rõ "đã hết hạn" chứ không giả vờ là chưa từng giành được.
    const active = frame.unlocked && !expired
    const progress = frameProgress(frame, lifetimeXp)
    const expiresLabel = frame.expiresAt ? shortDate(frame.expiresAt, locale) : null

    const requirement =
        frame.kind === "LIFETIME"
            ? t("requirement", { xp: (frame.requiredXp ?? 0).toLocaleString(locale) })
            : t("seasonRequirement", {
                rank: frame.topRank ?? 1,
                board: frame.board ? tBoards(frame.board) : "—",
            })

    return (
        <li
            data-testid={`frame-row-${frame.code}`}
            data-unlocked={active ? "true" : "false"}
            className={cn(
                "flex items-start gap-3 rounded-2xl border p-4",
                active ? "border-separator bg-surface" : "border-dashed border-separator",
            )}
        >
            {/* Xám hoá DANH TÍNH khung (hình + tên) khi chưa mở — không xám dòng điều kiện. */}
            <FrameAvatar
                username={frame.nameVi}
                avatar={null}
                seed={frame.code}
                size="md"
                frame={frame}
                dimmed={!active}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start gap-2">
                    <Typography
                        type="body-sm"
                        weight="medium"
                        color={active ? undefined : "muted"}
                        className="min-w-0 flex-1"
                    >
                        {frame.nameVi}
                    </Typography>
                    <Chip
                        size="sm"
                        variant="soft"
                        color={active ? "success" : "default"}
                        className="shrink-0"
                    >
                        {active ? (
                            <CheckCircleIcon
                                className="size-3.5"
                                weight="fill"
                                aria-hidden
                                focusable="false"
                            />
                        ) : (
                            <LockSimpleIcon className="size-3.5" aria-hidden focusable="false" />
                        )}
                        {expired ? t("expiredChip") : active ? t("unlocked") : t("locked")}
                    </Chip>
                </div>

                <Typography type="body-xs" color="muted">
                    {/* Chưa mở ⇒ nói thẳng đây LÀ điều kiện mở; đã mở ⇒ vẫn là câu mô tả cũ. */}
                    {active ? requirement : t("howToUnlock", { how: requirement })}
                </Typography>

                {frame.description ? (
                    <Typography type="body-xs" color="muted">
                        {frame.description}
                    </Typography>
                ) : null}

                {/* Thanh tiến độ CHỈ khi bậc đo được bằng EXP và chưa mở (khung top mùa
                    không có mốc nào để tiến tới — vẽ thanh ở đó là hứa sai). */}
                {!active && progress ? (
                    <ProgressMeter
                        className="mt-1"
                        value={progress.value}
                        max={progress.max}
                        label={t("progress", {
                            current: progress.value.toLocaleString(locale),
                            total: progress.max.toLocaleString(locale),
                        })}
                        aria-label={frame.nameVi}
                    />
                ) : null}

                <div className="flex items-center gap-1">
                    <TimerIcon className="size-3.5 text-muted" aria-hidden focusable="false" />
                    <Typography type="body-xs" color="muted">
                        {expiresLabel ? t("expiresOn", { date: expiresLabel }) : t("permanent")}
                    </Typography>
                </div>
            </div>
        </li>
    )
}
