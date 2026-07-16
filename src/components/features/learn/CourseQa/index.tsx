"use client"

import React, { useCallback, useEffect, useRef, useState, type Key } from "react"
import { Button, Card, Typography } from "@heroui/react"
import { ArrowRightIcon, ChatsCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation"
import { QuestionRow } from "./QuestionRow"
import { CourseQaSkeleton } from "./CourseQaSkeleton"
import { useQueryCourseQuestionsSwr } from "./useQueryCourseQuestionsSwr"
import { QUESTIONS_PER_PAGE } from "./rollup"
import { CourseQuestionFilter, type CourseQuestion } from "./types"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import { usePostLessonCommentSwr } from "@/hooks/swr/api/rest/mutations/usePostLessonCommentSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { TabsCard } from "@/components/blocks/navigation/TabsCard"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { CommentComposer } from "@/components/reuseable/Discussion/CommentComposer"
import { useAppSelector } from "@/redux/hooks"

/** Debounce (ms) before a keystroke turns into a new search. */
const SEARCH_DEBOUNCE_MS = 300

/** URL `?filter=` values, in tab order. */
const FILTER_ORDER: ReadonlyArray<CourseQuestionFilter> = [
    CourseQuestionFilter.Unanswered,
    CourseQuestionFilter.Answered,
    CourseQuestionFilter.Mine,
    CourseQuestionFilter.All,
]

/** Coerce a raw `?filter=` into a valid filter (default: unanswered). */
const parseFilter = (raw: string | null): CourseQuestionFilter =>
    FILTER_ORDER.find((value) => value === raw) ?? CourseQuestionFilter.Unanswered

/** Props for {@link CourseQa}. */
export interface CourseQaProps {
    /**
     * When true, the component renders without its page chrome (`PageHeader`, outer
     * `max-w-3xl mx-auto`) so it can compose inline inside another surface such as
     * the lesson-reader discussion area.
     */
    embedded?: boolean
}

/**
 * Course-wide Q&A roll-up (lean FTES port of starci CourseQa, mock-backed): every
 * top-level question across the course's lessons with filter tabs (URL-synced on the
 * dedicated `/learn/qa` route, in-memory when `embedded`), debounced search, a
 * course-general composer, an answers thread per row, and an invitation empty-state
 * that funnels into the course content.
 *
 * Pagination is progressive: pressing "See more" appends the next page inline and
 * scrolls the new block into view, keeping the learner on the same surface.
 */
export const CourseQa = ({ embedded = false }: CourseQaProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { courseId } = useParams<{ courseId: string }>()
    const viewer = useAppSelector((state) => state.user.user)
    const currentUser = viewer ? { username: viewer.username, avatar: viewer.avatar } : null
    const currentUserId = viewer?.id ?? null

    const runRest = useRestWithToast()
    const post = usePostLessonCommentSwr()
    const [isPosting, setIsPosting] = useState(false)

    // Asking a Q&A question posts a real lesson comment, so the composer must pick a
    // target lesson (spec: Ask routes to a lesson comment). Options come from the tree.
    const { modules } = useQueryLearnCourseSwr(courseId)
    const lessonOptions = React.useMemo(
        () => modules.flatMap((module) => module.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title }))),
        [modules],
    )
    const [targetLessonId, setTargetLessonId] = useState("")
    useEffect(() => {
        if (!targetLessonId && lessonOptions.length > 0) {
            setTargetLessonId(lessonOptions[0].id)
        }
    }, [lessonOptions, targetLessonId])

    // Embedded mode keeps filter/search in local state so the reader URL stays clean.
    // The dedicated `/learn/qa` route still syncs the active filter to `?filter=`.
    const [embeddedFilter, setEmbeddedFilter] = useState(CourseQuestionFilter.Unanswered)
    const urlFilter = parseFilter(searchParams.get("filter"))
    const filter = embedded ? embeddedFilter : urlFilter

    const [searchInput, setSearchInput] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(timer)
    }, [searchInput])

    const [page, setPage] = useState(1)
    useEffect(() => {
        setPage(1)
    }, [filter, debouncedSearch])

    const { data, isLoading, isValidating, error, mutate } = useQueryCourseQuestionsSwr({
        courseId,
        filter,
        search: debouncedSearch,
        page,
        currentUserId,
    })

    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE))

    // Accumulate rows across pages for the progressive "See more" UX.
    const [allQuestions, setAllQuestions] = useState(data?.questions ?? [])
    const lastAppendedPageRef = useRef(0)
    const appendedBlockRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!data) {
            return
        }
        if (page === 1) {
            setAllQuestions(data.questions)
            lastAppendedPageRef.current = 1
            return
        }
        if (page > lastAppendedPageRef.current) {
            setAllQuestions((prev) => [...prev, ...data.questions])
            lastAppendedPageRef.current = page
            appendedBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
    }, [data, page])

    const onSelectFilter = useCallback(
        (key: Key) => {
            const next = key as CourseQuestionFilter
            if (embedded) {
                setEmbeddedFilter(next)
                return
            }
            const params = new URLSearchParams(searchParams.toString())
            params.set("filter", String(key))
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        },
        [embedded, pathname, router, searchParams],
    )

    const goToContent = useCallback(() => {
        if (embedded) {
            router.push(`/courses/${courseId}/learn/content`)
            return
        }
        router.push(pathname.replace(/\/qa$/, "/content"))
    }, [embedded, pathname, router, courseId])

    const onSubmitQuestion = useCallback(async (body: string) => {
        if (!viewer || !targetLessonId) {
            return
        }
        setIsPosting(true)
        const ok = await runRest(
            () => post.trigger({ lessonId: targetLessonId, request: { content: body } }),
            { successMessage: t("comments.posted") },
        )
        setIsPosting(false)
        if (ok !== null) {
            void mutate()
        }
    }, [viewer, targetLessonId, post, runRest, t, mutate])

    // Answering a question posts a reply on the SAME lesson comment (parentId = question.id).
    const onAnswer = useCallback(async (question: CourseQuestion, body: string) => {
        if (!viewer) {
            return
        }
        const ok = await runRest(
            () => post.trigger({ lessonId: question.lessonId, request: { parentId: question.id, content: body } }),
            { successMessage: t("comments.posted") },
        )
        if (ok !== null) {
            void mutate()
        }
    }, [viewer, post, runRest, t, mutate])

    const hasQuery = filter !== CourseQuestionFilter.All || debouncedSearch.trim().length > 0
    const isInvitationEmpty = !isLoading && !error && total === 0 && !hasQuery

    const filterTabs = FILTER_ORDER.map((value) => ({ key: value, label: t(`courseQa.filter.${value}`) }))

    const chromeClass = embedded ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-3xl flex-col gap-6"

    return (
        <div className={chromeClass}>
            {embedded ? null : (
                <PageHeader title={t("courseQa.title")} description={t("courseQa.description")} />
            )}

            {isInvitationEmpty ? (
                <Card>
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <ChatsCircleIcon aria-hidden focusable="false" className="size-8 text-muted" />
                        <div className="flex max-w-md flex-col gap-2">
                            <Typography type="body" weight="semibold">{t("courseQa.empty.title")}</Typography>
                            <Typography type="body-sm" color="muted">{t("courseQa.empty.hint")}</Typography>
                        </div>
                        <Button variant="primary" onPress={goToContent}>
                            <span className="flex items-center gap-1">
                                {t("courseQa.emptyCta")}
                                <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                            </span>
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        {viewer && lessonOptions.length > 0 ? (
                            <label className="flex flex-wrap items-center gap-2">
                                <Typography type="body-sm" color="muted" className="shrink-0">
                                    {t("courseQa.targetLessonLabel")}
                                </Typography>
                                {/* plain select — no HeroUI Select dependency (see BACKLOG) */}
                                <select
                                    aria-label={t("courseQa.targetLessonLabel")}
                                    value={targetLessonId}
                                    onChange={(event) => setTargetLessonId(event.target.value)}
                                    className="min-w-0 max-w-full rounded-large border border-default bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
                                >
                                    {lessonOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        <CommentComposer
                            collapsible
                            currentUser={currentUser}
                            placeholder={t("courseQa.composerPlaceholder")}
                            submitLabel={t("courseQa.composerSubmit")}
                            busy={isPosting}
                            onSubmit={(body) => { void onSubmitQuestion(body) }}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <TabsCard
                            leftTabs={{
                                items: filterTabs,
                                selectedKey: filter,
                                ariaLabel: t("courseQa.filterAria"),
                                onSelectionChange: onSelectFilter,
                            }}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <SearchInput
                                className="w-full sm:max-w-sm"
                                value={searchInput}
                                onValueChange={setSearchInput}
                                placeholder={t("courseQa.searchPlaceholder")}
                            />
                            <Typography type="body-sm" color="muted" className="shrink-0">
                                {t("courseQa.count", { count: total })}
                            </Typography>
                        </div>
                    </div>

                    <AsyncContent
                        isLoading={isLoading && allQuestions.length === 0}
                        skeleton={<CourseQaSkeleton />}
                        isEmpty={allQuestions.length === 0}
                        emptyContent={{ title: t("courseQa.searchEmpty") }}
                        error={allQuestions.length === 0 ? error : undefined}
                        errorContent={{
                            title: t("courseQa.loadError"),
                            onRetry: () => { void mutate() },
                            retryLabel: t("common.retry"),
                        }}
                    >
                        <div ref={appendedBlockRef} className="flex flex-col gap-3">
                            {allQuestions.map((question) => (
                                <QuestionRow
                                    key={question.id}
                                    question={question}
                                    currentUser={currentUser}
                                    onAnswer={(body) => { void onAnswer(question, body) }}
                                />
                            ))}

                            {page < totalPages ? (
                                <div className="flex items-center justify-center">
                                    <Button
                                        size="sm"
                                        variant="tertiary"
                                        isPending={isValidating}
                                        isDisabled={isValidating}
                                        onPress={() => setPage((p) => p + 1)}
                                    >
                                        {t("courseQa.seeMore")}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </AsyncContent>
                </div>
            )}
        </div>
    )
}

export default CourseQa
