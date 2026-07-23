"use client"

import React from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Typography,
    cn,
} from "@heroui/react"
import {
    CaretUpIcon,
    ChatCircleIcon,
    GearIcon,
    PaperPlaneTiltIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import {
    useSubjectAiStore,
    type SubjectAiModel,
} from "@/hooks/zustand/subjectAi"

import { useMockAiStream } from "../../hooks/useMockAiStream"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { TutorConversations } from "./TutorConversations"
import { TutorSettings } from "./TutorSettings"

/** Props for {@link SubjectAiTutor}. */
export interface SubjectAiTutorProps {
    subjectId: string
    subjectCode: string
    subjectName: string
    onBack: () => void
}

/** In-panel view state — never a modal/drawer stacked over the surface. */
type TutorView = "chat" | "conversations" | "settings"

/** Static mock model list surfaced in the composer's picker. */
const MODELS: Array<SubjectAiModel> = ["ftes-fast", "ftes-pro"]

/** Client-side id for a new session/message (mock only). */
const newId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Subject AI Tutor chat surface: mock-streaming thread, composer-in-box (flat
 * input + [model picker · settings · send]), multi-session conversations, and
 * in-panel conversations/settings views. Sessions persist in the zustand store
 * for the SPA session (BE persistence assumed, logged in the store).
 */
export const SubjectAiTutor = ({
    subjectId,
    subjectCode,
    subjectName,
    onBack,
}: SubjectAiTutorProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const threadEndRef = React.useRef<HTMLDivElement>(null)

    const sessions = useSubjectAiStore(
        (s) => s.sessionsBySubject[subjectId] ?? [],
    )
    const currentSessionId = useSubjectAiStore(
        (s) => s.currentSessionBySubject[subjectId] ?? null,
    )
    const model = useSubjectAiStore((s) => s.model)
    const setModel = useSubjectAiStore((s) => s.setModel)
    const createSession = useSubjectAiStore((s) => s.createSession)
    const setCurrentSession = useSubjectAiStore((s) => s.setCurrentSession)
    const appendMessage = useSubjectAiStore((s) => s.appendMessage)
    const updateMessage = useSubjectAiStore((s) => s.updateMessage)

    const { isStreaming, ask } = useMockAiStream()

    const [view, setView] = React.useState<TutorView>("chat")
    const [draft, setDraft] = React.useState("")
    const [streamError, setStreamError] = React.useState(false)
    const [lastQuestion, setLastQuestion] = React.useState("")

    const currentSession =
        sessions.find((s) => s.id === currentSessionId) ?? null
    const messages = currentSession?.messages ?? []

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    React.useEffect(() => {
        threadEndRef.current?.scrollIntoView({ block: "end" })
    }, [messages.length, isStreaming])

    const send = (question: string) => {
        const trimmed = question.trim()
        if (!trimmed || isStreaming) return

        // lazy-create a session on the first send
        let sessionId = currentSessionId
        if (!sessionId) {
            sessionId = newId()
            createSession(subjectId, sessionId)
        }

        setDraft("")
        setStreamError(false)
        setLastQuestion(trimmed)

        appendMessage(subjectId, sessionId, {
            id: newId(),
            role: "user",
            content: trimmed,
        })

        const answerId = newId()
        appendMessage(subjectId, sessionId, {
            id: answerId,
            role: "assistant",
            content: "",
        })

        const activeSession = sessionId
        ask(
            trimmed,
            { subjectCode, subjectName },
            {
                onChunk: (text) =>
                    updateMessage(subjectId, activeSession, answerId, text),
                onDone: (text) =>
                    updateMessage(subjectId, activeSession, answerId, text),
                onError: () => setStreamError(true),
            },
        )
    }

    // suggested first prompts (subject-scoped)
    const suggestions = [
        t("subjects.aiTools.tutor.suggestions.explain", { subject: subjectName }),
        t("subjects.aiTools.tutor.suggestions.plan", { subject: subjectName }),
        t("subjects.aiTools.tutor.suggestions.example"),
    ]

    if (view === "conversations") {
        return (
            <TutorConversations
                subjectId={subjectId}
                onBack={() => setView("chat")}
                onNew={() => {
                    setCurrentSession(subjectId, null)
                    setView("chat")
                }}
                onSwitch={(id) => {
                    setCurrentSession(subjectId, id)
                    setView("chat")
                }}
            />
        )
    }

    if (view === "settings") {
        return (
            <TutorSettings
                subjectId={subjectId}
                model={model}
                onBack={() => setView("chat")}
            />
        )
    }

    return (
        <div className="flex h-full flex-col gap-3 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tools.tutor.title")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
                trailing={
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="tertiary"
                            isIconOnly
                            aria-label={t("subjects.aiTools.tutor.conversations")}
                            onPress={() => setView("conversations")}
                        >
                            <ChatCircleIcon
                                className="size-5"
                                aria-hidden
                                focusable="false"
                            />
                        </Button>
                        <Button
                            size="sm"
                            variant="tertiary"
                            isIconOnly
                            aria-label={t("subjects.aiTools.tutor.settings")}
                            onPress={() => setView("settings")}
                        >
                            <GearIcon
                                className="size-5"
                                aria-hidden
                                focusable="false"
                            />
                        </Button>
                    </div>
                }
            />

            {/* thread */}
            <div
                aria-live="polite"
                className="flex min-h-64 flex-1 flex-col gap-3 overflow-y-auto"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                        <SparkleIcon
                            className="size-8 text-accent"
                            aria-hidden
                            focusable="false"
                        />
                        <Typography type="body-sm" color="muted">
                            {t("subjects.aiTools.tutor.emptyHint", {
                                subject: subjectName,
                            })}
                        </Typography>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestions.map((prompt) => (
                                <Button
                                    key={prompt}
                                    size="sm"
                                    variant="secondary"
                                    onPress={() => send(prompt)}
                                >
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "max-w-[85%] rounded-large px-4 py-2",
                                message.role === "user"
                                    ? "self-end bg-accent/10 text-foreground"
                                    : "self-start border border-separator",
                            )}
                        >
                            <Typography type="body-sm">
                                {message.content ||
                                    (isStreaming
                                        ? t("subjects.aiTools.tutor.thinking")
                                        : "")}
                            </Typography>
                        </div>
                    ))
                )}

                {streamError ? (
                    <div className="flex items-center gap-2 self-start">
                        <Typography type="body-sm" className="text-danger">
                            {t("subjects.aiTools.tutor.streamError")}
                        </Typography>
                        <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => send(lastQuestion)}
                        >
                            {t("subjects.aiTools.retry")}
                        </Button>
                    </div>
                ) : null}
                <div ref={threadEndRef} />
            </div>

            {/* composer-in-box: flat input on top, controls row below, all in ONE box */}
            <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface px-3 py-2 focus-within:border-accent">
                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            send(draft)
                        }
                    }}
                    rows={1}
                    placeholder={t("subjects.aiTools.tutor.placeholder")}
                    aria-label={t("subjects.aiTools.tutor.placeholder")}
                    className="resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
                <div className="flex items-center gap-2">
                    <Dropdown>
                        <DropdownTrigger className="cursor-pointer">
                            <div className="flex items-center gap-1 text-sm text-muted">
                                <SparkleIcon
                                    className="size-4"
                                    aria-hidden
                                    focusable="false"
                                />
                                <span>{model}</span>
                                <CaretUpIcon
                                    className="size-4"
                                    aria-hidden
                                    focusable="false"
                                />
                            </div>
                        </DropdownTrigger>
                        <DropdownPopover placement="top start">
                            <DropdownMenu
                                aria-label={t("subjects.aiTools.tutor.modelLabel")}
                                onAction={(key) => setModel(String(key) as SubjectAiModel)}
                            >
                                {MODELS.map((option) => (
                                    <DropdownItem
                                        key={option}
                                        id={option}
                                        textValue={option}
                                    >
                                        {option}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </DropdownPopover>
                    </Dropdown>
                    <div className="flex-1" />
                    <Button
                        size="sm"
                        variant="tertiary"
                        isIconOnly
                        aria-label={t("subjects.aiTools.tutor.settings")}
                        onPress={() => setView("settings")}
                    >
                        <GearIcon
                            className="size-5"
                            aria-hidden
                            focusable="false"
                        />
                    </Button>
                    <Button
                        size="sm"
                        variant="primary"
                        isIconOnly
                        aria-label={t("subjects.aiTools.tutor.send")}
                        isDisabled={!draft.trim() || isStreaming}
                        onPress={() => send(draft)}
                    >
                        <PaperPlaneTiltIcon
                            className="size-5"
                            aria-hidden
                            focusable="false"
                        />
                    </Button>
                </div>
            </div>
        </div>
    )
}
