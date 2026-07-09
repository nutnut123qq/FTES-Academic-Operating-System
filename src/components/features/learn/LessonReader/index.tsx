"use client"

import React, { useMemo, useState, type Key } from "react"
import { Card, CardContent, Chip, Typography, cn } from "@heroui/react"
import { ClockIcon, FlameIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
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
    LockSimpleIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import { Button } from "@heroui/react"
import { useQueryLearnLessonSwr } from "../hooks/useQueryLearnLessonSwr"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { LessonComments } from "./LessonComments"
import { LessonVideoBlock } from "./LessonVideoBlock"
import { LessonDocumentHtml } from "./LessonDocumentHtml"
import { LessonDocumentsBlock } from "./LessonDocumentsBlock"
import { SelectionHintCallout } from "./ContentAiSelectionAsk/SelectionHintCallout"

/** The two content views (reading vs challenges). */
type ContentView = "content" | "challenges"

/** Build the reader / challenge route for a lesson id shaped "m<n>-l<k>". */
const readerHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`
const challengeHref = (courseId: string, contentId: string) =>
    `/courses/${courseId}/learn/content/modules/${contentId.split("-")[0]}/contents/${contentId}/challenges/${contentId}-c`

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

    const [view, setView] = useState<ContentView>("content")
    const [lang, setLang] = useState("typescript")

    const activeLang = resolveActiveProgrammingLang(lang, lesson?.availableLangs ?? [])
    const bodyMd = lesson?.bodyByLang[activeLang] ?? ""
    const isLocked = lesson?.isLocked ?? false

    /** Tier-1 breadcrumb (Courses › <course> › Modules › <lesson>). */
    const breadcrumbItems = useMemo<Array<ResponsiveBreadcrumbItem>>(
        () => [
            { key: "courses", label: t("nav.sections.content"), onPress: () => router.push(`/courses/${courseId}/learn/content`) },
            { key: "module", label: lesson?.moduleTitle ?? t("content.moduleTitle") },
        ],
        [t, router, courseId, lesson?.moduleTitle],
    )

    /** Left tab group: Content / Challenges (Challenges locked on premium). */
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
                {
                    key: "challenges",
                    label: t("content.tabs.challenges"),
                    icon: <PuzzlePieceIcon aria-hidden focusable="false" className="size-4 shrink-0" />,
                },
            ],
        }),
        [t, view],
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
                        <div className="flex flex-col gap-10">
                            <PageHeader
                                breadcrumb={<ResponsiveBreadcrumb items={breadcrumbItems} />}
                                title={lesson.title}
                                description={lesson.description}
                                meta={(
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Chip size="sm" variant="soft">
                                            <span className="flex items-center gap-1">
                                                <ClockIcon aria-hidden focusable="false" className="size-3" />
                                                {t("content.minutesRead", { minutes: lesson.minutesRead })}
                                            </span>
                                        </Chip>
                                        <Chip size="sm" variant="soft" color="accent">
                                            <span className="flex items-center gap-1">
                                                <FlameIcon aria-hidden focusable="false" className="size-3" />
                                                {t("content.challengeCount", { count: lesson.challengeCount })}
                                            </span>
                                        </Chip>
                                    </div>
                                )}
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
                    <TabsCard leftTabs={leftTabs} />
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
                            {lesson.hasVideo ? <LessonVideoBlock videoRef={lesson.videoRef} /> : null}
                            <LessonDocumentsBlock lessonId={contentId} />

                            {/* reading card — the "paper" surface with the anchored article */}
                            <div className="mx-auto w-full max-w-3xl">
                                <Card>
                                    <CardContent>
                                        {!isLocked ? <SelectionHintCallout /> : null}
                                        <div className="relative">
                                            <div id="lesson-article" className={cn("flex flex-col gap-4", isLocked && "select-none")}>
                                                {bodyMd ? (
                                                    <MarkdownContent reading markdown={bodyMd} />
                                                ) : lesson.documentHtml ? (
                                                    // Fallback for un-migrated lessons whose body still lives as HTML in `videoRef`.
                                                    <LessonDocumentHtml html={lesson.documentHtml} />
                                                ) : null}
                                            </div>
                                            {/* Medium-style teaser fade behind the paywall */}
                                            {isLocked ? (
                                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-surface/70 to-surface" />
                                            ) : null}
                                        </div>
                                        {isLocked ? (
                                            <div className="mt-6 flex flex-col items-start gap-3 border-t border-default pt-6">
                                                <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                                                <Typography type="body" weight="semibold">
                                                    {t("reader.lockedTitle")}
                                                </Typography>
                                                <Typography type="body-sm" color="muted">
                                                    {t("reader.lockedBody")}
                                                </Typography>
                                                <Button variant="primary" onPress={() => router.push(`/courses/${courseId}/enroll`)}>
                                                    {t("reader.enrollCta")}
                                                </Button>
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* engagement + navigation OUTSIDE the reading card (hidden while locked) */}
                            {!isLocked ? (
                                <div className="flex flex-col gap-6 pb-6">
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
