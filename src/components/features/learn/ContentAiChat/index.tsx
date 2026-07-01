"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    Button,
    Label,
    Link,
    ScrollShadow,
    Typography,
    cn,
} from "@heroui/react"
import {
    ArrowLeftIcon,
    CaretDownIcon,
    ChatsCircleIcon,
    GearIcon,
    PaperPlaneTiltIcon,
    PlusIcon,
    QuotesIcon,
    TrashIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { useAppSelector } from "@/redux/hooks"
import {
    useContentAiSelectedModel,
    useContentAiSelection,
} from "@/hooks/zustand/overlay/hooks"
import { useContentAiStream } from "@/hooks/socketio/useContentAiStream"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import {
    GradeModelDropdown,
    type GradeModelSelection,
} from "@/components/blocks/grading/GradeModelDropdown"
import { pathConfig } from "@/resources/path"
import { useQueryContentAiHistorySwr } from "@/hooks/swr/api/graphql/queries/useQueryContentAiHistorySwr"
import { useQueryContentAiSessionsSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentAiSessionsSwr"
import {
    CONTENT_AI_SESSIONS_PAGE_LIMIT,
    useQueryContentAiSessionsInfiniteSwr,
} from "@/hooks/swr/api/graphql/queries/useQueryContentAiSessionsInfiniteSwr"
import { useMutateCreateContentAiSessionSwr } from "@/hooks/swr/api/graphql/mutations/useMutateCreateContentAiSessionSwr"
import { useMutateClearContentAiHistorySwr } from "@/hooks/swr/api/graphql/mutations/useMutateClearContentAiHistorySwr"
import { useMutateTouchContentAiSessionSwr } from "@/hooks/swr/api/graphql/mutations/useMutateTouchContentAiSessionSwr"
import { ChatBubble, type ChatRole } from "@/components/blocks/feed/ChatBubble"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"

/** Props for {@link ContentAiChat}. */
export type ContentAiChatProps = WithClassNames<undefined>

/** Generic starter questions shown in the empty chat (i18n keys under `contentAi.suggestions`). */
const SUGGESTION_KEYS = ["summarize", "hardest", "example", "remember"] as const

/** Scoped quick-asks shown when a lesson passage is selected (keys under `contentAi.selectionSuggestions`). */
const SELECTION_SUGGESTION_KEYS = ["explain", "example", "simplify"] as const

/** Extract the visible `<display>…</display>` part of a message (hides `<context>` from the UI). */
const DISPLAY_RE = /<display>([\s\S]*?)<\/display>/
const displayText = (content: string): string => {
    const match = content.match(DISPLAY_RE)
    return match ? match[1].trim() : content
}

/** Which in-panel view is showing. Conversations + settings are in-panel (not
 * separate overlays) so they never z-fight the chat popover they live inside. */
type PanelView = "chat" | "conversations" | "settings"

/** One turn in the content-AI conversation. */
interface ChatMessage {
    /** Author of the turn. */
    role: ChatRole
    /** The message text (assistant content may be markdown). */
    content: string
}

/**
 * Content-AI chat thread + composer (the body of the ask-AI popover/drawer).
 * A lesson can hold MANY named conversations (e.g. one about nginx, one about
 * kafka): the thread is a **session** persisted server-side (scoped to the
 * learner's enrollment), switchable + searchable via the in-panel conversations
 * view. Recent turns are replayed as short-term memory on each question; the
 * answer **streams** token-by-token over the `/content_ai` socket on the free
 * model (self-hosted Qwen — no AI credit).
 *
 * @param props - {@link ContentAiChatProps}
 */
export const ContentAiChat = ({ className }: ContentAiChatProps) => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()
    const contentId = useAppSelector((state) => state.content.id)
    const { ask, abort } = useContentAiStream()
    const [messages, setMessages] = useState<Array<ChatMessage>>([])
    const [input, setInput] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    // lesson passage the learner highlighted to ask about (set by ContentAiSelectionAsk)
    const { selection, selectionContext, setSelection } = useContentAiSelection()

    // which conversation (session) is open + which in-panel view is showing
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [view, setView] = useState<PanelView>("chat")
    const [searchTerm, setSearchTerm] = useState("")

    // every available model — the picker shows them all (Free is the chatbot's
    // normal lane here, NOT flagged danger; higher tiers gate on the unlock)
    const aiModelsSwr = useQueryAiModelsSwr()
    const models = useMemo(
        () => (aiModelsSwr.data?.aiModels?.data?.gradableModels ?? [])
            .filter((model) => model.available),
        [aiModelsSwr.data],
    )
    const myAiSettingsSwr = useQueryMyAiSettingsSwr()
    // unlocked (paid OR enrolled) → may pin higher-tier models
    const canPremium = Boolean(myAiSettingsSwr.data?.canPremium)
    const { selectedModel, setSelectedModel } = useContentAiSelectedModel()
    // default = Auto (no concrete model pinned); a picked model runs Premium when unlocked
    const modelSelection = useMemo<GradeModelSelection>(() => {
        if (!selectedModel) {
            return {
                mode: AiMode.Auto,
                model: null,
                provider: null,
            }
        }
        const found = models.find((model) => model.model === selectedModel)
        return {
            mode: canPremium ? AiMode.Premium : AiMode.Auto,
            model: selectedModel,
            provider: found?.provider ?? null,
        }
    }, [selectedModel, models, canPremium])

    // recent conversations for the header (auto-select most recent + current title)
    const sessionsSwr = useQueryContentAiSessionsSwr(contentId)
    // the conversations view list is paginated/infinite (mirror followers infinite)
    const sessionsInfinite = useQueryContentAiSessionsInfiniteSwr(
        contentId,
        searchTerm,
        view === "conversations",
    )
    // saved turns of the OPEN conversation
    const historySwr = useQueryContentAiHistorySwr(currentSessionId ?? undefined)
    const createSwr = useMutateCreateContentAiSessionSwr()
    const deleteSwr = useMutateClearContentAiHistorySwr()
    const touchSwr = useMutateTouchContentAiSessionSwr()

    const hydratedRef = useRef<string | undefined>(undefined)
    const contentSelectedRef = useRef<string | undefined>(undefined)
    const prevContentIdRef = useRef<string | undefined>(undefined)
    // bottom anchor — follow the answer to the bottom as it streams in
    const bottomAnchorRef = useRef<HTMLDivElement>(null)

    // a new content resets everything (thread, open session, view, search)
    useEffect(() => {
        abort()
        setMessages([])
        setInput("")
        setIsStreaming(false)
        setCurrentSessionId(null)
        setView("chat")
        setSearchTerm("")
        hydratedRef.current = undefined
        contentSelectedRef.current = undefined
    }, [contentId, abort])

    // once the lesson's conversations load, reopen the most recent one — opening a
    // chat bumps its recency server-side (touchSession), so "most recent" = the
    // last conversation the user read (persisted in the DB, not the browser)
    useEffect(() => {
        if (!contentId || contentSelectedRef.current === contentId || sessionsSwr.data === undefined) {
            return
        }
        setCurrentSessionId(sessionsSwr.data[0]?.id ?? null)
        contentSelectedRef.current = contentId
    }, [contentId, sessionsSwr.data])

    // clear a stale selected passage only when the content ACTUALLY changes
    useEffect(() => {
        if (prevContentIdRef.current !== undefined && prevContentIdRef.current !== contentId) {
            setSelection(null)
        }
        prevContentIdRef.current = contentId
    }, [contentId, setSelection])

    // hydrate the thread from the server once the open session's turns load
    useEffect(() => {
        if (!currentSessionId || hydratedRef.current === currentSessionId || !historySwr.data) {
            return
        }
        setMessages(historySwr.data.map((turn) => ({
            role: turn.role as ChatRole,
            content: turn.content,
        })))
        hydratedRef.current = currentSessionId
    }, [currentSessionId, historySwr.data])

    // keep the latest content in view as messages append / the answer streams
    useEffect(() => {
        bottomAnchorRef.current?.scrollIntoView({ block: "end" })
    }, [messages])

    /** Append a delta to the trailing assistant bubble as the answer streams in. */
    const appendToAssistant = useCallback((delta: string) => {
        setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === "assistant") {
                next[next.length - 1] = { ...last, content: last.content + delta }
            }
            return next
        })
    }, [])

    /** Send a question, creating a conversation lazily on the first message. */
    const onSend = useCallback(async (preset?: string) => {
        const raw = (preset ?? input).trim()
        if (!raw || !contentId || isStreaming) {
            return
        }
        let sessionId = currentSessionId
        if (!sessionId) {
            const created = await createSwr.trigger({ contentId }).catch(() => undefined)
            sessionId = created?.data?.id ?? null
            if (!sessionId) {
                return
            }
            setCurrentSessionId(sessionId)
            hydratedRef.current = sessionId
        }
        // when a passage is selected, wrap the turn so the UI shows only the
        // question (<display>) while the model also gets the hidden <context>
        // (the surrounding paragraph + section) to reason about a short selection
        const content = selection
            ? `<display>${raw}</display>\n<context>${selectionContext ?? selection}</context>`
            : raw
        const history = messages.map((message) => ({
            role: message.role,
            content: message.content,
        }))
        setMessages((prev) => [
            ...prev,
            { role: "user", content },
            { role: "assistant", content: "" },
        ])
        setInput("")
        setSelection(null)
        setIsStreaming(true)
        ask({
            sessionId,
            contentId,
            question: content,
            history,
            mode: modelSelection.mode,
            model: modelSelection.model,
            provider: modelSelection.provider,
            onDelta: appendToAssistant,
            onDone: (error) => {
                setIsStreaming(false)
                void sessionsSwr.mutate()
                void sessionsInfinite.mutate()
                if (!error) {
                    return
                }
                setMessages((prev) => {
                    const next = [...prev]
                    const last = next[next.length - 1]
                    if (last && last.role === "assistant" && last.content === "") {
                        next[next.length - 1] = { ...last, content: `⚠️ ${error}` }
                    }
                    return next
                })
            },
        })
    }, [input, contentId, isStreaming, currentSessionId, createSwr, selection, selectionContext, messages, ask, appendToAssistant, setSelection, sessionsSwr, sessionsInfinite, modelSelection])

    /** Start a fresh conversation (created lazily on the first message). */
    const onNewConversation = useCallback(() => {
        abort()
        setMessages([])
        setInput("")
        setIsStreaming(false)
        setCurrentSessionId(null)
        hydratedRef.current = undefined
        setView("chat")
    }, [abort])

    /** Open an existing conversation. */
    const onSwitchConversation = useCallback((sessionId: string) => {
        abort()
        setMessages([])
        setInput("")
        setIsStreaming(false)
        hydratedRef.current = undefined
        setCurrentSessionId(sessionId)
        // mark it just-opened server-side so reload reopens THIS conversation,
        // then revalidate the list so it reflects the new recency order
        void touchSwr.trigger({ sessionId }).then(() => sessionsSwr.mutate())
        setView("chat")
    }, [abort, touchSwr, sessionsSwr])

    /** Delete a conversation; if it was open, drop back to a fresh thread. */
    const onDeleteConversation = useCallback(async (sessionId: string) => {
        await deleteSwr.trigger({ sessionId }).catch(() => undefined)
        void sessionsSwr.mutate()
        void sessionsInfinite.mutate()
        if (sessionId === currentSessionId) {
            setMessages([])
            setCurrentSessionId(null)
            hydratedRef.current = undefined
        }
    }, [deleteSwr, sessionsSwr, sessionsInfinite, currentSessionId])

    const trimmedSearch = searchTerm.trim()
    // flatten the infinite pages; a short last page means there are no more
    const infiniteItems = (sessionsInfinite.data ?? []).flat()
    const lastSessionsPage = sessionsInfinite.data?.[sessionsInfinite.data.length - 1]
    const hasMoreSessions = !!lastSessionsPage && lastSessionsPage.length === CONTENT_AI_SESSIONS_PAGE_LIMIT
    // search is course-wide on the server; scope the displayed rows to this lesson
    // (cross-lesson navigation is a later enhancement)
    const drawerSessions = trimmedSearch
        ? infiniteItems.filter((session) => session.originContentId === contentId)
        : infiniteItems

    // the model picker (shared block — composer + settings view). Auto = free
    // chain; a pinned model runs Premium when unlocked. No `floor` → Free is the
    // chatbot's normal lane (not flagged danger).
    const modelPicker = (placement: "top start" | "bottom start") => (
        <GradeModelDropdown
            models={models}
            selection={modelSelection}
            canPremium={canPremium}
            placement={placement}
            onSelect={(selection) => setSelectedModel(selection.model)}
            onUpgrade={() =>
                router.push(`${pathConfig().locale(locale).profile().build()}/ai-subscription`)}
        />
    )

    // ── conversations view ────────────────────────────────────────────────
    if (view === "conversations") {
        return (
            <div className={cn("flex h-full flex-col gap-3", className)}>
                {/* back — link sm, icon + label both muted */}
                <button
                    type="button"
                    className="group flex w-fit cursor-pointer items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
                    onClick={() => setView("chat")}
                >
                    <ArrowLeftIcon className="size-4" />
                    <span className="group-hover:underline">{t("contentAi.conversations")}</span>
                </button>
                {/* search + add (add sits right next to search) */}
                <div className="flex items-center gap-2">
                    <SearchInput
                        variant="secondary"
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder={t("contentAi.searchConversations")}
                        className="!max-w-none min-w-0 flex-1"
                    />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="tertiary"
                        aria-label={t("contentAi.newConversation")}
                        onPress={onNewConversation}
                    >
                        <PlusIcon className="size-5" />
                    </Button>
                </div>
                {/* list — self-bounded ScrollShadow + infinite scroll (mirror OutlineRail + followers infinite) */}
                <ScrollShadow hideScrollBar className="-mx-1 max-h-[55vh] min-h-0 min-w-0 flex-1 overflow-y-auto px-1">
                    <div className="flex flex-col gap-1">
                        {drawerSessions.length === 0 && !sessionsInfinite.isValidating ? (
                            <Typography type="body-sm" color="muted" className="px-1 py-2">
                                {t("contentAi.noConversations")}
                            </Typography>
                        ) : (
                            drawerSessions.map((session) => (
                                <div
                                    key={session.id}
                                    role="button"
                                    tabIndex={0}
                                    className={cn(
                                        "group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-default",
                                        session.id === currentSessionId && "bg-accent/10",
                                    )}
                                    onClick={() => onSwitchConversation(session.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            onSwitchConversation(session.id)
                                        }
                                    }}
                                >
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <Typography type="body-sm" className="truncate">
                                            {session.title ?? t("contentAi.untitled")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="truncate">
                                            {session.snippet
                                                ?? t("contentAi.turnsCount", { count: session.messageCount })}
                                        </Typography>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={t("contentAi.deleteConversation")}
                                        className="shrink-0 cursor-pointer text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            void onDeleteConversation(session.id)
                                        }}
                                    >
                                        <TrashIcon className="size-4" />
                                    </button>
                                </div>
                            ))
                        )}
                        {/* grow on scroll instead of a "load more" button */}
                        <InfiniteScrollSentinel
                            onReach={() => sessionsInfinite.setSize((size) => size + 1)}
                            disabled={!hasMoreSessions || sessionsInfinite.isValidating}
                        />
                        {sessionsInfinite.isValidating ? (
                            <Typography type="body-xs" color="muted" className="px-1 py-2 text-center">
                                {t("common.loading")}
                            </Typography>
                        ) : null}
                    </div>
                </ScrollShadow>
            </div>
        )
    }

    // ── settings view (model picker) ──────────────────────────────────────
    if (view === "settings") {
        return (
            <div className={cn("flex h-full flex-col gap-3", className)}>
                {/* back — link sm, icon + label both muted */}
                <button
                    type="button"
                    className="group flex w-fit cursor-pointer items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
                    onClick={() => setView("chat")}
                >
                    <ArrowLeftIcon className="size-4" />
                    <span className="group-hover:underline">{t("contentAi.settings")}</span>
                </button>
                <div className="flex flex-col gap-2">
                    <Label>{t("contentAi.modelLabel")}</Label>
                    {modelPicker("bottom start")}
                </div>
            </div>
        )
    }

    // ── chat view ─────────────────────────────────────────────────────────
    return (
        <div className={cn("flex h-full flex-col gap-3", className)}>
            {/* conversation switcher — accent link, opens the conversations view
                (new conversation lives in that view, next to search) */}
            <Link
                onPress={() => setView("conversations")}
                className="flex w-full cursor-pointer items-center gap-2 text-sm font-medium text-accent"
            >
                <ChatsCircleIcon className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">
                    {t("contentAi.chatHistory")}
                </span>
                <CaretDownIcon className="size-4 shrink-0" />
            </Link>

            {/* thread — self-bounded scroll region (scroll shadow on the messages,
                not the popover); composer stays fixed below */}
            <ScrollShadow hideScrollBar className="max-h-[55vh] min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-sm" color="muted">
                                {t("contentAi.hint")}
                            </Typography>
                            {SUGGESTION_KEYS.map((key) => (
                                <Button
                                    key={key}
                                    variant="secondary"
                                    size="sm"
                                    className="justify-start text-start"
                                    onPress={() => onSend(t(`contentAi.suggestions.${key}`))}
                                >
                                    {t(`contentAi.suggestions.${key}`)}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <ChatBubble key={index} role={message.role}>
                                {message.role === "assistant" ? (
                                    message.content === "" ? (
                                        <Typography type="body-sm" color="muted">
                                            {t("contentAi.thinking")}
                                        </Typography>
                                    ) : (
                                        <MarkdownContent markdown={message.content} />
                                    )
                                ) : (
                                    <Typography type="body-sm">
                                        {displayText(message.content)}
                                    </Typography>
                                )}
                            </ChatBubble>
                        ))
                    )}
                    {/* scroll target so the thread follows the streaming answer */}
                    <div ref={bottomAnchorRef} aria-hidden />
                </div>
            </ScrollShadow>

            {/* selected-passage context (set by the "ask about this passage" button) */}
            {selection ? (
                <div className="flex flex-col gap-2 rounded-xl border border-default bg-default/50 px-3 py-2">
                    <div className="flex items-start gap-2">
                        <QuotesIcon className="mt-0.5 size-4 shrink-0 text-muted" />
                        <Typography type="body-xs" color="muted" className="line-clamp-2 flex-1">
                            {selection}
                        </Typography>
                        <button
                            type="button"
                            aria-label={t("contentAi.clearSelection")}
                            className="shrink-0 cursor-pointer text-muted transition-colors hover:text-foreground"
                            onClick={() => setSelection(null)}
                        >
                            <XIcon className="size-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {SELECTION_SUGGESTION_KEYS.map((key) => (
                            <Button
                                key={key}
                                variant="secondary"
                                size="sm"
                                onPress={() => onSend(t(`contentAi.selectionSuggestions.${key}`))}
                            >
                                {t(`contentAi.selectionSuggestions.${key}`)}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* composer (B: secondary-fill box, no border — input + model picker / settings / send inside) */}
            <div className="flex flex-col gap-2 rounded-2xl bg-default px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <input
                    aria-label={t("contentAi.placeholder")}
                    placeholder={t("contentAi.placeholder")}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault()
                            void onSend()
                        }
                    }}
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
                <div className="flex items-center gap-2">
                    {modelPicker("top start")}
                    <div className="flex-1" />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("contentAi.settings")}
                        onPress={() => setView("settings")}
                    >
                        <GearIcon className="size-5" />
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="primary"
                        isPending={isStreaming}
                        aria-label={t("contentAi.send")}
                        onPress={() => void onSend()}
                    >
                        <PaperPlaneTiltIcon className="size-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
