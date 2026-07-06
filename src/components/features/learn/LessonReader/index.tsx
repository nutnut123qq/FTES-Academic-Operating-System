"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Tabs, Typography, cn } from "@heroui/react"
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ClockIcon,
    LockSimpleIcon,
    PlayCircleIcon,
    TargetIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { ProgrammingLanguageTabs } from "@/components/reuseable/ProgrammingLanguageTabs"
import { ProgrammingLanguageTabsVariant } from "@/components/reuseable/ProgrammingLanguageTabs/enums/programming-language-tabs-variant"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { resolveActiveProgrammingLang } from "@/modules/types/utils/programming-language"
import { useRouter } from "@/i18n/navigation"
import { useQueryLearnLessonSwr } from "../hooks/useQueryLearnLessonSwr"
import type { LessonBlock, LessonHeading } from "../hooks/useQueryLearnLessonSwr"
import { OnThisPage } from "./OnThisPage"
import { LessonComments } from "./LessonComments"
import { ContentAiPanel } from "./ContentAiPanel"
import { ContentAiSelectionAsk } from "./ContentAiSelectionAsk"

/** The two content views (reading vs challenges). */
type ContentView = "content" | "challenges"
const VIEWS: Array<ContentView> = ["content", "challenges"]

/** Build the reader route for a lesson id shaped "m<n>-l<k>". */
const readerHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/** Derive the TOC headings from the active-language body blocks. */
const headingsOf = (blocks: Array<LessonBlock>): Array<LessonHeading> =>
    blocks
        .filter((block) => block.kind === "heading")
        .map((block) => ({ id: block.id, text: block.text, level: block.level ?? 2 }))

/**
 * Lesson reader (priority 2). Center reading column + right "On this page" TOC.
 * Top: a video placeholder. Below: a Content / Challenges view switcher and a
 * TS / Java / C# / Go language switcher, the lesson body (`#lesson-article`,
 * anchored headings), a prev/next pager and the per-lesson comment section.
 *
 * Mounts the AI tutor FAB + panel and the selection-anchored "Ask AI about this"
 * button. Premium bodies are gated (`select-none` + a paywall notice) — unlock
 * by enrolling (rule premium-unlock-is-enroll).
 */
