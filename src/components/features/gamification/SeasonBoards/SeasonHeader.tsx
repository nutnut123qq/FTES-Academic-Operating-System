"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CalendarBlankIcon } from "@phosphor-icons/react"

/** Props for {@link SeasonHeader}. */
export interface SeasonHeaderProps {
    /** Mã kỳ backend đã đọc (`seasonCode`); `null` = không có kỳ nào đang chạy. */
    seasonCode: string | null
    /** `true` khi backend trả cờ `NO_SEASON` — khác hẳn "chưa tải xong". */
    noSeason: boolean
}

/**
 * Dải "đang là kỳ nào" đứng trên bảng.
 *
 * VÌ SAO bắt buộc phải có: bảng reset theo kỳ. Một con số thứ hạng không nói rõ nó
 * thuộc kỳ nào là con số vô nghĩa — người dùng sẽ tưởng hệ thống mất dữ liệu vào đúng
 * cái ngày nó reset.
 *
 * ★ Dữ liệu kỳ lấy TỪ CHÍNH phản hồi bảng (`seasonCode` / cờ `NO_SEASON`), không gọi
 * thêm endpoint nào. Backend không mở endpoint "kỳ đang chạy" cho người học
 * (`/gamification/admin/seasons` là admin-only), nên header này KHÔNG được đi hỏi một
 * đường dẫn không tồn tại rồi hiện lỗi trên một bảng đang chạy tốt.
 *
 * KHÔNG có đếm ngược: contract bảng không mang `startsAt`/`endsAt`. Đếm ngược bịa từ
 * dữ liệu không có là đúng thứ "nói một mốc thời gian không ai bảo đảm".
 */
export const SeasonHeader = ({ seasonCode, noSeason }: SeasonHeaderProps) => {
    const t = useTranslations("gamification.seasonBoards")

    if (noSeason) {
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

    if (!seasonCode) {
        // Chưa tải xong / chưa đăng nhập: im lặng. Nói "chưa có kỳ nào" ở đây là khẳng
        // định một điều mình chưa hỏi được máy chủ.
        return null
    }

    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-default/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <CalendarBlankIcon className="size-4 text-muted" aria-hidden focusable="false" />
                <Typography type="body-xs" color="muted">
                    {t("season.label")}
                </Typography>
                <Typography type="body-sm" weight="semibold">
                    {seasonCode}
                </Typography>
            </div>
            <Typography type="body-xs" color="muted">
                {t("season.resetNote")}
            </Typography>
        </div>
    )
}
