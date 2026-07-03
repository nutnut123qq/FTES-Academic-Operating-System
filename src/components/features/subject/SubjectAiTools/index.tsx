"use client"

import React from "react"
import { Button, Typography, cn } from "@heroui/react"
import {
    SparkleIcon,
    BookOpenIcon,
    TargetIcon,
    SquaresFourIcon,
    FolderIcon,
    LockIcon,
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

// ponytail: provisional icons (confirmed-compiling set) — refine when the AI tab
// gets its own brainstorm.
const ICONS: Record<AiToolKey, React.ReactNode> = {
    tutor: <SparkleIcon className="size-6" aria-hidden focusable="false" />,
    summary: <BookOpenIcon className="size-6" aria-hidden focusable="false" />,
    quiz: <TargetIcon className="size-6" aria-hidden focusable="false" />,
    flashcards: <SquaresFourIcon className="size-6" aria-hidden focusable="false" />,
    ocr: <FolderIcon className="size-6" aria-hidden focusable="false" />,
}

/** Tools that open a working surface (OCR stays a coming-soon shell). */
type ActiveTool = Exclude<AiToolKey, "ocr">

/**
 * AI tab (§3 → §9): a functional per-subject AI hub. Tool cards are real entry
 * points that open working surfaces INSIDE the tab via local `activeTool` view
 * state (no sub-routes). Tools are gated on workspace membership (enroll axis).
 * OCR remains a coming-soon shell this change.
 */
export const SubjectAiTools = () => {
    const t = useTranslations("subjects")
    const router = useRouter()
    const { subjectId } = useParams<{ subjectId: string }>()
    const { tools, isLoading, error, mutate } =
        useQuerySubjectAiToolsSwr(subjectId)
    const { subject } = useQuerySubjectSwr(subjectId)

    const isMember = subject?.isMember ?? false
    const [activeTool, setActiveTool] = React.useState<ActiveTool | null>(null)

    // guard beyond the button: never render a tool surface for a non-member
    const openTool = (key: ActiveTool) => {
        if (!isMember) return
        setActiveTool(key)
    }
    const backToHub = () => setActiveTool(null)
    const goResources = () => router.push(`/subjects/${subjectId}/resources`)

    if (activeTool && isMember && subject) {
        if (activeTool === "tutor") {
            return (
                <SubjectAiTutor
                    subjectId={subjectId}
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

            {!isMember ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                    <div className="flex items-center gap-2 text-muted">
                        <LockIcon
                            className="size-5"
                            aria-hidden
                            focusable="false"
                        />
                        <Typography type="body-sm" color="muted">
                            {t("aiTools.lockedHint")}
                        </Typography>
                    </div>
                    <Button
                        variant="primary"
                        className="self-start"
                        onPress={goResources}
                    >
                        {t("aiTools.join")}
                    </Button>
                </div>
            ) : null}

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
                        const isLocked = !isMember
                        const disabled = isComingSoon || isLocked
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
                                        {isLocked ? (
                                            <LockIcon
                                                className="size-4 text-muted"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        ) : null}
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
