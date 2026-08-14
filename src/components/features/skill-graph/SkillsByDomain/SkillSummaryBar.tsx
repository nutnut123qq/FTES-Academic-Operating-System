"use client"

import React from "react"
import { Button } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import type { SegmentBarSegment } from "@/components/blocks/stats/SegmentBar"
import { useRouter } from "@/i18n/navigation"
import type { SkillNextUp, SkillSummary } from "../hooks/useQuerySkillGraphSwr"

/** Props for {@link SkillSummaryBar}. */
export interface SkillSummaryBarProps {
    /** Số đếm bốn bucket của TOÀN BỘ danh mục (không đổi khi lọc/tìm kiếm). */
    summary: SkillSummary
    /** Việc nên làm tiếp; `null` khi chưa có dữ liệu khoá → nút ẩn hẳn. */
    nextUp: SkillNextUp | null
}

/**
 * Tầng tóm tắt: một thanh bốn lát trả lời "tôi đang ở đâu" trong một liếc, cộng đúng
 * MỘT việc nên làm tiếp.
 *
 * Cố ý KHÔNG dùng hàng `MetricCard`: tổng và phân rã ở đây là cùng một tập dữ liệu, mà
 * luật nhà gộp "count + breakdown của CÙNG dataset" vào một card. Legend của
 * {@link SegmentBar} in kèm số đếm nên thông tin không phụ thuộc màu.
 *
 * Lát "chưa mở" tô `var(--muted)` chứ không `var(--default)` vì `--default` chính là màu
 * rãnh của thanh — hôm nay gần như 100% kỹ năng nằm ở lát này, tô trùng rãnh sẽ đọc
 * thành "thanh rỗng".
 *
 * @param props - {@link SkillSummaryBarProps}
 */
export const SkillSummaryBar = ({ summary, nextUp }: SkillSummaryBarProps) => {
    const t = useTranslations()
    const router = useRouter()

    const segments: Array<SegmentBarSegment> = [
        { key: "mastered", label: t("skillGraph.buckets.mastered"), value: summary.mastered, color: "var(--success)" },
        { key: "learning", label: t("skillGraph.buckets.learning"), value: summary.learning, color: "var(--accent)" },
        { key: "nearly", label: t("skillGraph.buckets.nearly"), value: summary.nearly, color: "var(--warning)" },
        { key: "locked", label: t("skillGraph.buckets.locked"), value: summary.locked, color: "var(--muted)" },
    ]

    return (
        <LabeledCard
            label={t("skillGraph.summary.title")}
            labelEnd={t("skillGraph.summary.total", { count: summary.total })}
        >
            <div className="flex flex-col gap-3">
                <SegmentBar
                    segments={segments}
                    ariaLabel={t("skillGraph.summary.ariaLabel", { count: summary.total })}
                    className="[&>div:last-child]:grid [&>div:last-child]:grid-cols-2 sm:[&>div:last-child]:flex"
                />
                {/* chỉ render khi CÓ dữ liệu khoá thật — không có thì ẩn hẳn, không placeholder */}
                {nextUp ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="self-start"
                        onPress={() => router.push(`/courses/${nextUp.source.courseSlug}`)}
                    >
                        {t("skillGraph.summary.nextUp", {
                            skill: nextUp.skill.name,
                            percent: nextUp.remaining,
                            course: nextUp.source.courseTitle,
                        })}
                        <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                    </Button>
                ) : null}
            </div>
        </LabeledCard>
    )
}
