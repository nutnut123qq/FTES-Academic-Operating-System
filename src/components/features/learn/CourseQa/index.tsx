"use client"

import React, { useCallback, useEffect, useState, type Key } from "react"
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

/**
 * Course-wide Q&A roll-up (lean FTES port of starci CourseQa, mock-backed): every
 * top-level question across the course's lessons with filter tabs (URL-synced),
 * debounced search, a course-general composer, an answers thread per row, and an
 * invitation empty-state that funnels into the course content.
 */
export const CourseQa = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { courseId } = useParams<{ courseId: string }>()
    const viewer = useAppSelector((state) => state.user.user)
    const currentUser = viewer ? { username: viewer.username, avatar: viewer.avatar } : null
    const currentUserId = viewer?.id ?? null

    const [isPosting, setIsPosting] = useState(false)
    const filter = parseFilter(searchParams.get("filter"))

    const [searchInput, setSearchInput] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(timer)
    }, [searchInput])

    const [page, setPage] = useState(1)
    useEffect(() => { setPage(1) }, [filter, debouncedSearch])

    const { data, isLoading, error, mutate } = useQueryCourseQuestionsSwr({
        courseId,
        filter,
        search: debouncedSearch,
        page,
        currentUserId,
    })

    const questions = data?.questions ?? []
    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE))

    const onSelectFilter = useCallback(
        (key: Key) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("filter", String(key))
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        },
        [pathname, router, searchParams],
    )

    const goToContent = useCallback(() => {
        router.push(pathname.replace(/\/qa$/, "/content"))
    }, [pathname, router])

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

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <PageHeader title={t("courseQa.title")} description={t("courseQa.description")} />

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
                        isLoading={isLoading && questions.length === 0}
                        skeleton={<CourseQaSkeleton />}
                        isEmpty={questions.length === 0}
                        emptyContent={{ title: t("courseQa.searchEmpty") }}
                        error={questions.length === 0 ? error : undefined}
                        errorContent={{
                            title: t("courseQa.loadError"),
                            onRetry: () => { void mutate() },
                            retryLabel: t("common.retry"),
                        }}
                    >
                        <div className="flex flex-col gap-3">
                            {questions.map((question) => (
                                <QuestionRow
                                    key={question.id}
                                    question={question}
                                    currentUser={currentUser}
                                    onAnswer={(body) => onAnswer(question.id, body)}
                                />
                            ))}

                            {totalPages > 1 ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Button size="sm" variant="tertiary" isDisabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
                                        {t("comments.prev")}
                                    </Button>
                                    <Typography type="body-xs" color="muted">
                                        {t("comments.pageOf", { page, total: totalPages })}
                                    </Typography>
                                    <Button size="sm" variant="tertiary" isDisabled={page >= totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                        {t("comments.next")}
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
