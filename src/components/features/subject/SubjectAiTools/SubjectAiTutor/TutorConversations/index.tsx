"use client"

import React from "react"
import { Button, ScrollShadow, Typography, cn } from "@heroui/react"
import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { SearchInput } from "@/components/reuseable/SearchInput"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { usePostArchiveAiSessionSwr } from "@/hooks/swr/api/rest/mutations/usePostArchiveAiSessionSwr"
import type { AiSessionView } from "@/modules/api/rest/ai"

import { ToolSurfaceHeader } from "../../ToolSurfaceHeader"
import {
    TUTOR_SESSIONS_PAGE_SIZE,
    useTutorSessionsInfiniteSwr,
} from "../useSubjectTutorSwr"

/** Props for {@link TutorConversations}. */
export interface TutorConversationsProps {
    /**
     * UUID of the subject whose conversations are listed — the value stored in each
     * session's `context_ref`, NOT the code from the route.
     */
    subjectUuid: string
    /** Currently open session (highlighted in the list). */
    activeSessionId: string | null
    /** Back to the chat view. */
    onBack: () => void
    /** Start a fresh (not-yet-created) conversation. */
    onNew: () => void
    /** Open an existing session. */
    onSwitch: (sessionId: string) => void
    /** Fired after a session was archived (so the parent can drop it if it was open). */
    onDeleted?: (sessionId: string) => void
}

/**
 * In-panel conversations view backed by the BE
 * (`GET /api/v1/ai/sessions?feature=TUTOR_CHAT`, recency-first, infinite scroll):
 * search + new-conversation + per-row delete (`DELETE /ai/sessions/{id}` =
 * archive) + empty/error states. Renders in-place (no overlay stacked over the
 * tool surface).
 *
 * The list is scoped to THIS subject server-side (`subjectId` + `status=ACTIVE`),
 * so nothing from another subject shows up and archived rows never come back.
 *
 * One backend gap remains, handled by degrading rather than faking: there is no
 * server-side search, so the search box filters the pages already loaded (by
 * title) instead of querying.
 */
export const TutorConversations = ({
    subjectUuid,
    activeSessionId,
    onBack,
    onNew,
    onSwitch,
    onDeleted,
}: TutorConversationsProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const [query, setQuery] = React.useState("")
    const [deleteError, setDeleteError] = React.useState(false)
    const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)

    const sessionsSwr = useTutorSessionsInfiniteSwr(subjectUuid)
    const archiveSwr = usePostArchiveAiSessionSwr()

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    const pages = sessionsSwr.data ?? []
    const sessions: Array<AiSessionView> = pages.flat()
    const lastPage = pages[pages.length - 1]
    const hasMore = !!lastPage && lastPage.length >= TUTOR_SESSIONS_PAGE_SIZE

    // `status=ACTIVE` already keeps archived rows out server-side; the same predicate is
    // kept here so a row archived optimistically stays gone until the refetch lands.
    // Empty (never-used) sessions — what a lazy create leaves behind when the first send
    // never happened — are hidden too.
    const needle = query.trim().toLowerCase()
    const visible = sessions
        .filter((session) => session.status !== "ARCHIVED")
        .filter((session) => (session.messageCount ?? 0) > 0)
        .filter(
            (session) =>
                !needle || (session.title ?? "").toLowerCase().includes(needle),
        )

    /** Optimistic archive: drop the row, then reconcile with the server. */
    const onDelete = async (sessionId: string) => {
        setDeleteError(false)
        setPendingDeleteId(sessionId)
        await sessionsSwr.mutate(
            (current) =>
                current?.map((page) =>
                    page.filter((session) => session.id !== sessionId),
                ),
            { revalidate: false },
        )
        try {
            await archiveSwr.trigger(sessionId)
            onDeleted?.(sessionId)
        } catch {
            // rollback = refetch the truth
            setDeleteError(true)
        } finally {
            setPendingDeleteId(null)
            void sessionsSwr.mutate()
        }
    }

    return (
        <div className="flex h-full flex-col gap-3 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tutor.conversations")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
                trailing={
                    <Button size="sm" variant="secondary" onPress={onNew}>
                        <PlusIcon
                            className="size-5"
                            aria-hidden
                            focusable="false"
                        />
                        {t("subjects.aiTools.tutor.newConversation")}
                    </Button>
                }
            />

            <SearchInput
                variant="secondary"
                value={query}
                onValueChange={setQuery}
                placeholder={t("subjects.aiTools.tutor.searchConversations")}
                className="sm:max-w-none"
            />

            <Typography type="body-xs" color="muted">
                {t("subjects.aiTools.tutor.subjectOnlyHint")}
            </Typography>

            {deleteError ? (
                <Typography type="body-sm" className="text-danger">
                    {t("subjects.aiTools.tutor.deleteError")}
                </Typography>
            ) : null}

            <AsyncContent
                isLoading={sessionsSwr.isLoading && sessions.length === 0}
                skeleton={
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-1 rounded-2xl border border-default p-3"
                            >
                                <Skeleton.Typography type="body-sm" width="2/3" />
                                <Skeleton.Typography type="body-xs" width="1/3" />
                            </div>
                        ))}
                    </div>
                }
                error={sessions.length === 0 ? sessionsSwr.error : undefined}
                errorContent={{
                    title: t("subjects.aiTools.errorTitle"),
                    onRetry: () => {
                        void sessionsSwr.mutate()
                    },
                    retryLabel: t("subjects.aiTools.retry"),
                }}
            >
                {visible.length === 0 ? (
                    <EmptyContent
                        title={t("subjects.aiTools.tutor.noConversations")}
                        onRetry={onNew}
                        retryLabel={t("subjects.aiTools.tutor.newConversation")}
                    />
                ) : (
                    <ScrollShadow
                        hideScrollBar
                        className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1"
                    >
                        <div className="flex flex-col gap-2">
                            {visible.map((session) => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "flex items-center gap-2 rounded-2xl border border-default p-3",
                                        session.id === activeSessionId &&
                                            "bg-accent/10",
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSwitch(session.id)}
                                        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                    >
                                        <Typography
                                            type="body-sm"
                                            weight="medium"
                                            className="truncate"
                                        >
                                            {session.title ??
                                                t("subjects.aiTools.tutor.untitled")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {t("subjects.aiTools.tutor.turnsCount", {
                                                count: session.messageCount ?? 0,
                                            })}
                                        </Typography>
                                    </button>
                                    <Button
                                        size="sm"
                                        variant="tertiary"
                                        isIconOnly
                                        isPending={pendingDeleteId === session.id}
                                        isDisabled={pendingDeleteId !== null}
                                        aria-label={t(
                                            "subjects.aiTools.tutor.deleteConversation",
                                        )}
                                        onPress={() => {
                                            void onDelete(session.id)
                                        }}
                                    >
                                        <TrashIcon
                                            className="size-5"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    </Button>
                                </div>
                            ))}
                            <InfiniteScrollSentinel
                                onReach={() => {
                                    void sessionsSwr.setSize(
                                        (size) => size + 1,
                                    )
                                }}
                                disabled={!hasMore || sessionsSwr.isValidating}
                            />
                        </div>
                    </ScrollShadow>
                )}
            </AsyncContent>
        </div>
    )
}
