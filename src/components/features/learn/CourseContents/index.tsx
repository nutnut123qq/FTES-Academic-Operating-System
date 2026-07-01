"use client"

import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Button,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import numeral from "numeral"
import {
    useRouter,
} from "next/navigation"
import {
    CheckCircleIcon,
    CircleIcon,
    ClockIcon,
    LockIcon,
    ArrowRightIcon,
    PlayIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { LearnBreadcrumb } from "../shared/LearnBreadcrumb"
import { GithubTeamGate } from "@/components/layouts/auth/GithubTeamGate"
import { useCourseTotals } from "../../course/CourseDetail/hooks/useCourseTotals"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    resolveResumeHref,
    toDifficulty,
} from "./map"
import {
    CourseContentsSkeleton,
} from "./CourseContentsSkeleton"
import { useAppSelector } from "@/redux/hooks"
import { useQueryMyCourseOutlineSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCourseOutlineSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { DifficultyChip } from "@/components/blocks/chips/DifficultyChip"
import { HighlightChip } from "@/components/blocks/chips/HighlightChip"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import type { MyCourseOutlineModule } from "@/modules/api/graphql/queries/types/my-course-outline"

/** Props for {@link CourseContents}. */
export type CourseContentsProps = WithClassNames<undefined>

/**
 * Course-content home — the dashboard for `/learn/content`. The full module →
 * lesson tree now lives in the left content-map rail (its one home, shared with the
 * lesson reader), so the body is a focused dashboard rather than a second tree:
 * TIER-1 breadcrumb → TIER-2 header (course title + one-line description + catalog
 * meta, then one honest completion meter + the single primary "Continue" action,
 * resuming CONTENT via `nextContentTask`) → TIER-3 the "keep going" path = the
 * current module's lessons (highlighting the next one). Other learn surfaces
 * (leaderboard, flashcards, practice…) live behind the sidebar — this page
 * deliberately does NOT duplicate them.
 *
 * @param props - {@link CourseContents}
 */
export const CourseContents = ({ className }: CourseContentsProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const courseId = useAppSelector((state) => state.course.id)
    const displayId = useAppSelector((state) => state.course.displayId)
    const courseTitle = useAppSelector((state) => state.course.entity?.title)
    const courseDescription = useAppSelector((state) => state.course.entity?.description)
    const enrollmentCount = useAppSelector((state) => state.course.entity?.enrollmentCount) ?? 0

    // catalog meta (chương · giờ học · học viên) — derived client-side from the loaded
    // course tree, identity facts the progress stat line below does NOT carry.
    const totals = useCourseTotals()
    const readingHours = Math.max(1, Math.round(totals.totalMinutes / 60))

    const outlineSwr = useQueryMyCourseOutlineSwr(courseId ?? null)
    const outline = outlineSwr.data

    /**
     * The pointer the "Tiếp tục học" action resumes. CONTENT-FIRST: the next unread
     * lesson / uncompleted challenge (`nextContentTask`), so the content home never
     * sends a learner with unread lessons into the capstone. Only once all content is
     * done (`nextContentTask` null) does it fall back to the capstone task — the one
     * moment the personal project is the natural next step.
     */
    const resumePointer = useMemo(
        () => outline?.nextContentTask ?? outline?.currentTask ?? null,
        [outline],
    )

    /** Whether the resume target is the capstone (all content done) rather than content. */
    const isCapstoneResume = resumePointer?.kind === "milestoneTask"

    /** Resume href for the active pointer (null when nothing is resolvable). */
    const resumeHref = useMemo(
        () => (outline && resumePointer
            ? resolveResumeHref(resumePointer, outline.modules, locale, displayId)
            : null),
        [outline, resumePointer, locale, displayId],
    )

    /** Title of the resume target (walk the tree by id) for the continue line. */
    const resumeTitle = useMemo(() => {
        if (!outline || !resumePointer) {
            return null
        }
        if (resumePointer.kind === "milestoneTask") {
            for (const milestone of outline.milestones) {
                const task = milestone.tasks.find((entry) => entry.id === resumePointer.id)
                if (task) {
                    return task.title
                }
            }
            return null
        }
        for (const module of outline.modules) {
            if (resumePointer.kind === "lesson") {
                const lesson = module.lessons.find((entry) => entry.id === resumePointer.id)
                if (lesson) {
                    return lesson.title
                }
                continue
            }
            for (const lesson of module.lessons) {
                const challenge = lesson.challenges.find((entry) => entry.id === resumePointer.id)
                if (challenge) {
                    return challenge.title
                }
            }
        }
        return null
    }, [outline, resumePointer])

    /**
     * The module the learner is currently in: the one owning the resume pointer, else
     * the first module. Its lessons are the "keep going" path shown in the body.
     */
    const currentModule = useMemo<MyCourseOutlineModule | undefined>(() => {
        if (!outline) {
            return undefined
        }
        const pointer = outline.nextContentTask ?? outline.currentTask
        if (pointer) {
            const owning = outline.modules.find((module) =>
                module.lessons.some((lesson) =>
                    lesson.id === pointer.id
                    || lesson.challenges.some((challenge) => challenge.id === pointer.id)))
            if (owning) {
                return owning
            }
        }
        return outline.modules[0]
    }, [outline])

    /** The lesson to highlight in the path: the resume lesson, or the resume challenge's owner. */
    const activeLessonId = useMemo(() => {
        if (!outline || !resumePointer) {
            return undefined
        }
        if (resumePointer.kind === "lesson") {
            return resumePointer.id
        }
        if (resumePointer.kind === "challenge") {
            for (const module of outline.modules) {
                const lesson = module.lessons.find((entry) =>
                    entry.challenges.some((challenge) => challenge.id === resumePointer.id))
                if (lesson) {
                    return lesson.id
                }
            }
        }
        return undefined
    }, [outline, resumePointer])

    /** Navigate into the reader for the chosen lesson. */
    const onSelectLesson = useCallback(
        (lessonId: string, moduleId: string) => {
            if (!displayId) {
                return
            }
            router.push(
                pathConfig().locale(locale).course(displayId).learn().module(moduleId).content(lessonId).build(),
            )
        },
        [router, locale, displayId],
    )

    /** Open the resume target. */
    const onResume = useCallback(() => {
        if (resumeHref) {
            router.push(resumeHref)
        }
    }, [router, resumeHref])

    return (
        <div className={className}>
            <AsyncContent
                isLoading={!outlineSwr.data && !outlineSwr.error}
                skeleton={<CourseContentsSkeleton className="mx-auto max-w-3xl" />}
                isEmpty={!outline}
                emptyContent={{
                    title: t("courseContents.empty"),
                }}
                error={!outlineSwr.data ? outlineSwr.error : undefined}
                errorContent={{
                    title: t("courseContents.error"),
                    onRetry: () => { void outlineSwr.mutate() },
                    retryLabel: t("courseContents.retry"),
                }}
            >
                {outline ? (
                    <div className="mx-auto flex max-w-3xl flex-col gap-10">
                        {/* tier: PageHeader (header) → content cluster, gap-10 between (page-heading debt).
                            PageHeader is its OWN tier — NOT grouped with continue. */}
                        {/* shared PageHeader: breadcrumb → H3 title → muted description → catalog meta chips. */}
                        <PageHeader
                            breadcrumb={<LearnBreadcrumb />}
                            title={courseTitle ?? outline.course.title}
                            description={courseDescription || undefined}
                            meta={totals.moduleCount > 0 ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <HighlightChip
                                        icon={<StackIcon className="size-5" />}
                                        value={totals.moduleCount}
                                        label={t("courseContents.metaModulesLabel")}
                                    />
                                    <HighlightChip
                                        icon={<ClockIcon className="size-5" />}
                                        value={`~${readingHours}`}
                                        label={t("courseContents.metaHoursLabel")}
                                    />
                                    {enrollmentCount > 0 ? (
                                        <HighlightChip
                                            icon={<UsersIcon className="size-5" />}
                                            value={numeral(enrollmentCount).format("0,0")}
                                            label={t("courseContents.metaLearnersLabel")}
                                        />
                                    ) : null}
                                </div>
                            ) : undefined}
                        />

                        {/* content cluster: GitHub-team warning (paid; below header chips) · continue · path */}
                        <div className="flex flex-col gap-6">
                            {/* non-blocking warning: paid learner not yet in the course GitHub team
                                (self-hides for trial / when already in team) */}
                            <GithubTeamGate />
                            {/* continue + progress — flat (no card frame), the honest unified meter */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 flex-col gap-0">
                                        <Typography type="body-xs" color="muted">
                                            {resumeHref
                                                ? (isCapstoneResume
                                                    ? t("courseContents.capstoneEyebrow")
                                                    : t("courseContents.continueEyebrow"))
                                                : t("courseContents.allDone")}
                                        </Typography>
                                        {resumeHref && resumeTitle ? (
                                            <Typography type="body" weight="semibold" truncate title={resumeTitle}>
                                                {resumeTitle}
                                            </Typography>
                                        ) : null}
                                    </div>
                                    {resumeHref ? (
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="shrink-0"
                                            onPress={onResume}
                                        >
                                            {isCapstoneResume
                                                ? t("courseContents.resumeCapstone")
                                                : t("courseContents.resume")}
                                            <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                                        </Button>
                                    ) : null}
                                </div>
                                <ProgressMeter
                                    value={outline.progress.completionPercent}
                                    max={100}
                                    label={t("courseContents.completion")}
                                    showValue
                                />
                                <Typography type="body-xs" color="muted">
                                    {[
                                        t("courseContents.lessonsStat", {
                                            read: outline.progress.lessonsRead,
                                            total: outline.progress.lessonsTotal,
                                        }),
                                        t("courseContents.challengesStat", {
                                            done: outline.progress.challengesCompleted,
                                            total: outline.progress.challengesTotal,
                                        }),
                                    ].join(" · ")}
                                </Typography>
                            </div>

                            {/* region B — keep-going path: the current module's lessons. The full
                            module → lesson tree lives in the left content-map rail, so the body
                            never re-draws it; here we only surface "where you are + what's next". */}
                            {currentModule ? (
                                <div className="flex flex-col gap-3">
                                    <Typography type="body-sm" weight="semibold" color="muted">
                                        {t("courseContents.keepGoing")} · {currentModule.title}
                                    </Typography>
                                    <div className="flex flex-col gap-2">
                                        {currentModule.lessons.map((lesson) => (
                                            <ListRow
                                                key={lesson.id}
                                                className={cn("px-3", lesson.id === activeLessonId && "bg-accent/10")}
                                                leading={lesson.id === activeLessonId ? (
                                                    <PlayIcon
                                                        aria-hidden
                                                        focusable="false"
                                                        className="size-5 text-accent"
                                                    />
                                                ) : lesson.isRead ? (
                                                    <CheckCircleIcon
                                                        aria-label={t("courseContents.read")}
                                                        focusable="false"
                                                        className="size-5 text-success"
                                                    />
                                                ) : (
                                                    <CircleIcon
                                                        aria-label={t("courseContents.unread")}
                                                        focusable="false"
                                                        className="size-5 text-muted"
                                                    />
                                                )}
                                                title={lesson.title}
                                                subtitle={t("content.minutesRead", {
                                                    minutes: lesson.minutesRead,
                                                })}
                                                onPress={() => onSelectLesson(lesson.id, currentModule.id)}
                                                meta={(
                                                    <>
                                                        {lesson.difficulty ? (
                                                            <DifficultyChip difficulty={toDifficulty(lesson.difficulty)} />
                                                        ) : null}
                                                        {lesson.isPremium ? (
                                                            <LockIcon
                                                                aria-label={t("courseContents.premium")}
                                                                focusable="false"
                                                                className="size-5 text-muted"
                                                            />
                                                        ) : null}
                                                    </>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
