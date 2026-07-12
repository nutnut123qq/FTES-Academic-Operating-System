"use client"

import React, { useState } from "react"
import { Button, TextArea, TextField, Typography } from "@heroui/react"
import { PaperPlaneTiltIcon, PlayCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { SubmitAnswerView } from "@/modules/api/rest/interview"
import { useInterviewOralViva } from "./useInterviewOralViva"

/** Props for {@link OralVivaPanel}. */
export interface OralVivaPanelProps {
    attemptId: string
    questionSetId: string
    questionId: string
    prompt?: string
    onPersisted?: (result: SubmitAnswerView) => void
}

/**
 * Interactive oral viva panel: a short chat transcript where the AI examiner asks
 * questions and the student replies by typing. Each reply is persisted to the
 * attempt; the examiner's turns stream in via SSE.
 */
export const OralVivaPanel = ({
    attemptId,
    questionSetId,
    questionId,
    prompt,
    onPersisted,
}: OralVivaPanelProps) => {
    const t = useTranslations("learn")
    const { messages, isStreaming, error, start, send } = useInterviewOralViva(
        attemptId,
        questionSetId,
        questionId,
    )
    const [draft, setDraft] = useState("")

    const handleStart = () => {
        void start(t("courseInterview.oral.startPrompt") || "Bắt đầu")
    }

    const handleSend = async () => {
        if (!draft.trim() || isStreaming) return
        const text = draft.trim()
        setDraft("")
        const result = await send(text)
        if (result) {
            onPersisted?.(result)
        }
    }

    const errorText = error === "quota" ? t("courseInterview.oral.quotaError") : t("courseInterview.oral.streamError")

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-default bg-surface p-4">
            {prompt ? (
                <div className="flex flex-col gap-1">
                    <Typography type="body-xs" color="muted">{t("courseInterview.oral.topic")}</Typography>
                    <Typography type="body-sm">{prompt}</Typography>
                </div>
            ) : null}

            {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                    <Typography type="body-sm" color="muted" className="text-center">
                        {t("courseInterview.oral.intro")}
                    </Typography>
                    <Button
                        variant="primary"
                        size="sm"
                        onPress={handleStart}
                        isDisabled={isStreaming}
                        isPending={isStreaming}
                    >
                        <PlayCircleIcon aria-hidden focusable="false" className="size-4" />
                        {t("courseInterview.oral.start")}
                    </Button>
                </div>
            ) : (
                <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                    message.role === "user"
                                        ? "bg-accent text-white"
                                        : "bg-default text-foreground"
                                }`}
                            >
                                <Typography type="body-sm">{message.content}</Typography>
                            </div>
                        </div>
                    ))}
                    {isStreaming ? (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-2xl bg-default px-4 py-2">
                                <Typography type="body-sm" className="animate-pulse">…</Typography>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {error ? (
                <Typography type="body-xs" className="text-danger">{errorText}</Typography>
            ) : null}

            <div className="flex items-end gap-2">
                <TextField variant="primary" className="min-w-0 flex-1">
                    <TextArea
                        rows={2}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={t("courseInterview.oral.replyPlaceholder")}
                        aria-label={t("courseInterview.oral.replyPlaceholder")}
                        className="resize-none"
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault()
                                void handleSend()
                            }
                        }}
                    />
                </TextField>
                <Button
                    variant="primary"
                    size="sm"
                    isIconOnly
                    aria-label={t("courseInterview.oral.send")}
                    isDisabled={!draft.trim() || isStreaming || messages.length === 0}
                    onPress={() => void handleSend()}
                >
                    <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </div>
        </div>
    )
}
