"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarBlankIcon, ClockIcon, InfinityIcon } from "@phosphor-icons/react"
import { formatXpShort } from "@/utils/xp-format"
import { seasonDisplayName } from "./model"

/** Props for {@link SeasonHeader}. */
export interface SeasonHeaderProps {
    /** Mã kỳ backend đã đọc (`seasonCode`); `null` = không có kỳ nào đang chạy. */
    seasonCode: string | null
    /** Tên kỳ đọc được (V356); `null` ⇒ rơi về {@link SeasonHeaderProps.seasonCode}. */
    seasonName?: string | null
    /** Thời điểm chốt kỳ (ISO). `null` ở bảng tích luỹ — nó không bao giờ chốt. */
    endsAt?: string | null
    /** `true` = đang xem TÍCH LUỸ. */
    lifetime?: boolean
    /** `true` khi backend trả cờ `NO_SEASON` — khác hẳn "chưa tải xong". */
    noSeason: boolean
    /** Hạng người xem trong lát cắt đang hiện; `null` = chưa có hạng. */
    myRank?: number | null
    /** EXP người xem trong lát cắt đang hiện; `null` = chưa biết. */
    myXp?: number | null
    /** Add a divider when the season row follows the total-rank summary in one card. */
    separated?: boolean
}

/**
 * Dải MÙA GIẢI trên đầu bảng: đang là kỳ nào · còn bao lâu · bạn đứng đâu.
 *
 * <p><b>Vì sao ba thứ này đi cùng nhau.</b> Một thứ hạng không kèm "hạng của kỳ nào, còn
 * bao lâu" là con số không giải thích được — người dùng không biết nên cày tiếp hay đã hết
 * cơ hội. Trước đợt này dải chỉ in ra `seasonCode`, mà mã được dựng dạng
 * {@code T-<mã kỳ>-<8 ký tự băm>}, nên người dùng đang nhìn thấy nguyên chuỗi
 * "T-SU26-bfd6f768" trên trang thật.
 *
 * <p><b>Đếm ngược tính ở CLIENT sau khi gắn (mount).</b> Server và trình duyệt ở hai múi
 * giờ/hai thời điểm khác nhau, nên tính "còn bao nhiêu ngày" ngay lúc render sẽ cho hai kết
 * quả khác nhau và React báo lệch hydrate. Khoảng lặng một nhịp là cái giá đúng để đổi lấy
 * việc không bao giờ hiện sai số ngày.
 *
 * <p><b>BỐN kết cục, bốn câu nói</b> — gộp bất kỳ hai cái nào là nói sai: chưa khai kỳ nào
 * (`noSeason`) · chưa tải xong (chưa có mã) · tích luỹ (không có kỳ, KHÔNG đếm ngược) · kỳ
 * đang chạy.
 */
export const SeasonHeader = ({
    seasonCode,
    seasonName = null,
    endsAt = null,
    lifetime = false,
    noSeason,
    myRank = null,
    myXp = null,
    separated = false,
}: SeasonHeaderProps) => {
    const t = useTranslations("gamification.seasonBoards")
    const locale = useLocale()

    const [daysLeft, setDaysLeft] = React.useState<number | null>(null)
    React.useEffect(() => {
        if (!endsAt) {
            setDaysLeft(null)
            return
        }
        const end = new Date(endsAt).getTime()
        if (Number.isNaN(end)) {
            setDaysLeft(null)
            return
        }
        setDaysLeft(Math.max(0, Math.ceil((end - Date.now()) / 86_400_000)))
    }, [endsAt])

    if (noSeason) {
        return (
            <div className={cn("flex flex-col gap-1", separated && "border-t border-separator pt-3")}>
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

    // KHÔNG in mã thô: kỳ chưa có tên thì cắt phần mã kỳ ra ("SU26"); không có cả thứ đó thì nói
    // "Kỳ đang chạy" — chứ không dội lại đúng chuỗi băm mà ô chọn mùa ngay trên vừa hiện.
    const title = lifetime
        ? t("picker.lifetime")
        : seasonDisplayName(locale, seasonName, seasonCode) ?? t("picker.current")

    return (
        <div className={cn(
            "flex flex-wrap items-center justify-between gap-3",
            separated && "border-t border-separator pt-3",
        )}>
            <div className="flex min-w-0 flex-col gap-0.5">
                <Typography type="body" weight="semibold" className="line-clamp-1">
                    {title}
                </Typography>
                <div className="flex items-center gap-1.5 text-muted">
                    {lifetime ? (
                        <>
                            <InfinityIcon className="size-4" aria-hidden focusable="false" />
                            <Typography type="body-xs" color="muted">
                                {t("picker.lifetimeHint")}
                            </Typography>
                        </>
                    ) : daysLeft === null ? (
                        <>
                            <CalendarBlankIcon className="size-4" aria-hidden focusable="false" />
                            <Typography type="body-xs" color="muted">
                                {t("season.resetNote")}
                            </Typography>
                        </>
                    ) : (
                        <>
                            <ClockIcon className="size-4" aria-hidden focusable="false" />
                            <Typography type="body-xs" color="muted">
                                {t("season.daysLeft", { days: daysLeft })}
                            </Typography>
                        </>
                    )}
                </div>
            </div>

            {/* Hạng của người xem trong CHÍNH lát cắt đang hiện — đặt cạnh dải mùa để không
                ai phải cuộn xuống mới biết mình đứng đâu. `—` khi chưa có hạng (KHÁC 0). */}
            <div className="flex shrink-0 flex-col items-end gap-0.5">
                <Typography type="h5" weight="bold">
                    {myRank && myRank > 0 ? `#${myRank}` : "—"}
                </Typography>
                {myXp != null ? (
                    <Typography type="body-xs" color="muted">
                        {t("xp", { xp: formatXpShort(myXp) })}
                    </Typography>
                ) : null}
            </div>
        </div>
    )
}
