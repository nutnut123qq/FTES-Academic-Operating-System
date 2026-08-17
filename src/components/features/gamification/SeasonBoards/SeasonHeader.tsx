"use client"

import React from "react"
import { Chip, Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarBlankIcon, HourglassMediumIcon } from "@phosphor-icons/react"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import type { SeasonWindowView } from "@/modules/api/rest/gamification"
import { seasonCountdown } from "./model"
import { useBoardFailureContent } from "./useBoardFailureContent"

/** Props for {@link SeasonHeader}. */
export interface SeasonHeaderProps {
    season: SeasonWindowView | null
    isLoading: boolean
    error: unknown
    onRetry: () => void
    /** Tiêm được để test tất định; mặc định là bây giờ. */
    now?: Date
}

/** Ngày ngắn gọn theo locale; chuỗi hỏng ⇒ null (không in "Invalid Date"). */
const shortDate = (value: string, locale: string): string | null => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return null
    }
    return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
}

/**
 * Dải "đang là kì nào, còn bao lâu" đứng trên cả ba bảng.
 *
 * VÌ SAO bắt buộc phải có: cả ba bảng đều reset theo kì. Một con số thứ hạng không nói
 * rõ nó thuộc kì nào là con số vô nghĩa — người dùng không biết mình đang đua trong bao
 * lâu nữa, và không hiểu vì sao sáng mai bảng về trống.
 *
 * Ba trạng thái KHÔNG được trộn vào nhau:
 *  - lỗi tải (kể cả "máy chủ chưa có endpoint") → {@link ErrorContent} nói rõ,
 *  - tải xong nhưng KHÔNG có kì nào chạy → câu "chưa có kì nào" + lý do,
 *  - có kì → tên kì + khoảng ngày + đếm ngược.
 */
export const SeasonHeader = ({ season, isLoading, error, onRetry, now }: SeasonHeaderProps) => {
    const t = useTranslations("gamification.seasonBoards")
    const locale = useLocale()
    const failureContent = useBoardFailureContent()

    const failure = failureContent(error, "GET /gamification/seasons/current", onRetry)
    if (failure) {
        return (
            <div className="rounded-2xl border border-dashed border-separator">
                <ErrorContent {...failure} />
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2 rounded-2xl bg-default/40 p-4">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-5 w-48 rounded-full" />
                <Skeleton className="h-3 w-64 rounded-full" />
            </div>
        )
    }

    // Tải xong, không có kì nào: một trạng thái RỖNG hợp lệ, khác hẳn lỗi ở trên.
    if (!season) {
        return (
            <div className="flex flex-col gap-1 rounded-2xl bg-default/40 p-4">
                <Typography type="body-sm" weight="medium">
                    {t("season.none")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("season.noneHint")}
                </Typography>
            </div>
        )
    }

    const countdown = seasonCountdown(season, now ?? new Date())
    const startLabel = shortDate(season.startsAt, locale)
    const endLabel = shortDate(season.endsAt, locale)

    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-default/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <CalendarBlankIcon className="size-4 text-muted" aria-hidden focusable="false" />
                <Typography type="body-xs" color="muted">
                    {t("season.label")}
                </Typography>
                <Typography type="body-sm" weight="semibold">
                    {/* Kì chưa gắn tên thì rơi về MÃ mùa — không bịa một cái tên đẹp. */}
                    {season.termName ?? season.code}
                </Typography>
                {startLabel && endLabel ? (
                    <Chip size="sm" variant="soft" color="default">
                        {t("season.window", { start: startLabel, end: endLabel })}
                    </Chip>
                ) : null}
            </div>

            <div className="flex items-center gap-2">
                <HourglassMediumIcon
                    className="size-4 text-accent"
                    aria-hidden
                    focusable="false"
                />
                <Typography type="body-sm" weight="medium">
                    {/* `countdown === null` chỉ xảy ra khi endsAt hỏng — nói "đã hết hạn"
                        lúc đó là bịa, nên rơi về đúng khoảng ngày ở dòng trên. */}
                    {countdown === null
                        ? t("season.ended")
                        : countdown.ended
                            ? t("season.ended")
                            : countdown.days > 0
                                ? t("season.remaining", {
                                    days: countdown.days,
                                    hours: countdown.hours,
                                })
                                : t("season.remainingHours", { hours: countdown.hours })}
                </Typography>
            </div>

            <Typography type="body-xs" color="muted">
                {t("season.resetNote")}
            </Typography>
        </div>
    )
}