export const LessonReader = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId, contentId } = useParams<{ courseId: string; contentId: string }>()
    const { lesson, error, mutate } = useQueryLearnLessonSwr(courseId, contentId)

    const [view, setView] = useState<ContentView>("content")
    const [lang, setLang] = useState("typescript")

    const activeLang = resolveActiveProgrammingLang(lang, lesson?.availableLangs ?? [])
    const blocks = lesson?.bodyByLang[activeLang] ?? []
    const headings = useMemo(() => headingsOf(blocks), [blocks])

    const goTo = (id: string | null) => {
        if (id) {
            router.push(readerHref(courseId, id))
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0">
                <AsyncContent
                    isLoading={!lesson && !error}
                    skeleton={<ReaderSkeleton />}
                    error={!lesson ? error : undefined}
                    errorContent={{
                        title: t("reader.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    {lesson ? (
                        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                            {/* video placeholder */}
                            <div className="flex aspect-video w-full items-center justify-center rounded-large bg-default/40">
                                <PlayCircleIcon aria-hidden focusable="false" className="size-12 text-muted" />
                            </div>

                            {/* header */}
                            <div className="flex flex-col gap-2">
                                <Typography type="body-xs" color="muted">
                                    {lesson.moduleTitle}
                                </Typography>
                                <Typography type="h5" weight="bold">
                                    {lesson.title}
                                </Typography>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Chip size="sm" variant="soft">
                                        <span className="flex items-center gap-1">
                                            <ClockIcon aria-hidden focusable="false" className="size-4" />
                                            {lesson.readTimeLabel}
                                        </span>
                                    </Chip>
                                    {lesson.hasChallenge ? (
                                        <Chip size="sm" variant="soft" color="accent">
                                            <span className="flex items-center gap-1">
                                                <TargetIcon aria-hidden focusable="false" className="size-4" />
                                                {t("reader.hasChallenge")}
                                            </span>
                                        </Chip>
                                    ) : null}
                                </div>
                            </div>

                            {/* view switcher (Content / Challenges) */}
                            <ExtendedTabs
                                selectedKey={view}
                                onSelectionChange={(key) => setView(key as ContentView)}
                            >
                                <Tabs.ListContainer>
                                    <Tabs.List aria-label={t("reader.viewSwitcher")}>
                                        {VIEWS.map((key) => (
                                            <Tabs.Tab key={key} id={key}>
                                                {t(`reader.views.${key}`)}
                                            </Tabs.Tab>
                                        ))}
                                    </Tabs.List>
                                </Tabs.ListContainer>
                            </ExtendedTabs>

                            {/* language switcher */}
                            <ProgrammingLanguageTabs
                                availableLangs={lesson.availableLangs}
                                selectedLang={activeLang}
                                onSelectLang={setLang}
                                ariaLabel={t("reader.languageSwitcher")}
                                variant={ProgrammingLanguageTabsVariant.Pill}
                            />

                            {view === "content" ? (
                                <>
                                    {lesson.isLocked ? (
                                        <div className="flex flex-col items-start gap-3 rounded-3xl border border-default bg-surface p-6">
                                            <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                                            <Typography type="body" weight="semibold">
                                                {t("reader.lockedTitle")}
                                            </Typography>
                                            <Typography type="body-sm" color="muted">
                                                {t("reader.lockedBody")}
                                            </Typography>
                                            <Button
                                                variant="primary"
                                                onPress={() => router.push(`/courses/${courseId}/enroll`)}
                                            >
                                                {t("reader.enrollCta")}
                                            </Button>
                                        </div>
                                    ) : (
                                        <article id="lesson-article" className="flex flex-col gap-4">
                                            {blocks.map((block) => (
                                                <LessonBodyBlock key={block.id} block={block} />
                                            ))}
                                        </article>
                                    )}

                                    {/* pager */}
                                    <div className="flex items-center gap-3 border-t border-separator pt-6">
                                        <Button
                                            variant="ghost"
                                            isDisabled={!lesson.prevId}
                                            onPress={() => goTo(lesson.prevId)}
                                        >
                                            <ArrowLeftIcon aria-hidden focusable="false" className="size-5" />
                                            {t("reader.previous")}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="ml-auto"
                                            isDisabled={!lesson.nextId}
                                            onPress={() => goTo(lesson.nextId)}
                                        >
                                            {t("reader.next")}
                                            <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                                        </Button>
                                    </div>

                                    {/* comments */}
                                    <LessonComments courseId={courseId} contentId={contentId} />
                                </>
                            ) : (
                                <ChallengesView courseId={courseId} contentId={contentId} hasChallenge={lesson.hasChallenge} />
                            )}
                        </div>
                    ) : null}
                </AsyncContent>
            </div>

            {/* right TOC — only for the reading view */}
            <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
                {view === "content" && !lesson?.isLocked ? <OnThisPage headings={headings} /> : null}
            </aside>

            {/* AI tutor + selection-anchored ask */}
            {lesson ? (
                <>
                    <ContentAiPanel isLocked={lesson.isLocked} />
                    {!lesson.isLocked ? <ContentAiSelectionAsk /> : null}
                </>
            ) : null}
        </div>
    )
}

/** One rendered body block — anchored heading, paragraph, or code sample. */
const LessonBodyBlock = ({ block }: { block: LessonBlock }) => {
    if (block.kind === "heading") {
        return (
            <Typography
                id={block.id}
                type={block.level === 3 ? "h6" : "h5"}
                weight="bold"
                className={cn("scroll-mt-24", block.level === 3 && "text-muted-foreground")}
            >
                {block.text}
            </Typography>
        )
    }
    if (block.kind === "code") {
        return (
            <pre className="overflow-x-auto rounded-2xl bg-default/60 p-4">
                <code className="text-sm">{block.text}</code>
            </pre>
        )
    }
    return (
        <Typography type="body-sm" color="muted" className="leading-relaxed">
            {block.text}
        </Typography>
    )
}

/** The Challenges view — a link into the auto-grading submission surface. */
const ChallengesView = ({
    courseId,
    contentId,
    hasChallenge,
}: {
    courseId: string
    contentId: string
    hasChallenge: boolean
}) => {
    const t = useTranslations("learn")
    const router = useRouter()
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
                <TargetIcon aria-hidden focusable="false" className="size-6 text-accent" />
                <Typography type="body" weight="semibold">
                    {t("reader.challengeTitle")}
                </Typography>
            </div>
            <Typography type="body-sm" color="muted">
                {t("reader.challengeBody")}
            </Typography>
            <Button
                variant="primary"
                onPress={() =>
                    router.push(
                        `/courses/${courseId}/learn/content/modules/${contentId.split("-")[0]}/contents/${contentId}/challenges/${contentId}-c`,
                    )
                }
            >
                {t("reader.openChallenge")}
            </Button>
        </div>
    )
}

/** Reader skeleton — mirrors video + header + tabs + body. */
const ReaderSkeleton = () => (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="aspect-video w-full rounded-large" />
        <Skeleton className="h-7 w-1/2 rounded-large" />
        <Skeleton className="h-8 w-64 rounded-large" />
        <Skeleton.Paragraph lines={5} />
    </div>
)
