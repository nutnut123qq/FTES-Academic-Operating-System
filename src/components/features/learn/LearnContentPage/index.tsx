"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import {
    ClockIcon,
    LockSimpleIcon,
    PlayCircleIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRouter } from "@/i18n/navigation"
import { useCourseEnrollment } from "@/components/features/course/hooks/useCourseEnrollment"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import { LearnToolsRail } from "../LearnToolsRail"
import { LearnNudges } from "./LearnNudges"

/** Build the reader route for a lesson id shaped "m<n>-l<k>". */
const lessonHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/**
 * Learn content dashboard (StarCI port). The full module → lesson tree lives in
 * the layout-owned LEFT content-map rail; this body is the course "home": the
 * header (meta chips), a "Continue learning" CTA + overall progress, and a short
 * "up next" lesson list. No per-feature nav rail or grid — the shell owns the
 * rails now.
 */
export const LearnContentPage = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { header, course, access, error, mutate } = useQueryLearnCourseSwr(courseId)

    const openLesson = (lessonId: string) => router.push(lessonHref(courseId, lessonId))

    // Trial → buy nudge: shown only to viewers who do NOT already have full access
    // (guests included). `fullAccess` is a SUPERSET of `purchased` — every enrolled
    // learner of a FREE course, plus comp/entitled users, has fullAccess without
    // purchased, and must NOT see the "unlock" upsell (on a free course its CTA is a
    // disabled dead-end). Reuses the canonical enroll flow (resolve COURSE_UNLOCK →
    // cart → PaymentModal); copy is enroll/unlock, never "VIP".
    const purchased = access?.purchased === true
    const hasFullAccess = access?.fullAccess === true || purchased
    const enrollment = useCourseEnrollment(
        courseId,
        { isEnrolled: access?.enrolled === true, isPurchased: purchased },
        { rawId: course?.id, title: header?.title, priceVnd: header?.priceVnd },
    )

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <AsyncContent
                isLoading={!header && !error}
                skeleton={<DashboardSkeleton />}
                error={!header ? error : undefined}
                errorContent={{
                    title: t("content.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                {header && course ? (
                    <>
                        <PageHeader
                            title={header.title}
                            meta={(
                                <div className="flex flex-wrap gap-2">
                                    <MetaChip icon={<StackIcon aria-hidden focusable="false" className="size-3" />}>
                                        {t("content.metaModules", { count: header.moduleCount })}
                                    </MetaChip>
                                    {header.durationHours > 0 ? (
                                        <MetaChip icon={<ClockIcon aria-hidden focusable="false" className="size-3" />}>
                                            {t("content.metaHours", { count: header.durationHours })}
                                        </MetaChip>
                                    ) : null}
                                    <MetaChip icon={<UsersIcon aria-hidden focusable="false" className="size-3" />}>
                                        {t("content.metaLearners", { count: header.learnerCount })}
                                    </MetaChip>
                                </div>
                            )}
                        />

                        {/* continue + progress */}
                        <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-4">
                            <Button
                                variant="primary"
                                className="self-start"
                                isDisabled={!header.continueLessonId}
                                onPress={() => header.continueLessonId && openLesson(header.continueLessonId)}
                            >
                                <PlayCircleIcon aria-hidden focusable="false" className="size-5" />
                                {t("content.continue")}
                            </Button>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Typography type="body-sm" color="muted">
                                        {t("content.overallProgress")}
                                    </Typography>
                                    <Typography type="body-sm" weight="semibold">
                                        {t("content.percent", { value: header.progressPercent })}
                                    </Typography>
                                </div>
                                <ProgressMeter value={header.progressPercent} max={100} />
                            </div>
                        </div>

                        {/* trial → buy nudge — hidden for anyone who already has full
                            access (purchased, free-owned, or otherwise entitled)
                            (rule premium-unlock-is-enroll-not-vip). Chỉ hiện khi access ĐÃ resolve
                            (access !== undefined) để không nháy card lúc SWR access còn bay. */}
                        {access !== undefined && !hasFullAccess ? (
                            <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <LockSimpleIcon aria-hidden focusable="false" className="size-5 text-accent" />
                                        <Typography type="h6" weight="bold">
                                            {t("content.trialCard.title")}
                                        </Typography>
                                    </div>
                                    <Typography type="body-sm" color="muted">
                                        {t("content.trialCard.subtitle")}
                                    </Typography>
                                </div>
                                {header.priceVnd > 0 ? (
                                    <PriceTag
                                        discounted={header.priceVnd}
                                        original={header.originalVnd > header.priceVnd ? header.originalVnd : undefined}
                                        size="lg"
                                    />
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="primary"
                                        isDisabled={!enrollment.canBuy}
                                        isPending={enrollment.isEnrolling || enrollment.isResolvingProduct}
                                        onPress={enrollment.onEnroll}
                                    >
                                        <LockSimpleIcon aria-hidden focusable="false" className="size-5" />
                                        {t("content.trialCard.unlock")}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        isDisabled={!header.continueLessonId}
                                        onPress={() => header.continueLessonId && openLesson(header.continueLessonId)}
                                    >
                                        {t("content.trialCard.continueTrial")}
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        {/* contextual nudges — surfaces the (built-but-hidden) leaderboard rank */}
                        <LearnNudges />

                        {/* the tool feature cards (mind-map / leaderboard / mock-interview /
                            course-interview + subject Ôn tập/Hỏi đáp) live in the FAR-LEFT
                            LearnToolsRail (column 1, owned by the layout), not the centre. */}

                        {/* about — the module→lesson tree lives in the LEFT content-map rail,
                            so the home body describes the course instead of repeating it. */}
                        {header.description ? (
                            <LabeledCard frameless label={t("content.aboutTitle")}>
                                <Typography type="body-sm" color="muted" className="whitespace-pre-line">
                                    {header.description}
                                </Typography>
                            </LabeledCard>
                        ) : null}

                        {/* the tools live in the far-left LearnToolsRail on desktop; below
                            lg (no rail) surface them inline so mobile keeps the access. */}
                        <div className="rounded-3xl border border-default bg-surface lg:hidden">
                            <LearnToolsRail mobile />
                        </div>
                    </>
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** A meta chip (icon + label) for the course header. */
const MetaChip = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <Chip size="sm" variant="soft">
        <span className="flex items-center gap-1">
            {icon}
            {children}
        </span>
    </Chip>
)

/** Dashboard skeleton — header + continue card + up-next list. */
const DashboardSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-2/3 rounded-large" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton.Paragraph lines={5} />
    </div>
)
