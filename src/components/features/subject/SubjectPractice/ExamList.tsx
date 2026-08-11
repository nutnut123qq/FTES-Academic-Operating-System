"use client"

import React, { useState } from "react"
import { Button, Chip, Link, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, LockSimpleIcon, PlusIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import {
    EXAM_ROUTE_SEGMENT,
    useQuerySubjectExamsSwr,
    type SubjectExam,
    type SubjectExamKind,
} from "../hooks/useQuerySubjectExamsSwr"
import { ExamContribute } from "./ExamContribute"
import { ExamModerationQueue } from "./ExamModerationQueue"

/** Props for {@link ExamList}. */
export interface ExamListProps {
    /** The `[subjectId]` route segment (a subject code). */
    subjectId: string
    /** Which exam flavour to list. */
    kind: SubjectExamKind
    /** Back to the practice hub. */
    onBack: () => void
}

/**
 * The Practice tab's list of a subject's **Practical Exams (PE)** or **Final Exams
 * (FE)** — the only surface that lists these two resource types now that they are gone
 * from the Resource tab's taxonomy.
 *
 * A row opens its own route (`/subjects/{id}/practice/{pe|fe}/{resourceId}`) rather than
 * an in-panel view, so an exam is linkable and the workspace rail keeps "Practice"
 * highlighted (its active check is `pathname.startsWith(base/practice)`).
 *
 * Also hosts the two moderation-adjacent surfaces: any signed-in member can contribute
 * an exam (held for review), and a viewer holding a resource-moderation permission gets
 * the pending queue with Duyệt / Từ chối inline.
 *
 * @param props - {@link ExamListProps}
 */
export const ExamList = ({ subjectId, kind, onBack }: ExamListProps) => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const router = useRouter()
    const { guard } = useRequireAuth()
    const { exams, subjectUuid, isLoading, error, mutate } = useQuerySubjectExamsSwr(
        subjectId,
        kind,
    )
    // CONTRACT B: a locked exam's click opens the buy flow of the subject's linked
    // course. `null` when no course is linked — the row then stays inert with a hint.
    const { subject } = useQuerySubjectSwr(subjectId)
    const lockedCourseId = subject?.courseLinks?.[0]?.id ?? null
    const [contributing, setContributing] = useState(false)

    const openContribute = guard(() => {
        setContributing(true)
    }, "auth.context.uploadResource")

    /** Human meta line: rating · created date (each part degrades away). */
    const metaLabel = (exam: SubjectExam) => {
        const parts: Array<string> = []
        if (exam.rating !== null) {
            parts.push(
                t("practice.exam.ratingLabel", {
                    rating: exam.rating.toFixed(1),
                    count: exam.ratingCount,
                }),
            )
        }
        if (exam.createdAt) {
            const date = new Date(exam.createdAt)
            if (!Number.isNaN(date.getTime())) {
                parts.push(date.toLocaleDateString(locale))
            }
        }
        return parts.join(" · ")
    }

    const openExam = (exam: SubjectExam) => {
        router.push(`/subjects/${subjectId}/practice/${EXAM_ROUTE_SEGMENT[kind]}/${exam.id}`)
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3">
                <Button size="sm" variant="ghost" className="self-start" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
                <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <Typography type="h5" weight="bold">
                            {t(`practice.exam.${kind}.title`)}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t(`practice.exam.${kind}.subtitle`)}
                        </Typography>
                    </div>
                    {!contributing ? (
                        <Button size="sm" variant="secondary" onPress={openContribute}>
                            <PlusIcon aria-hidden focusable="false" className="size-4" />
                            {t("practice.exam.contributeCta")}
                        </Button>
                    ) : null}
                </div>
            </div>

            {contributing ? (
                <ExamContribute
                    kind={kind}
                    subjectUuid={subjectUuid}
                    onClose={() => setContributing(false)}
                    onContributed={() => {
                        void mutate()
                    }}
                />
            ) : null}

            {/*
             * KHÔNG gate bằng permission phía client: quyền duyệt của CTV là grant THEO TỪNG MÔN
             * (resource.approve + ScopeType.SUBJECT), mà `state.user.permissions` chỉ chứa leaf
             * GLOBAL — gate ở client sẽ ẩn nút Duyệt khỏi đúng người phải duyệt. Server đã lọc
             * hàng đợi theo `approvableSubjectIds()` (không có quyền → trả RỖNG, không 403), nên
             * cứ render và để queue tự ẩn khi không có gì để duyệt.
             */}
            <ExamModerationQueue
                subjectUuid={subjectUuid}
                kind={kind}
                onModerated={() => {
                    void mutate()
                }}
            />

            <AsyncContent
                isLoading={isLoading && exams.length === 0}
                skeleton={<ExamListSkeleton />}
                isEmpty={exams.length === 0}
                emptyContent={{
                    title: t(`practice.exam.${kind}.empty`),
                    description: t("practice.exam.emptyHint"),
                }}
                error={exams.length === 0 ? error : undefined}
                errorContent={{
                    title: t("practice.exam.loadError"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("practice.exam.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {exams.map((exam) =>
                        exam.lockedForViewer ? (
                            // Purchasers-only exam the viewer hasn't bought: no body/URL
                            // affordance at all, the row opens the course's buy page.
                            <Link
                                key={exam.id}
                                onPress={() => {
                                    if (lockedCourseId) {
                                        router.push(`/courses/${lockedCourseId}`)
                                    }
                                }}
                                aria-label={`${exam.title} — ${t("practice.exam.lockedAria")}`}
                                className={cn(
                                    "flex items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors",
                                    lockedCourseId
                                        ? "cursor-pointer hover:border-accent/50 hover:bg-accent/5"
                                        : "cursor-default",
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {exam.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {lockedCourseId
                                            ? t("practice.exam.unlockHint")
                                            : t("practice.exam.lockedNeutralHint")}
                                    </Typography>
                                </div>
                                <Chip size="sm" variant="soft" color="warning">
                                    <span className="flex items-center gap-1">
                                        <LockSimpleIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-4"
                                        />
                                        {t("practice.exam.lockedBadge")}
                                    </span>
                                </Chip>
                            </Link>
                        ) : (
                            <div
                                key={exam.id}
                                className="flex items-center gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-accent/50 hover:bg-accent/5"
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {exam.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {metaLabel(exam)}
                                    </Typography>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onPress={() => openExam(exam)}
                                >
                                    {t(`practice.exam.${kind}.open`)}
                                </Button>
                            </div>
                        ),
                    )}
                </div>
            </AsyncContent>
        </div>
    )
}

/** Loading skeleton — mirrors the exam rows (title/meta text + open button). */
const ExamListSkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[68px] w-full rounded-2xl" />
        ))}
    </div>
)
