"use client"

import React from "react"
import { Button, Typography, cn } from "@heroui/react"
import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { SearchInput } from "@/components/reuseable/SearchInput"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { useSubjectAiStore } from "@/hooks/zustand/subjectAi"

import { ToolSurfaceHeader } from "../../ToolSurfaceHeader"

/** Props for {@link TutorConversations}. */
export interface TutorConversationsProps {
    subjectId: string
    /** Back to the chat view. */
    onBack: () => void
    /** Start a fresh (uncreated) conversation. */
    onNew: () => void
    /** Open an existing session. */
    onSwitch: (sessionId: string) => void
}

/**
 * In-panel conversations view: recency list of non-empty sessions + search +
 * new-conversation + per-row delete + empty state. Renders in-place (no overlay
 * stacked over the tool surface).
 */
export const TutorConversations = ({
    subjectId,
    onBack,
    onNew,
    onSwitch,
}: TutorConversationsProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const sessions = useSubjectAiStore(
        (s) => s.sessionsBySubject[subjectId] ?? [],
    )
    const deleteSession = useSubjectAiStore((s) => s.deleteSession)

    const [query, setQuery] = React.useState("")

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    // hide empty sessions; most-recent first; filter by title/content
    const visible = sessions
        .filter((session) => session.messages.length > 0)
        .filter((session) => {
            if (!query.trim()) return true
            const needle = query.trim().toLowerCase()
            const haystack = [
                session.title ?? "",
                ...session.messages.map((m) => m.content),
            ]
                .join(" ")
                .toLowerCase()
            return haystack.includes(needle)
        })
        .sort((a, b) => b.updatedAt - a.updatedAt)

    return (
        <div className="flex flex-col gap-3 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tutor.conversations")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
                trailing={
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={onNew}
                    >
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

            {visible.length === 0 ? (
                <EmptyContent
                    title={t("subjects.aiTools.tutor.noConversations")}
                    onRetry={onNew}
                    retryLabel={t("subjects.aiTools.tutor.newConversation")}
                />
            ) : (
                <div className="flex flex-col gap-2">
                    {visible.map((session) => (
                        <div
                            key={session.id}
                            className={cn(
                                "flex items-center gap-2 rounded-2xl border border-default p-3",
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
                                        count: session.messages.length,
                                    })}
                                </Typography>
                            </button>
                            <Button
                                size="sm"
                                variant="tertiary"
                                isIconOnly
                                aria-label={t(
                                    "subjects.aiTools.tutor.deleteConversation",
                                )}
                                onPress={() =>
                                    deleteSession(subjectId, session.id)
                                }
                            >
                                <TrashIcon
                                    className="size-5"
                                    aria-hidden
                                    focusable="false"
                                />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
