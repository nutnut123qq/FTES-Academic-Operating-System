"use client"

import React, { useMemo, useState } from "react"
import { Accordion, Button, Chip, Label, ScrollShadow, Typography, cn } from "@heroui/react"
import {
    ArrowRightIcon,
    CheckCircleIcon,
    LockSimpleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { useRouter } from "@/i18n/navigation"
import { mutate as globalMutate } from "swr"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import type { LearnExercise, LearnLesson } from "../hooks/useQueryLearnCourseSwr"
import type { CourseAccessStateView } from "@/modules/api/rest/course"
import { exerciseSolverIcon, normalizeExerciseType } from "../exerciseType"
import { lessonTypeIcon } from "../lessonType"

/** Build the reader route for a lesson id shaped "m<n>-l<k>". */
const lessonHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/** Build the per-lesson challenge solver route from the REAL ids (slug the detail keys on). */
const challengeSolverHref = (courseId: string, lessonId: string, slug: string) =>
    `${lessonHref(courseId, lessonId)}/challenges/${slug}`

/** Where an exercise child row navigates: a challenge opens its solver route. */
const exerciseHref = (courseId: string, lessonId: string, exercise: LearnExercise): string =>
    challengeSolverHref(courseId, lessonId, exercise.slug ?? exercise.id)

/** Props for {@link ContentMap}. */
export interface ContentMapProps {
    /** Extra classes on the rail body (the layout owns the sticky/width chrome). */
    className?: string
}

/**
 * Persistent LEFT course content-map rail (StarCI port). The full module → lesson
 * tree lives here as its single home: overall progress + a search box + per-module
 * accordions, each lesson a row that links to its reader and marks the active
 * lesson. Pins its header + search, scrolling only the list.
 */
export const ContentMap = ({ className }: ContentMapProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId, contentId, challengeId } = useParams<{
        courseId: string
        contentId?: string
        challengeId?: string
    }>()
    const { course, modules, header, access, error, mutate } = useQueryLearnCourseSwr(courseId)

    const [query, setQuery] = useState("")

    const flatLessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules])
    const doneCount = flatLessons.filter((lesson) => lesson.isCompleted).length
    const totalCount = flatLessons.length

    // the module owning the active lesson opens by default
    const activeModuleId = contentId ? contentId.split("-")[0] : undefined

    const normalized = query.trim().toLowerCase()
    const filteredModules = useMemo(
        () =>
            modules
                .map((module) => ({
                    ...module,
                    lessons: module.lessons.filter(
                        (lesson) => normalized === "" || lesson.title.toLowerCase().includes(normalized),
                    ),
                }))
                // drop sections with no (matching) lessons — an empty "0/0 bài" section is clutter
                .filter((module) => module.lessons.length > 0),
        [modules, normalized],
    )

    const openLesson = (lessonId: string) => router.push(lessonHref(courseId, lessonId))
    const continueLessonId = header?.continueLessonId ?? null

    return (
        <div className={cn("flex min-h-0 flex-col gap-4 p-4", className)}>
            {/* pinned header: title + overall progress + search */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <Label>{t("contentMap.title")}</Label>
                    <Typography type="body-xs" color="muted" className="shrink-0">
                        {t("content.progressCount", { done: doneCount, total: totalCount })}
                    </Typography>
                </div>
                <ProgressMeter value={doneCount} max={totalCount || 1} />
                {continueLessonId ? (
                    <Button
                        size="sm"
                        variant="primary"
                        className="w-full"
                        onPress={() => openLesson(continueLessonId)}
                    >
                        <span className="flex items-center gap-1">
                            {t("content.continue")}
                            <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                        </span>
                    </Button>
                ) : null}
                <SearchInput
                    value={query}
                    onValueChange={setQuery}
                    variant="secondary"
                    placeholder={t("contentMap.searchPlaceholder")}
                    className="sm:max-w-none"
                />
            </div>

            {/* the tree scrolls; header above stays pinned */}
            <ScrollShadow hideScrollBar className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <AsyncContent
                    isLoading={modules.length === 0 && !error}
                    skeleton={<ContentMapSkeleton />}
                    isEmpty={filteredModules.length === 0}
                    emptyContent={{
                        title: normalized ? t("contentMap.noMatch") : t("contentMap.empty"),
                    }}
                    error={modules.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("content.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    <Accordion
                        variant="surface"
                        className="overflow-hidden border border-default"
                        defaultExpandedKeys={activeModuleId ? [activeModuleId] : undefined}
                    >
                        {filteredModules.map((module) => {
                            return (
                                <Accordion.Item key={module.id} id={module.id} aria-label={module.title}>
                                    <Accordion.Heading>
                                        <Accordion.Trigger className="text-sm font-medium">
                                            <div className="flex w-full min-w-0 items-center gap-2">
                                                <div className="min-w-0 flex-1 text-left">
                                                    {/* Description is the prominent title on top (e.g. "Tổng hợp
                                                        Tài Liệu"); the real module name (e.g. "Phần 0") is a small
                                                        muted tag below. No description → the name becomes the title
                                                        and the tag line is dropped (avoid an empty/duplicate label). */}
                                                    <Typography type="body-sm" weight="medium" className="line-clamp-2">
                                                        {module.description || module.title}
                                                    </Typography>
                                                    {module.description ? (
                                                        <Typography type="body-xs" color="muted" className="line-clamp-1">
                                                            {module.title}
                                                        </Typography>
                                                    ) : null}
                                                </div>
                                                <Chip size="sm" variant="soft" className="shrink-0">
                                                    {t("contentMap.lessonCount", {
                                                        done: module.lessons.filter((lesson) => lesson.isCompleted).length,
                                                        total: module.lessons.length,
                                                    })}
                                                </Chip>
                                                <Accordion.Indicator className="shrink-0" />
                                            </div>
                                        </Accordion.Trigger>
                                    </Accordion.Heading>
                                    <Accordion.Panel>
                                        <Accordion.Body>
                                            <div className="flex flex-col gap-1">
                                                {module.lessons.map((lesson) => (
                                                    <ContentMapLessonRow
                                                        key={lesson.id}
                                                        courseId={courseId}
                                                        courseRawId={course?.id}
                                                        courseTitle={course?.header.title ?? ""}
                                                        courseCoverUrl={course?.header.coverUrl}
                                                        lesson={lesson}
                                                        access={access}
                                                        isActive={lesson.id === contentId}
                                                        activeChallengeId={lesson.id === contentId ? challengeId : undefined}
                                                        onOpen={() => openLesson(lesson.id)}
                                                        lockedLabel={t("content.premium")}
                                                    />
                                                ))}
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )
                        })}
                    </Accordion>
                </AsyncContent>
            </ScrollShadow>
        </div>
    )
}

/** One lesson row — status icon, title, preview/lock badge, active tint. */
const ContentMapLessonRow = ({
    courseId,
    courseRawId,
    courseTitle,
    courseCoverUrl,
    lesson,
    access,
    isActive,
    activeChallengeId,
    onOpen,
    lockedLabel,
}: {
    courseId: string
    courseRawId: string | undefined
    courseTitle: string
    /** Course cover art — branded into the package-gate modal opened from a locked row. */
    courseCoverUrl: string | undefined
    lesson: LearnLesson
    /** The caller's own course access ({enrolled, purchased, fullAccess}); null for a guest. */
    access: CourseAccessStateView | null
    isActive: boolean
    /** The open challenge's routing id (slug or uuid) when this lesson is active, else undefined. */
    activeChallengeId: string | undefined
    onOpen: () => void
    lockedLabel: string
}) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const [gateOpen, setGateOpen] = useState(false)

    // Per-TYPE glyph for the default row state (video → play, document → sheet, materials
    // → paperclip). Completed/locked below stay STATE glyphs (tick / lock) — orthogonal to
    // type — so a row never loses its completion or lock signal.
    const LessonTypeIcon = lessonTypeIcon(lesson.contentType)

    const accessLevel = lesson.accessLevel
    const isLocked = lesson.isLocked
    const isPreview = accessLevel === "PREVIEW"
    const isFullyLocked = accessLevel === "NONE"
    /** The viewer already owns FULL/purchased access → no per-challenge gate needed. */
    const hasFullAccess = !!(access?.purchased || access?.fullAccess)
    /**
     * A NON-free challenge the viewer hasn't unlocked stays gated even on an accessible
     * (free/preview) lesson — the BE 403s the solver, so the row must show a lock and open
     * the package gate rather than route into a solver the viewer can't reach. Free
     * challenges are never gated here (predicate challenge-free-hardening).
     */
    const isChallengeLocked = (exercise: LearnExercise): boolean =>
        !exercise.free && !hasFullAccess
    /** This lesson carries a gated (non-free, unowned) challenge → mount the package gate. */
    const hasLockedChallenge = lesson.exercises.some(isChallengeLocked)

    const handleClick = () => {
        if (isFullyLocked) {
            setGateOpen(true)
            return
        }
        onOpen()
    }

    // A locked (NONE-access) lesson gates its child exercises too, and a non-free challenge
    // stays gated even on an accessible lesson — open the same package gate rather than
    // routing into a solver the viewer can't reach.
    const openExercise = (exercise: LearnExercise) => {
        if (isFullyLocked || isChallengeLocked(exercise)) {
            setGateOpen(true)
            return
        }
        router.push(exerciseHref(courseId, lesson.id, exercise))
    }

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                    isActive ? "bg-accent/10 text-accent" : "hover:bg-default/60",
                )}
            >
                {lesson.isCompleted ? (
                    <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-4 shrink-0 text-accent" />
                ) : isFullyLocked ? (
                    <LockSimpleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                ) : (
                    <LessonTypeIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                )}
                <div className="min-w-0 flex-1">
                    <Typography type="body-sm" weight="medium" className="line-clamp-2">
                        {lesson.description || lesson.title}
                    </Typography>
                    {lesson.description ? (
                        <Typography type="body-xs" color="muted" className="line-clamp-1">
                            {lesson.title}
                        </Typography>
                    ) : null}
                </div>
                {isPreview ? (
                    <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                        {t("content.previewBadge")}
                    </Chip>
                ) : isLocked ? (
                    <Chip size="sm" variant="soft" color="warning" className="shrink-0">
                        <span className="flex items-center gap-1">
                            <LockSimpleIcon aria-hidden focusable="false" className="size-3" />
                            {lockedLabel}
                        </span>
                    </Chip>
                ) : (
                    <Typography type="body-xs" color="muted" className="shrink-0">
                        {lesson.readTimeLabel}
                    </Typography>
                )}
            </button>
            {/* nested exercises — one indent level below the lesson, each routed to its
                per-type solver; a locked lesson gates them behind the same paywall */}
            {lesson.exercises.length > 0 ? (
                <div className="ml-3 flex flex-col gap-1 border-l border-default pl-2">
                    {lesson.exercises.map((exercise) => (
                        <ContentMapExerciseRow
                            key={`${exercise.kind}-${exercise.id}`}
                            exercise={exercise}
                            isActive={
                                activeChallengeId !== undefined
                                && (exercise.slug === activeChallengeId || exercise.id === activeChallengeId)
                            }
                            isLocked={isFullyLocked || isChallengeLocked(exercise)}
                            lockedLabel={lockedLabel}
                            onOpen={() => openExercise(exercise)}
                        />
                    ))}
                </div>
            ) : null}
            {courseRawId && (isFullyLocked || hasLockedChallenge) ? (
                <PackageGateModal
                    isOpen={gateOpen}
                    onClose={() => setGateOpen(false)}
                    courseId={courseId}
                    courseRawId={courseRawId}
                    courseTitle={courseTitle}
                    courseCoverUrl={courseCoverUrl}
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    packageSlugs={lesson.packageSlugs}
                    // A fully-locked lesson gates the whole document; an accessible lesson
                    // with a gated challenge upsells the challenge specifically.
                    context={isFullyLocked ? "document" : "challenge"}
                    onPurchased={() => { void revalidateLearnData(courseId) }}
                />
            ) : null}
        </>
    )
}

