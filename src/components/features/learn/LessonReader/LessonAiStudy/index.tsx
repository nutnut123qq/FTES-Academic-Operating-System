"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import {
    ArrowLeftIcon,
    CardsIcon,
    CaretRightIcon,
    NotePencilIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { LessonAiNote } from "./LessonAiNote"
import { LessonAiFlashcards } from "./LessonAiFlashcards"

/** Props for {@link LessonAiStudy}. */
export interface LessonAiStudyProps {
    /** The current lesson id (`contentId` route param) — grounds AI generation. */
    contentId: string
    className?: string
}

/** Which study tool is open (`none` = the entry menu). */
type Tool = "none" | "note" | "flashcard"

/**
 * Lesson "Study with AI" section — the reader-embedded home for the two on-demand
 * AI study tools grounded on the CURRENT lesson: an AI Note (summary → save as a
 * real lesson note) and AI Flashcards (Q/A deck → flip reviewer). Both reuse the
 * proven lesson-grounded TUTOR_CHAT stream (see {@link useLessonAiStream}); there
 * is no dedicated lesson-scoped note/flashcard endpoint on the API today.
 *
 * Mounted by {@link import("../index").LessonReader} inside the reading (content)
 * view only for UNLOCKED lessons — never rendered for a locked/premium lesson,
 * matching the reader's `#lesson-article select-none` gate.
 *
 * @param props - {@link LessonAiStudyProps}
 */
export const LessonAiStudy = ({ contentId, className }: LessonAiStudyProps) => {
    const t = useTranslations("contentAi")
    const [tool, setTool] = useState<Tool>("none")

    return (
        <LabeledCard
            className={className}
            label={t("studyTools.title")}
            icon={<SparkleIcon aria-hidden focusable="false" weight="fill" className="size-4 text-accent" />}
        >
            {tool === "none" ? (
                <div className="flex flex-col gap-3">
                    <Typography type="body-sm" color="muted">
                        {t("studyTools.description")}
                    </Typography>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <ToolEntry
                            icon={<NotePencilIcon aria-hidden focusable="false" className="size-5 text-accent" />}
                            title={t("note.title")}
                            description={t("note.description")}
                            onPress={() => setTool("note")}
                        />
                        <ToolEntry
                            icon={<CardsIcon aria-hidden focusable="false" className="size-5 text-accent" />}
                            title={t("flashcard.title")}
                            description={t("flashcard.description")}
                            onPress={() => setTool("flashcard")}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={t("studyTools.back")}
                            onPress={() => setTool("none")}
                        >
                            <ArrowLeftIcon className="size-5" aria-hidden focusable="false" />
                        </Button>
                        <Typography type="body" weight="semibold" className="flex-1">
                            {tool === "note" ? t("note.title") : t("flashcard.title")}
                        </Typography>
                    </div>
                    {tool === "note" ? (
                        <LessonAiNote lessonId={contentId} />
                    ) : (
                        <LessonAiFlashcards lessonId={contentId} />
                    )}
                </div>
            )}
        </LabeledCard>
    )
}

/** One entry tile in the study-tools menu. */
const ToolEntry = ({
    icon,
    title,
    description,
    onPress,
}: {
    icon: React.ReactNode
    title: string
    description: string
    onPress: () => void
}) => (
    <button
        type="button"
        onClick={onPress}
        className="group flex items-start gap-3 rounded-2xl border border-default bg-surface p-4 text-left outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-focus"
    >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
            <Typography type="body-sm" weight="semibold">
                {title}
            </Typography>
            <Typography type="body-xs" color="muted">
                {description}
            </Typography>
        </span>
        <CaretRightIcon
            aria-hidden
            focusable="false"
            className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
        />
    </button>
)

export default LessonAiStudy
