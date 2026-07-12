"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Typography } from "@heroui/react"
import {
    ArrowClockwiseIcon,
    CheckCircleIcon,
    FloppyDiskIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { usePostAddLessonNoteSwr } from "@/hooks/swr/api/rest/mutations/usePostAddLessonNoteSwr"
import { useLessonAiStream } from "./useLessonAiStream"

/** Props for {@link LessonAiNote}. */
export interface LessonAiNoteProps {
    /** The current lesson id (`contentId` route param) — grounds generation + saving. */
    lessonId: string
}

/**
 * AI Note — generates an AI study-note (summary) of the CURRENT lesson, grounded
 * on its content via the reused TUTOR_CHAT stream ({@link useLessonAiStream}), then
 * lets the learner SAVE it as a real lesson note (`addLessonNote` REST, so it
 * persists like any hand-written note). Generation kicks off automatically when the
 * panel opens ("on demand" = opening the tool); a Regenerate button re-runs it.
 *
 * This component is mounted by {@link LessonAiStudy} for UNLOCKED VIDEO lessons
 * only; document/link lessons never render it.
 *
 * @param props - {@link LessonAiNoteProps}
 */
export const LessonAiNote = ({ lessonId }: LessonAiNoteProps) => {
    const t = useTranslations("contentAi")
    const { text, isStreaming, error, generate } = useLessonAiStream(lessonId)
    const saveSwr = usePostAddLessonNoteSwr()
    const [saved, setSaved] = useState(false)

    const runGenerate = useCallback(() => {
        setSaved(false)
        void generate(t("note.prompt"))
    }, [generate, t])

    // generate once when the note tool opens (opening the panel is the "on demand" trigger)
    useEffect(() => {
        runGenerate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onSave = useCallback(async () => {
        const content = text.trim()
        if (!content) {
            return
        }
        try {
            await saveSwr.trigger({ lessonId, request: { content } })
            setSaved(true)
        } catch {
            // surfaced via saveSwr.error below
        }
    }, [text, lessonId, saveSwr])

    const canSave = !isStreaming && !!text.trim() && !saved
    // first paint of a generation (nothing streamed yet) → show the skeleton
    const isLoadingFirst = isStreaming && text.length === 0

    return (
        <div className="flex flex-col gap-4">
            <AsyncContent
                isLoading={isLoadingFirst}
                skeleton={<Skeleton.Paragraph lines={5} />}
                isEmpty={!isStreaming && !error && text.length === 0}
                emptyContent={{ title: t("note.empty") }}
                error={!isStreaming && text.length === 0 ? (error ? new Error(error) : undefined) : undefined}
                errorContent={{
                    title: error === "quota" ? t("quotaHit") : t("note.error"),
                    onRetry: runGenerate,
                    retryLabel: t("note.regenerate"),
                }}
            >
                {text ? <MarkdownContent markdown={text} /> : null}
            </AsyncContent>

            {/* save + regenerate actions — available once the note has content */}
            {text || isStreaming ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-default pt-4">
                    <Button
                        variant="primary"
                        size="sm"
                        isDisabled={!canSave}
                        isPending={saveSwr.isMutating}
                        onPress={() => void onSave()}
                    >
                        <FloppyDiskIcon aria-hidden focusable="false" className="size-4" />
                        {saved ? t("note.saved") : t("note.save")}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        isDisabled={isStreaming}
                        onPress={runGenerate}
                    >
                        <ArrowClockwiseIcon aria-hidden focusable="false" className="size-4" />
                        {t("note.regenerate")}
                    </Button>
                    {saved ? (
                        <CheckCircleIcon
                            aria-hidden
                            focusable="false"
                            weight="fill"
                            className="size-5 text-success"
                        />
                    ) : null}
                    {saveSwr.error ? (
                        <Typography type="body-xs" className="text-danger">
                            {t("note.saveError")}
                        </Typography>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

export default LessonAiNote
