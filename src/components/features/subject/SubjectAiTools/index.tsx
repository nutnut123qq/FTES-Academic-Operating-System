"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import {
    SparkleIcon,
    BookOpenIcon,
    TargetIcon,
    SquaresFourIcon,
    FolderIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    useQuerySubjectAiToolsSwr,
    type AiToolKey,
} from "../hooks/useQuerySubjectAiToolsSwr"

// ponytail: provisional icons (confirmed-compiling set) — refine when the AI tab
// gets its own brainstorm.
const ICONS: Record<AiToolKey, React.ReactNode> = {
    tutor: <SparkleIcon className="size-6" />,
    summary: <BookOpenIcon className="size-6" />,
    quiz: <TargetIcon className="size-6" />,
    flashcards: <SquaresFourIcon className="size-6" />,
    ocr: <FolderIcon className="size-6" />,
}

/**
 * AI tab (§3 → §9). DEFAULT on-canon layout (no dedicated brainstorm): a card grid
 * of AI tool shells (tutor / summary / quiz / flashcards / ocr) with an Open CTA.
 * ponytail: hand-rolled cards + provisional icons; mock list, CTAs are no-ops.
 */
export const SubjectAiTools = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { tools } = useQuerySubjectAiToolsSwr(subjectId)

    return (
        <div className="flex flex-col gap-3 p-6">
            <Typography type="h5" weight="bold">
                {t("aiTools.title")}
            </Typography>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tools.map((tool) => (
                    <div
                        key={tool.key}
                        className="flex flex-col gap-3 rounded-large border border-separator p-4"
                    >
                        <span className="text-accent">{ICONS[tool.key]}</span>
                        <div className="flex flex-col gap-0">
                            <Typography type="body" weight="medium">
                                {t(`aiTools.tools.${tool.key}.title`)}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {t(`aiTools.tools.${tool.key}.desc`)}
                            </Typography>
                        </div>
                        <Button size="sm" variant="secondary" className="self-start">
                            {t("aiTools.cta")}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
