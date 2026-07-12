"use client"

import React, { useCallback, useEffect, useRef, useState, type Key } from "react"
import { Button, Card, Typography } from "@heroui/react"
import { ArrowRightIcon, ChatsCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation"
import { QuestionRow } from "./QuestionRow"
import { CourseQaSkeleton } from "./CourseQaSkeleton"
import { useQueryCourseQuestionsSwr } from "./useQueryCourseQuestionsSwr"
import { addCourseAnswer, addCourseQuestion, QUESTIONS_PER_PAGE } from "./mock"
import { CourseQuestionFilter } from "./types"
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

    const [isPosting, setIsPosting] = useState(false)

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

    const onSubmitQuestion = useCallback((body: string) => {
        if (!viewer) {
            return
        }
        setIsPosting(true)
        addCourseQuestion({
            courseId,
            body,
            authorId: viewer.id,
            authorName: viewer.displayName ?? viewer.username,
            authorUsername: viewer.username,
        })
        void mutate().finally(() => setIsPosting(false))
    }, [courseId, viewer, mutate])

    const onAnswer = useCallback((questionId: string, body: string) => {
        if (!viewer) {
            return
        }
        addCourseAnswer({
            courseId,
            questionId,
            body,
            authorName: viewer.displayName ?? viewer.username,
            authorUsername: viewer.username,
        })
        void mutate()
    }, [courseId, viewer, mutate])

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
                    <CommentComposer
                        collapsible
                        currentUser={currentUser}
                        placeholder={t("courseQa.composerPlaceholder")}
                        submitLabel={t("courseQa.composerSubmit")}
                        busy={isPosting}
                        onSubmit={(body) => onSubmitQuestion(body)}
                    />

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
                                    onAnswer={(body) => onAnswer(question.id, body)}
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