/**
 * One nested challenge child row under a lesson. A tick smaller/quieter than the
 * lesson row: a per-type solver icon + the title, tinted when its solver is the active
 * route. A locked parent shows the lock glyph and the click bubbles up to the shared
 * package gate (never routes into a gated solver).
 */
const ContentMapExerciseRow = ({
    exercise,
    isActive,
    isLocked,
    lockedLabel,
    onOpen,
}: {
    exercise: LearnExercise
    isActive: boolean
    isLocked: boolean
    /** Premium chip label shown when the exercise is gated. */
    lockedLabel: string
    onOpen: () => void
}) => {
    // A challenge keeps its per-type solver glyph (mcq / code / essay / uiux); locked
    // overrides it with the lock glyph.
    const solverKind = normalizeExerciseType(exercise.type)
    const Icon = isLocked ? LockSimpleIcon : exerciseSolverIcon(solverKind)
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors",
                isActive ? "bg-accent/10 text-accent" : "hover:bg-default/60",
            )}
        >
            <Icon
                aria-hidden
                focusable="false"
                className={cn("size-4 shrink-0", isActive ? "text-accent" : "text-muted")}
            />
            <Typography type="body-xs" weight="medium" className="min-w-0 flex-1 line-clamp-2">
                {exercise.title}
            </Typography>
            {isLocked ? (
                <Chip size="sm" variant="soft" color="warning" className="shrink-0">
                    <span className="flex items-center gap-1">
                        <LockSimpleIcon aria-hidden focusable="false" className="size-3" />
                        {lockedLabel}
                    </span>
                </Chip>
            ) : null}
        </button>
    )
}

/** Revalidates the learn course + lesson queries after a purchase from the outline. */
const revalidateLearnData = async (courseId: string) => {
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_LEARN_COURSE" && key[1] === courseId)
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_LEARN_LESSON")
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_COURSE_PROGRESS")
}

/** Content-map skeleton — mirrors a few accordion rows. */
const ContentMapSkeleton = () => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-2xl" />
        ))}
    </div>
)
