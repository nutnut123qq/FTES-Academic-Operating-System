"use client"

import React, { useState } from "react"
import { CaretRightIcon } from "@phosphor-icons/react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"

/** Props for {@link ContinueCourseCard}. */
export interface ContinueCourseCardProps {
    /** Destination — the reader for an active course, the detail page for an expired one. */
    href: string
    /** Course cover URL; `null`/broken falls back to the branded gradient. */
    coverUrl?: string | null
    /** Course title — clamped to two lines. */
    title: string
    /** Completion percent 0..100. */
    completionPercent: number
    /** Term chip ("mở đến {date}" / "hết kỳ"), or `null` when the course has no term. */
    badge?: React.ReactNode
    /** Term expired → the CTA sells a re-purchase instead of resuming. */
    expired?: boolean
}

/**
 * A course the viewer is part-way through, as shown on the home "Tiếp tục học" band
 * and on `/courses/me`.
 *
 * Layout is a ROW — thumbnail left, title + percent centre, resume CTA right, progress
 * meter spanning the foot — NOT the catalog card's full-width cover on top. A build
 * shipped the stacked version and the card grew about three times taller, so one screen
 * held two courses instead of six; someone mid-course wants to spot the right one and
 * click on, not admire the artwork. The thumbnail is 128px (160px from `sm`): the 96/112px
 * it used before sliced the text baked into course covers ("VỚI JAVA" → "…ỚI JAVA").
 *
 * It borrows only the catalog card's SURFACE grammar — flat `rounded-lg` frame, cover one
 * radius step tighter, branded gradient behind a missing/broken cover — so the two grids
 * read as one design system while staying independent: it imports nothing from
 * `CatalogCourseCard`, so either surface can change without dragging the other along.
 *
 * It replaced a `SectionCard`-based block whose 36px card radius and 24px cover radius
 * sat visibly apart from the 12px/9px pair used everywhere else.
 *
 * @param props - {@link ContinueCourseCardProps}
 */
export const ContinueCourseCard = ({
    href,
    coverUrl,
    title,
    completionPercent,
    badge,
    expired,
}: ContinueCourseCardProps) => {
    const t = useTranslations()
    // A cover that 404s falls back to the gradient rather than a broken-image glyph.
    const [coverFailed, setCoverFailed] = useState(false)

    return (
        <Link
            href={href}
            // h-full is baked in (not left to the caller) so a card always fills its grid
            // cell — neighbours in a row share one height instead of staggering.
            //
            // ponytail: viền + bóng đổ nằm Ở ĐÂY chứ không phải do lưới bên ngoài đè CSS
            // vào. `--separator` ở theme sáng nhạt tới mức thẻ gần như không có mép; kéo
            // về `#E2E8F0` cộng một lớp bóng mảnh thì thẻ nổi khỏi nền trang. Nền TỐI giữ
            // viền trắng mờ — `#E2E8F0` trên nền tối là một vệt sáng chói. Biến thể `dark:`
            // của Tailwind KHÔNG dùng được (repo chưa khai `@custom-variant dark`, nó vẫn
            // bám `prefers-color-scheme`), nên nhánh tối bắt theo class `.dark` trên <html>.
            className="group flex h-full flex-col gap-3 rounded-lg border border-[#E2E8F0] p-3 no-underline shadow-sm transition-colors hover:bg-default/40 [.dark_&]:border-white/15"
        >
            {/* Hàng thông tin: [ảnh] │ [tiêu đề + %] │ [CTA] — bố cục NGANG, không phải
                cover full bề ngang như thẻ danh mục. Đây là chủ ý: ở đây người học đang
                học dở, cần nhiều khoá lọt trong một màn để bấm tiếp, nên thẻ phải THẤP.
                Có một quãng bản build để ảnh nằm trên full bề ngang — thẻ cao gấp ~3 và
                một màn chỉ còn thấy 2 khoá, nên đã trả về hàng ngang. */}
            <div className="flex items-center gap-3">
                {/* Ảnh 16:9 cố định bề ngang, `shrink-0` để không bao giờ bị bóp. 128px
                    (160px từ `sm`) là mức đã cân: bản cũ 96/112px cắt mất chữ nướng trên
                    bìa khoá ("VỚI JAVA" ra "...ỚI JAVA"), còn full bề ngang thì quá cao.
                    Gradient nằm DƯỚI ảnh nên khoá thiếu bìa ra khối có thương hiệu chứ
                    không phải ô xám rỗng; ảnh 404 cũng rơi về đó. */}
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-40">
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-br from-accent/40 via-accent/20 to-accent/5"
                    />
                    {coverUrl && !coverFailed ? (
                        // plain <img>: ảnh đến từ host image-delivery của BE nên không cần
                        // khai remotePatterns trong next.config (giống CoverImage).
                        <img
                            src={coverUrl}
                            alt={title}
                            loading="lazy"
                            onError={() => setCoverFailed(true)}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : null}
                </div>

                {/* Cột chữ — `min-w-0` cho phép cắt chữ; tên khoá kẹp 2 dòng thay vì
                    truncate 1 dòng (tên thật hay dài, cắt 1 dòng là mất đuôi). */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Typography weight="semibold" className="line-clamp-2">
                        {title}
                    </Typography>
                    {/* ponytail: "Hoàn thành x%" to hơn một bậc (xs → sm) và đậm hơn
                        `--muted`: nó là con số người học tìm, không phải chú thích. Nền
                        tối trả về token `muted` (xám sáng) — `#666666` ở đó là mù chữ. */}
                    <Typography
                        type="body-sm"
                        className="text-[#666666] [.dark_&]:text-muted"
                    >
                        {t("courses.percentComplete", { percent: completionPercent })}
                    </Typography>
                    {badge ? <div className="flex">{badge}</div> : null}
                </div>

                {/* CTA ghim mép phải cùng hàng — `self-start` để nó bám đỉnh hàng thay vì
                    trôi theo chiều cao cột chữ (tên 1 dòng hay 2 dòng đều cùng chỗ). */}
                <span
                    className={cn(
                        "inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium",
                        expired ? "text-warning" : "text-accent",
                    )}
                >
                    {expired ? t("courses.rebuy") : t("courses.continueLearning")}
                    <CaretRightIcon
                        aria-hidden
                        focusable="false"
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                </span>
            </div>

            {/* Thanh tiến độ trải hết bề ngang thẻ, dưới cùng — `mt-auto` để nó luôn nằm
                đáy dù cột chữ cao thấp khác nhau, các thẻ cùng hàng thẳng thanh với nhau. */}
            {/* ponytail: thanh cao gấp đôi (4px → 8px) và rãnh đậm hơn nền thẻ, nên phần
                đã học (màu accent) đọc được từ xa thay vì là một sợi chỉ. Bóng lõm nhẹ để
                rãnh không lẫn vào mặt thẻ; nền tối đổi rãnh sang trắng mờ. */}
            <ProgressMeter
                value={completionPercent}
                max={100}
                className="mt-auto"
                classNames={{
                    track: "h-2 bg-[#E2E8F0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] [.dark_&]:bg-white/15",
                }}
            />
        </Link>
    )
}
