"use client"

import React from "react"
import { Button, Typography, cn } from "@heroui/react"
import {
    SparkleIcon,
    BookOpenIcon,
    TargetIcon,
    SquaresFourIcon,
    FolderIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"

import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

import {
    useQuerySubjectAiToolsSwr,
    type AiToolKey,
} from "../hooks/useQuerySubjectAiToolsSwr"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import { SubjectAiTutor } from "./SubjectAiTutor"
import { SubjectAiSummary } from "./SubjectAiSummary"
import { SubjectAiQuiz } from "./SubjectAiQuiz"
import { SubjectAiFlashcards } from "./SubjectAiFlashcards"
import { SubjectAiOcr } from "./SubjectAiOcr"

// ponytail: provisional icons (confirmed-compiling set) — refine when the AI tab
// gets its own brainstorm.
const ICONS: Record<AiToolKey, React.ReactNode> = {
    tutor: <SparkleIcon className="size-6" aria-hidden focusable="false" />,
    summary: <BookOpenIcon className="size-6" aria-hidden focusable="false" />,
    quiz: <TargetIcon className="size-6" aria-hidden focusable="false" />,
    flashcards: <SquaresFourIcon className="size-6" aria-hidden focusable="false" />,
    ocr: <FolderIcon className="size-6" aria-hidden focusable="false" />,
}

/** Tools that open a working surface — all five are wired now, OCR included. */
type ActiveTool = AiToolKey

/**
 * AI tab (§3 → §9): a functional per-subject AI hub. Tool cards are real entry
 * points that open working surfaces INSIDE the tab via local `activeTool` view
 * state (no sub-routes). Membership is OPTIONAL — the AI endpoints don't hard-gate
 * on it, so joining the workspace is not required to use the tools.
 * Every surface runs against the real AI module: the tutor streams over SSE, and
 * summary/quiz/flashcards/OCR submit an async job and poll `GET /ai/jobs/{id}`.
 */
export const SubjectAiTools = () => {
    const t = useTranslations("subjects")
    const router = useRouter()
    const { subjectId } = useParams<{ subjectId: string }>()
    const { tools, isLoading, error, mutate } =
        useQuerySubjectAiToolsSwr(subjectId)
    const { subject } = useQuerySubjectSwr(subjectId)

    const [activeTool, setActiveTool] = React.useState<ActiveTool | null>(null)

    const openTool = (key: ActiveTool) => setActiveTool(key)
    const backToHub = () => setActiveTool(null)
    const goResources = () => router.push(`/subjects/${subjectId}/resources`)

    if (activeTool && subject) {
        if (activeTool === "tutor") {
            return (
                <SubjectAiTutor
                    subjectId={subjectId}
                    // the route segment is the CODE; the session grounding keys on the
                    // real UUID (BE parses `contextRef.subjectId` with UUID.fromString)
                    subjectUuid={subject.uuid}
                    subjectCode={subject.code}
                    subjectName={subject.name}
                    onBack={backToHub}
                />
            )
        }
        if (activeTool === "summary") {
            return (
                <SubjectAiSummary
                    subjectId={subjectId}
                    subjectCode={subject.code}
                    onBack={backToHub}
                    onGoResources={goResources}
                />
            )
        }
        if (activeTool === "quiz") {
            return (
                <SubjectAiQuiz
                    subjectId={subjectId}
                    subjectCode={subject.code}
                    onBack={backToHub}
                    onGoResources={goResources}
                />
            )
        }
        if (activeTool === "ocr") {
            return (
                <SubjectAiOcr
                    subjectId={subjectId}
                    subjectCode={subject.code}
                    onBack={backToHub}
                />
            )
        }
        return (
            <SubjectAiFlashcards
                subjectId={subjectId}
                subjectCode={subject.code}
                onBack={backToHub}
                onGoResources={goResources}
            />
        )
    }

    return (
        <div className="flex flex-col gap-3 p-6">
            <Typography type="h5" weight="bold">
                {t("aiTools.title")}
            </Typography>

            <AsyncContent
                isLoading={isLoading && tools.length === 0}
                skeleton={
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                            >
                                <Skeleton className="size-6 rounded" />
                                <Skeleton.Typography type="body" width="1/2" />
                                <Skeleton.Typography type="body-sm" width="2/3" />
                                <Skeleton.Button />
                            </div>
                        ))}
                    </div>
                }
                error={!tools.length ? error : undefined}
                errorContent={{
                    title: t("aiTools.errorTitle"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("aiTools.retry"),
                }}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {tools.map((tool) => {
                        const isComingSoon = tool.status === "comingSoon"
                        const disabled = isComingSoon
                        return (
                            <div
                                key={tool.key}
                                className={cn(
                                    "flex flex-col gap-3 rounded-2xl border border-separator p-4",
                                    disabled && "opacity-60",
                                )}
                            >
                                <span className="text-accent">
                                    {ICONS[tool.key]}
                                </span>
                                <div className="flex flex-col gap-0">
                                    <div className="flex items-center gap-2">
                                        <Typography type="body" weight="medium">
                                            {t(`aiTools.tools.${tool.key}.title`)}
                                        </Typography>
                                    </div>
                                    <Typography type="body-sm" color="muted">
                                        {isComingSoon
                                            ? t("aiTools.comingSoon")
                                            : t(`aiTools.tools.${tool.key}.desc`)}
                                    </Typography>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="self-start"
                                    isDisabled={disabled}
                                    onPress={() =>
                                        openTool(tool.key as ActiveTool)
                                    }
                                >
                                    {isComingSoon
                                        ? t("aiTools.comingSoonCta")
                                        : t("aiTools.cta")}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </AsyncContent>
        </div>
    )
}
