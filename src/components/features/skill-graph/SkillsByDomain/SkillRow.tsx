"use client"

import React from "react"
import { Button } from "@heroui/react"
import { ClockIcon, GraduationCapIcon, LockKeyIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { SkillProgressRow } from "@/components/blocks/stats/SkillProgressRow"
import type { StatusChipTone } from "@/components/blocks/chips/StatusChip"
import { Link, useRouter } from "@/i18n/navigation"
import {
    bestSourceOf,
    bucketOf,
    unlockLineOf,
    unlockProgressOf,
} from "../hooks/useQuerySkillGraphSwr"
import type { SkillBucket, SkillNode } from "../hooks/useQuerySkillGraphSwr"

/** Props for {@link SkillRow}. */
export interface SkillRowProps {
    /** Kỹ năng cần hiển thị. */
    skill: SkillNode
    /** Tên các kỹ năng tiên quyết CHƯA đạt (tính trên đồ thị đầy đủ ở component cha). */
    pendingPrerequisites: Array<string>
}

/** Tone chip theo bucket — bốn tone này là ngôn ngữ màu DUY NHẤT bên trong thẻ. */
const BUCKET_TONE: Record<SkillBucket, StatusChipTone> = {
    mastered: "success",
    learning: "accent",
    nearly: "warning",
    locked: "neutral",
}

/**
 * Một thẻ kỹ năng trong danh sách: dịch một {@link SkillNode} thành props của khối
 * {@link SkillProgressRow}.
 *
 * Khối stats không gọi i18n, nên toàn bộ việc chọn chữ (nhãn trạng thái, nghĩa của thanh
 * tiến độ, câu quy trách nhiệm mở khoá) nằm ở đây. Thẻ KHÔNG pressable: nó chỉ có link
 * khoá học và nút "Học tiếp", còn chi tiết sâu vẫn thuộc tab Sơ đồ — không đẻ thêm bề
 * mặt.
 *
 * @param props - {@link SkillRowProps}
 */
export const SkillRow = ({ skill, pendingPrerequisites }: SkillRowProps) => {
    const t = useTranslations()
    const router = useRouter()

    const bucket = bucketOf(skill)
    const source = bestSourceOf(skill)
    const line = unlockLineOf(skill)
    const isOpen = bucket === "mastered" || bucket === "learning"

    const icon =
        bucket === "mastered" ? (
            <GraduationCapIcon aria-hidden focusable="false" className="size-4 text-success" weight="fill" />
        ) : bucket === "nearly" ? (
            <ClockIcon aria-hidden focusable="false" className="size-4 text-warning" />
        ) : bucket === "locked" ? (
            <LockKeyIcon aria-hidden focusable="false" className="size-4 text-muted" />
        ) : null

    // Một thanh, một nghĩa — và nghĩa được VIẾT RA CHỮ: đã mở thì thanh đo mức thành
    // thạo, chưa mở thì nó đo % của khoá sẽ mở nó.
    const progressLabel = isOpen
        ? t("skillGraph.progress.mastery")
        : source
            ? t("skillGraph.progress.course", { course: source.courseTitle })
            : t("skillGraph.progress.unlock")
    const progressValue = isOpen ? skill.level : unlockProgressOf(skill)

    /** Link tới khoá đại diện; dùng chung cho mọi biến thể của dòng mở khoá. */
    const courseLink = () =>
        line.kind === "none" ? null : (
            <Link href={`/courses/${line.source.courseSlug}`} className="text-accent hover:underline">
                {line.source.courseTitle}
            </Link>
        )

    const unlock = (() => {
        if (line.kind === "none") {
            // Thực trạng BE hôm nay: chưa bảng nào nối course→skill.
            return t("skillGraph.unlock.none")
        }
        const suffix = line.extra > 0 ? ` ${t("skillGraph.unlock.more", { count: line.extra })}` : ""
        if (line.kind === "already") {
            return (
                <>
                    {t.rich("skillGraph.unlock.already", {
                        course: courseLink,
                        percent: line.source.completionPercent,
                    })}
                    {suffix}
                </>
            )
        }
        const threshold = line.source.requiredPercent
        return (
            <>
                {threshold !== null
                    ? t.rich("skillGraph.unlock.at", {
                        course: courseLink,
                        threshold,
                        percent: line.percent,
                    })
                    : t.rich("skillGraph.unlock.by", {
                        course: courseLink,
                        percent: line.percent,
                    })}
                {suffix}
            </>
        )
    })()

    return (
        <SkillProgressRow
            name={skill.name}
            icon={icon}
            statusLabel={t(`skillGraph.buckets.${bucket}`)}
            statusTone={BUCKET_TONE[bucket]}
            levelLabel={
                isOpen && skill.levelIndex > 0
                    ? t("skillGraph.list.levelChip", { level: skill.levelIndex, max: skill.maxLevel })
                    : undefined
            }
            eligibleLabel={
                skill.eligibleLevel > skill.levelIndex
                    ? t("skillGraph.unlock.eligible", { level: skill.eligibleLevel })
                    : undefined
            }
            progressLabel={progressLabel}
            progressValue={progressValue}
            unlock={unlock}
            prerequisite={
                pendingPrerequisites.length > 0
                    ? t("skillGraph.unlock.prereq", { names: pendingPrerequisites.join(", ") })
                    : undefined
            }
            action={
                source && (bucket === "learning" || bucket === "nearly") ? (
                    <Button
                        variant="tertiary"
                        size="sm"
                        onPress={() => router.push(`/courses/${source.courseSlug}`)}
                    >
                        {t("skillGraph.list.continue")}
                    </Button>
                ) : undefined
            }
        />
    )
}
