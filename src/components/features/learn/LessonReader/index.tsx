"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState, type Key } from "react"
import { Card, CardContent, Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, ClockIcon, FlameIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { mutate as globalMutate } from "swr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { usePostMarkLessonCompleteSwr } from "@/hooks/swr/api/rest/mutations/usePostMarkLessonCompleteSwr"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import type { ResponsiveBreadcrumbItem } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import { TabsCard, type TabsCardGroup } from "@/components/blocks/navigation/TabsCard"
import { CheckListCard, CheckListItem } from "@/components/blocks/cards/CheckListCard"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PressableCard } from "@/components/blocks/cards/PressableCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgrammingLanguageTabs } from "@/components/reuseable/ProgrammingLanguageTabs"
import { ProgrammingLanguageTabsVariant } from "@/components/reuseable/ProgrammingLanguageTabs/enums"
import { resolveActiveProgrammingLang } from "@/modules/types/utils/programming-language"
import { useRouter } from "@/i18n/navigation"
import {
    BookOpenIcon,
    CaretLeftIcon,
    CaretRightIcon,
    ListIcon,
    LockSimpleIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import { Button } from "@heroui/react"
import { useQueryLearnLessonSwr } from "../hooks/useQueryLearnLessonSwr"
import { useLearnSidebarStore } from "@/hooks/zustand/learnSidebar/store"
import { useCourseEnrollment } from "@/components/features/course/hooks/useCourseEnrollment"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { InteractionBar } from "@/components/reuseable/Discussion/InteractionBar"
import { useLessonReactionMock } from "./useLessonReactionMock"
import { LessonComments } from "./LessonComments"
import { LessonResourceLinks } from "./LessonResourceLinks"
import { LessonVideoBlock } from "./LessonVideoBlock"
import { LessonDocumentHtml } from "./LessonDocumentHtml"
import { LessonDocumentsBlock } from "./LessonDocumentsBlock"
import { SelectionHintCallout } from "./ContentAiSelectionAsk/SelectionHintCallout"
import { LessonAiStudy } from "./LessonAiStudy"

/** The two content views (reading vs challenges). */
type ContentView = "content" | "challenges"

/** Build the reader / challenge route for a lesson id shaped "m<n>-l<k>". */
const readerHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`
const challengeHref = (courseId: string, contentId: string) =>
    `/courses/${courseId}/learn/content/modules/${contentId.split("-")[0]}/contents/${contentId}/challenges/${contentId}-c`

/**
 * Extracts external links when a lesson body is essentially JUST link(s) — a URL (or
 * a few) with almost no other prose, the shape most migrated "Tài liệu / Link / Submit"
 * lessons take. Returns the URLs to render as resource cards, or an empty array for a
 * real written body (rendered as markdown as usual).
 */
const extractResourceLinks = (markdown: string): Array<string> => {
    const urls = markdown.match(/https?:\/\/[^\s)\]<>"']+/g) ?? []
    if (urls.length === 0) {
        return []
    }
    const prose = markdown
        .replace(/https?:\/\/[^\s)\]<>"']+/g, " ")
        .replace(/[[\]()`*_#>~|-]/g, " ")
        .replace(/\b(links?|tài liệu|tai lieu|submit|nộp bài|nop bai)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    return prose.length <= 24 ? urls : []
}

/**
 * Lesson reader (StarCI port). Owns lesson data + the tab navigation, then
 * delegates the header (breadcrumb + meta chips + outcomes), the content tab bar
 * (Content / Challenges + a language switcher on the right), the reading card
 * (`#lesson-article`, anchored headings, the selection-ask hint), a prev/next
 * pager and the per-lesson discussion to presentational children.
 *
 * The 3 rails (content-map left, on-this-page right) + the AI tutor FAB now live
 * in the route layout, so this feature renders only its centered reading column.
 * Premium bodies are gated (`select-none` + a paywall) — unlock by enrolling.
 */
export const LessonReader = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId, contentId } = useParams<{ courseId: string; contentId: string }>()
    const { lesson, error, mutate } = useQueryLearnLessonSwr(courseId, contentId)
    const { toggle: toggleSidebar } = useLearnSidebarStore()
    const { onEnroll, isEnrolling } = useCourseEnrollment(
        courseId,
        undefined,
        lesson ? { rawId: lesson.courseRawId, title: lesson.title } : undefined,
    )

    const [view, setView] = useState<ContentView>("content")
    const [lang, setLang] = useState("typescript")

    // Auto-completion wiring. The video player reports ≥50% watched via
    // `handleHalfWatched`; the per-lesson (keyed) <LessonCompletion> registers its
    // guarded fire into `fireRef`, so watching a video and leaving a document both
    // route through the same idempotent mark-complete.
    const fireRef = useRef<(() => void) | null>(null)
    const registerFire = useCallback((fn: (() => void) | null) => {
        fireRef.current = fn
    }, [])
    const handleHalfWatched = useCallback(() => {
        fireRef.current?.()
    }, [])

    const activeLang = resolveActiveProgrammingLang(lang, lesson?.availableLangs ?? [])
    const bodyMd = lesson?.bodyByLang[activeLang] ?? ""
    const isLocked = lesson?.isLocked ?? false
    /** A readable lesson whose reading card would be blank (no body, no HTML, no video). */
    const isReadingEmpty = !!lesson && !isLocked && !bodyMd && !lesson.documentHtml && !lesson.hasVideo
    /** External links when the body is essentially just link(s) → render as resource cards. */
    const resourceLinks = bodyMd ? extractResourceLinks(bodyMd) : []
    const isLinkOnly = resourceLinks.length > 0
    /** True when the lesson has real reading content (written body / HTML / resource links). */
    const hasWrittenBody = !!bodyMd || !!lesson?.documentHtml
    /** Draw the reading card only when there is something to put in it (else e.g. video-only). */
    const showReadingCard = !!lesson && (isLocked || hasWrittenBody || isReadingEmpty)

    /** Tier-1 breadcrumb (Courses › <course> › Modules › <lesson>). */
    const breadcrumbItems = useMemo<Array<ResponsiveBreadcrumbItem>>(
        () => [
            { key: "courses", label: t("nav.sections.content"), onPress: () => router.push(`/courses/${courseId}/learn/content`) },
            { key: "module", label: lesson?.moduleTitle ?? t("content.moduleTitle") },
        ],
        [t, router, courseId, lesson?.moduleTitle],
    )

    const hasChallenge = lesson?.hasChallenge ?? false

    /**
     * Left tab group: Content, plus Challenges only when the lesson actually has one
     * (an always-present challenges tab that dead-ends trains distrust — omit it).
     */
    const leftTabs = useMemo<TabsCardGroup>(
        () => ({
            ariaLabel: t("reader.tabListAria"),
            selectedKey: view,
            onSelectionChange: (key: Key) => setView(key as ContentView),
            items: [
                {
                    key: "content",
                    label: t("content.tabs.content"),
                    icon: <BookOpenIcon aria-hidden focusable="false" className="size-4 shrink-0" />,
                },
                ...(hasChallenge
                    ? [{
                        key: "challenges",
                        label: t("content.tabs.challenges"),
                        icon: <PuzzlePieceIcon aria-hidden focusable="false" className="size-4 shrink-0" />,
                    }]
                    : []),
            ],
        }),
        [t, view, hasChallenge],
    )

    return (
        <div className="flex flex-col gap-6">
            {/* header (tier 2) capped to the reading width */}
            <div className="mx-auto w-full max-w-3xl">
                <AsyncContent
                    isLoading={!lesson && !error}
                    skeleton={<HeaderSkeleton />}
                    error={!lesson ? error : undefined}
                    errorContent={{
                        title: t("reader.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    {lesson ? (
                        <div className="flex flex-col gap-6">
                            <PageHeader
                                breadcrumb={<ResponsiveBreadcrumb items={breadcrumbItems} />}
                                title={lesson.title}
                                description={lesson.description}
                                actions={(
                                    <div className="flex items-center gap-2">
                                        {lesson.nextId ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onPress={() => router.push(readerHref(courseId, lesson.nextId!))}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {t("reader.nextLesson")}
                                                    <CaretRightIcon aria-hidden focusable="false" className="size-4" />
                                                </span>
                                            </Button>
                                        ) : null}
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="tertiary"
                                            aria-label={t("reader.toggleSidebar")}
                                            onPress={toggleSidebar}
                                        >
                                            <ListIcon aria-hidden focusable="false" className="size-5" />
                                        </Button>
                                    </div>
                                )}
                                meta={lesson.minutesRead > 0 || lesson.challengeCount > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {lesson.minutesRead > 0 ? (
                                            <Chip size="sm" variant="soft">
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon aria-hidden focusable="false" className="size-3" />
                                                    {t("content.minutesRead", { minutes: lesson.minutesRead })}
                                                </span>
                                            </Chip>
                                        ) : null}
                                        {lesson.challengeCount > 0 ? (
                                            <Chip size="sm" variant="soft" color="accent">
                                                <span className="flex items-center gap-1">
                                                    <FlameIcon aria-hidden focusable="false" className="size-3" />
                                                    {t("content.challengeCount", { count: lesson.challengeCount })}
                                                </span>
                                            </Chip>
                                        ) : null}
                                    </div>
                                ) : undefined}
                            />
                            {lesson.outcomes.length > 0 ? (
                                <LabeledCard frameless label={t("content.outcomes")}>
                                    <CheckListCard>
                                        {lesson.outcomes.map((outcome) => (
                                            <CheckListItem key={outcome.id}>
                                                <Typography type="body-sm">{outcome.text}</Typography>
                                            </CheckListItem>
                                        ))}
                                    </CheckListCard>
                                </LabeledCard>
                            ) : null}
                        </div>
                    ) : null}
                </AsyncContent>
            </div>

            {/* tab bar — static chrome; shows immediately. Content tab carries a language switcher on the right. */}
            {lesson ? (
                <div className="mx-auto w-full max-w-3xl">
                    {/* only render the tab bar when there is a second (Challenges) tab —
                        a lone Content tab is noise */}
                    {hasChallenge ? <TabsCard leftTabs={leftTabs} /> : null}
                    {view === "content" && lesson.availableLangs.length > 1 ? (
                        <div className="mt-3">
                            <ProgrammingLanguageTabs
                                availableLangs={lesson.availableLangs}
                                selectedLang={activeLang}
                                onSelectLang={setLang}
                                ariaLabel={t("reader.languageSwitcher")}
                                variant={ProgrammingLanguageTabsVariant.Pill}
                            />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* body (tier 3) */}
            <AsyncContent
                isLoading={!lesson && !error}
                skeleton={(
                    <div className="mx-auto w-full max-w-3xl">
                        <Card>
                            <CardContent>
                                <Skeleton.Paragraph lines={6} />
                            </CardContent>
                        </Card>
                    </div>
                )}
                error={!lesson ? error : undefined}
                errorContent={{
                    title: t("reader.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                {lesson ? (
                    view === "content" ? (
                        <>
                            {/* video player (VIDEO lessons) + document attachments — above the article */}
                            {lesson.hasVideo ? (
                                <LessonVideoBlock videoRef={lesson.videoRef} onHalfWatched={handleHalfWatched} />
                            ) : null}
                            <LessonDocumentsBlock lessonId={contentId} />

                            {/* reading card — only when there is something to read (written body,
                                resource links, paywall, or the empty-state invitation). A video-only
                                lesson skips the card and shows just the reaction bar below. */}
                            {showReadingCard ? (
                                <div className="mx-auto w-full max-w-3xl">
                                    <Card>
                                        <CardContent>
                                            {/* selection-hint only where there is real selectable text */}
                                            {!isLocked && hasWrittenBody && !isLinkOnly ? <SelectionHintCallout /> : null}
                                            <div className="relative">
                                                <div id="lesson-article" className={cn("flex flex-col gap-4", isLocked && "select-none")}>
                                                    {isLinkOnly ? (
                                                        <LessonResourceLinks urls={resourceLinks} />
                                                    ) : bodyMd ? (
                                                        <MarkdownContent reading markdown={bodyMd} />
                                                    ) : lesson.documentHtml ? (
                                                        // Fallback for un-migrated lessons whose body still lives as HTML in `videoRef`.
                                                        <LessonDocumentHtml html={lesson.documentHtml} />
                                                    ) : isReadingEmpty ? (
                                                        <EmptyContent
                                                            icon={<BookOpenIcon aria-hidden focusable="false" className="size-8 text-muted" />}
                                                            title={t("content.empty2")}
                                                        />
                                                    ) : null}
                                                </div>
                                                {/* Medium-style teaser fade behind the paywall */}
                                                {isLocked ? (
                                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-surface/70 to-surface" />
                                                ) : null}
                                            </div>
                                            {/* one-tap reaction + view count for a finished, readable lesson */}
                                            {!isLocked && !isReadingEmpty ? (
                                                <LessonReactionFooter contentId={contentId} />
                                            ) : null}
                                            {isLocked ? (
                                                <div className="mt-6 flex flex-col items-start gap-3 border-t border-default pt-6">
                                                    <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                                                    <Typography type="body" weight="semibold">
                                                        {t("reader.lockedTitle")}
                                                    </Typography>
                                                    <Typography type="body-sm" color="muted">
                                                        {t("reader.lockedBody")}
                                                    </Typography>
                                                    <Button variant="primary" isPending={isEnrolling} onPress={() => onEnroll()}>
                                                        {t("reader.enrollCta")}
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : !isLocked ? (
                                // video-only lesson: no empty paper — just the reaction bar
                                <div className="mx-auto w-full max-w-3xl">
                                    <LessonReactionFooter contentId={contentId} />
                                </div>
                            ) : null}

                            {/* engagement + navigation OUTSIDE the reading card (hidden while locked) */}
                            {!isLocked ? (
                                <div className="flex flex-col gap-6 pb-6">
                                    <LessonCompletion
                                        key={contentId}
                                        contentId={contentId}
                                        hasVideo={lesson.hasVideo}
                                        isCompleted={lesson.isCompleted}
                                        registerFire={registerFire}
                                        className="mx-auto w-full max-w-3xl"
                                    />
                                    {/* on-demand AI study tools (note + flashcards) grounded on
                                        this lesson — VIDEO-lesson-only, still behind the lock gate */}
                                    {lesson.isVideoLesson ? (
                                        <LessonAiStudy contentId={contentId} className="mx-auto w-full max-w-3xl" />
                                    ) : null}
                                    <LessonComments courseId={courseId} contentId={contentId} className="mx-auto w-full max-w-3xl" />
                                    <LessonPager
                                        className="mx-auto w-full max-w-3xl"
                                        prevHref={lesson.prevId ? readerHref(courseId, lesson.prevId) : null}
                                        prevTitle={lesson.prevTitle}
                                        nextHref={lesson.nextId ? readerHref(courseId, lesson.nextId) : null}
                                        nextTitle={lesson.nextTitle}
                                    />
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="mx-auto w-full max-w-3xl">
                            <ChallengesView
                                courseId={courseId}
                                contentId={contentId}
                                hasChallenge={lesson.hasChallenge}
                                onOpen={() => router.push(challengeHref(courseId, contentId))}
                            />
                        </div>
                    )
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** Lesson-level reaction + view count in the reading card foot (mock-backed). */
const LessonReactionFooter = ({ contentId }: { contentId: string }) => {
    const { summary, react } = useLessonReactionMock(contentId)
    return (
        <div className="mt-6 border-t border-default pt-4">
            <InteractionBar summary={summary} onReact={react} viewCount={summary.viewCount} />
        </div>
    )
}

/**
 * Lesson completion — now fully automatic (no manual "Mark as complete" CTA).
 *
 *  - VIDEO lessons complete when the learner has watched ≥ 50% of the video: the
 *    player reports that through the parent's `onHalfWatched`, which the parent
 *    routes to this component's guarded `fire` via `registerFire`.
 *  - DOCUMENT lessons (no video) complete on EXIT — leaving the lesson (this keyed
 *    instance unmounts on a contentId change / route change) or closing the tab
 *    (`beforeunload`, best-effort).
 *
 * Idempotency: `completed` is SEEDED from the server (`isCompleted`), so a reload of
 * an already-complete lesson starts completed and never fires. `fire` is guarded by
 * both the seeded/live completed flag (via ref) and a per-session once-flag, then
 * revalidates every course-progress key so the rail meter + n/m counter advance.
 * Keyed on `contentId` by the caller, so each lesson gets its own guard + refs.
 */
const LessonCompletion = ({
    contentId,
    hasVideo,
    isCompleted,
    registerFire,
    className,
}: {
    contentId: string
    hasVideo: boolean
    isCompleted: boolean
    registerFire: (fn: (() => void) | null) => void
    className?: string
}) => {
    const t = useTranslations("learn")
    const mark = usePostMarkLessonCompleteSwr()
    const [completed, setCompleted] = useState(isCompleted)
    /** Per-session once-guard: never send twice for this lesson instance. */
    const firedRef = useRef(false)
    /** Latest known already-complete state — read inside fire / cleanup handlers. */
    const completedRef = useRef(isCompleted)
    completedRef.current = isCompleted || completed
    /** Stable trigger handle so `fire` doesn't churn while the mutation runs. */
    const triggerRef = useRef(mark.trigger)
    triggerRef.current = mark.trigger

    const fire = useCallback(async () => {
        // NEVER send if the lesson is already complete (server-seeded) or we already sent.
        if (completedRef.current || firedRef.current) {
            return
        }
        firedRef.current = true
        try {
            await triggerRef.current(contentId)
            setCompleted(true)
            // Revalidate any mounted course-progress query (the rail lives in another tree).
            await globalMutate((key) => Array.isArray(key) && key[0] === "GET_COURSE_PROGRESS")
        } catch {
            firedRef.current = false
        }
    }, [contentId])

    // Register this lesson's guarded fire so the video player's ≥50% signal reaches it.
    useEffect(() => {
        registerFire(() => void fire())
        return () => registerFire(null)
    }, [registerFire, fire])

    // Late server progress (query resolves after mount) flips us to completed.
    useEffect(() => {
        if (isCompleted) {
            setCompleted(true)
        }
    }, [isCompleted])

    // Document lessons: complete on exit. This instance is keyed on contentId, so the
    // cleanup runs when the learner navigates to another lesson / leaves the reader
    // ("next lesson", prev, rail, breadcrumb). `beforeunload` covers a tab close.
    useEffect(() => {
        if (hasVideo) {
            return
        }
        const mountedAt = Date.now()
        const onExit = () => void fire()
        window.addEventListener("beforeunload", onExit)
        return () => {
            window.removeEventListener("beforeunload", onExit)
            // Only treat this as a real "left the lesson" exit after a brief dwell — this
            // skips React StrictMode's immediate dev remount (whose cleanup runs within a
            // tick) and a sub-second glance-and-leave (no meaningful engagement).
            if (Date.now() - mountedAt > 800) {
                onExit()
            }
        }
    }, [hasVideo, fire])

    // No manual CTA — just a small, unobtrusive "already completed" indicator.
    if (!completed) {
        return null
    }
    return (
        <div className={cn("flex items-center justify-center gap-2 text-success", className)}>
            <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-5" />
            <Typography type="body-sm" weight="medium">
                {t("reader.completed")}
            </Typography>
        </div>
    )
}

/** Prev / next pager cards (StarCI port — prev left, next right). */
const LessonPager = ({
    className,
    prevHref,
    prevTitle,
    nextHref,
    nextTitle,
}: {
    className?: string
    prevHref: string | null
    prevTitle: string | null
    nextHref: string | null
    nextTitle: string | null
}) => {
    const t = useTranslations("learn")
    if (!prevHref && !nextHref) {
        return null
    }
    return (
        <div className={className}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {prevHref ? (
                    <PressableCard href={prevHref}>
                        <div className="flex items-center gap-2">
                            <CaretLeftIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                            <div className="flex min-w-0 flex-col">
                                <Typography type="body-xs" color="muted">
                                    {t("content.prevLesson")}
                                </Typography>
                                <Typography type="body-sm" weight="medium" className="line-clamp-2">
                                    {prevTitle}
                                </Typography>
                            </div>
                        </div>
                    </PressableCard>
                ) : (
                    <div />
                )}
                {nextHref ? (
                    <PressableCard href={nextHref} className="sm:col-start-2">
                        <div className="flex items-center justify-end gap-2">
                            <div className="flex min-w-0 flex-col items-end">
                                <Typography type="body-xs" color="muted">
                                    {t("content.nextLesson")}
                                </Typography>
                                <Typography type="body-sm" weight="medium" className="line-clamp-2 text-right">
                                    {nextTitle}
                                </Typography>
                            </div>
                            <CaretRightIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                        </div>
                    </PressableCard>
                ) : null}
            </div>
        </div>
    )
}

/** The Challenges view — a link into the auto-grading submission surface. */
const ChallengesView = ({
    courseId: _courseId,
    contentId: _contentId,
    hasChallenge,
    onOpen,
}: {
    courseId: string
    contentId: string
    hasChallenge: boolean
    onOpen: () => void
}) => {
    const t = useTranslations("learn")
    if (!hasChallenge) {
        return (
            <Typography type="body-sm" color="muted">
                {t("reader.noChallenge")}
            </Typography>
        )
    }
    return (
        <div className="flex flex-col items-start gap-3 rounded-3xl border border-default bg-surface p-6">
            <div className="flex items-center gap-2">
                <PuzzlePieceIcon aria-hidden focusable="false" className="size-6 text-accent" />
                <Typography type="body" weight="semibold">
                    {t("reader.challengeTitle")}
                </Typography>
            </div>
            <Typography type="body-sm" color="muted">
                {t("reader.challengeBody")}
            </Typography>
            <Button variant="primary" onPress={onOpen}>
                {t("reader.openChallenge")}
            </Button>
        </div>
    )
}

/** Header skeleton — mirrors title + description + meta chips. */
const HeaderSkeleton = () => (
    <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-7 w-2/3 rounded-large" />
        <Skeleton className="h-4 w-full rounded-md" />
        <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
        </div>
    </div>
)
