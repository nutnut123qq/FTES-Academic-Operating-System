"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import {
    SparkleIcon,
    CalendarCheckIcon,
    NotepadIcon,
    CardsIcon,
    QuestionIcon,
    BugIcon,
    BriefcaseIcon,
    ChalkboardTeacherIcon,
    GraduationCapIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import {
    useQueryAiToolsSwr,
    type AiTool,
    type AiToolCategory,
} from "../hooks/useQueryAiToolsSwr"

/** Category render order for the hub sections. */
const CATEGORY_ORDER: Array<AiToolCategory> = ["student", "learning", "coding", "career", "teacher"]

// ponytail: static icon-per-slug map (confirmed-compiling Phosphor set). Refine when
// §9 gets its own brainstorm; falls back to a generic sparkle for unknown keys.
const TOOL_ICONS: Record<string, React.ReactNode> = {
    tutor: <SparkleIcon className="size-6" />,
    planner: <CalendarCheckIcon className="size-6" />,
    summary: <NotepadIcon className="size-6" />,
    flashcards: <CardsIcon className="size-6" />,
    quiz: <QuestionIcon className="size-6" />,
    debug: <BugIcon className="size-6" />,
    cvReview: <BriefcaseIcon className="size-6" />,
    mentor: <ChalkboardTeacherIcon className="size-6" />,
}

/**
 * §9 AI Platform — the AI tools hub. Mirrors the house catalog archetype
 * (see `SubjectCatalog`): title + subtitle + a card grid, here grouped by category.
 * Each card = accent icon badge + tool name + short desc + a mock "Open" CTA.
 * Feature owns data (mock); tokens own the look. ponytail: hand-rolled cards +
 * static icon map, mock list, CTAs are no-ops.
 */
export const AiHub = () => {
    const t = useTranslations("aiPlatform")
    const { tools } = useQueryAiToolsSwr()

    const byCategory = CATEGORY_ORDER.map((category) => ({
        category,
        tools: tools.filter((tool) => tool.category === category),
    })).filter((group) => group.tools.length > 0)

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {byCategory.map((group) => (
                <section key={group.category} className="flex flex-col gap-3">
                    <Typography type="body" weight="medium" className="text-accent">
                        {t(`categories.${group.category}`)}
                    </Typography>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.tools.map((tool: AiTool) => (
                            <div
                                key={tool.id}
                                className="flex flex-col gap-3 rounded-3xl border border-separator p-4"
                            >
                                <span
                                    aria-hidden
                                    className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent"
                                >
                                    {TOOL_ICONS[tool.key] ?? <GraduationCapIcon className="size-6" />}
                                </span>
                                <div className="flex min-w-0 flex-col gap-0">
                                    <Typography type="body" weight="medium">
                                        {t(`tools.${tool.key}.name`)}
                                    </Typography>
                                    <Typography type="body-sm" color="muted">
                                        {t(`tools.${tool.key}.desc`)}
                                    </Typography>
                                </div>
                                <Button size="sm" variant="secondary" className="self-start">
                                    {t("open")}
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
