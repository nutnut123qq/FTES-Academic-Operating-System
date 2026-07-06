"use client"

import React, { useState } from "react"
import {
    Button,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Input,
    TextField,
    Typography,
} from "@heroui/react"
import {
    CaretDownIcon,
    CheckCircleIcon,
    GearIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryChallengeSubmissionSwr } from "../hooks/useQueryChallengeSubmissionSwr"
import type { SubmissionResult } from "../hooks/useQueryChallengeSubmissionSwr"

/**
 * Auto-grading submission panel (priority 5). A "Grading settings" card, the
 * graded task ("1. GitHub Repository … [100 pts]" + description), a "Paste your
 * submission URL" input, an "Auto ▾" grader selector ("Auto · 250/250 credits"),
 * Submit + View Attempts buttons and a "Your result" section.
 *
 * ponytail: submit is a local mock (fabricates a result after a tick); a real BE
 * runs the grader over socket.io. Attempts drawer is a stub. Grader lanes +
 * credits come from `useQueryChallengeSubmissionSwr`.
 */
export const ChallengeSubmission = () => {
    const t = useTranslations("learn")
    const { courseId, challengeId } = useParams<{ courseId: string; challengeId: string }>()
    const { submission, isLoading, error, mutate } = useQueryChallengeSubmissionSwr(courseId, challengeId)

    const [url, setUrl] = useState("")
    const [graderKey, setGraderKey] = useState("auto")
    const [isSubmitting, setIsSubmitting] = useState(false)
    // ponytail: session-only mock result (a real BE persists graded attempts).
    const [localResult, setLocalResult] = useState<SubmissionResult | null>(null)

    const graders = submission?.graders ?? []
    const activeGrader = graders.find((grader) => grader.key === graderKey) ?? graders[0]
    const result = localResult ?? submission?.result ?? null

    const onSubmit = () => {
        if (url.trim() === "" || !submission) {
            return
        }
        setIsSubmitting(true)
        // ponytail: fabricate a grade after a short tick to mimic the async grader.
        window.setTimeout(() => {
            setLocalResult({
                score: 92,
                total: submission.task.points,
                feedback: t("submission.mockFeedback"),
                attempts: (submission.result?.attempts ?? 0) + 1,
            })
            setIsSubmitting(false)
        }, 600)
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <AsyncContent
                isLoading={isLoading && !submission}
                skeleton={<SubmissionSkeleton />}
                error={!submission ? error : undefined}
                errorContent={{
                    title: t("submission.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                {submission ? (
                    <>
                        <PageHeader
                            title={t("submission.title")}
                            description={t("submission.subtitle")}
                        />

                        {/* grading settings */}
                        <div className="flex items-center gap-3 rounded-3xl border border-default bg-surface p-4">
                            <GearIcon aria-hidden focusable="false" className="size-5 text-muted" />
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="semibold">
                                    {t("submission.settingsTitle")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("submission.settingsHint")}
                                </Typography>
                            </div>
                            {activeGrader ? (
                                <Chip size="sm" variant="soft">
                                    {t("submission.graderCredits", {
                                        grader: activeGrader.label,
                                        credits: activeGrader.creditsLabel,
                                    })}
                                </Chip>
                            ) : null}
                        </div>

                        {/* task */}
                        <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-4">
                            <div className="flex items-start justify-between gap-3">
                                <Typography type="body" weight="semibold" className="min-w-0">
                                    {t("submission.taskHeading", {
                                        order: submission.task.order,
                                        title: submission.task.title,
                                    })}
                                </Typography>
                                <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                                    {t("submission.points", { points: submission.task.points })}
                                </Chip>
                            </div>
                            <Typography type="body-sm" color="muted">
                                {submission.task.description}
                            </Typography>

                            {/* submission URL */}
                            <TextField variant="primary" className="w-full">
                                <Input
                                    value={url}
                                    onChange={(event) => setUrl(event.target.value)}
                                    placeholder={submission.task.urlPlaceholder}
                                    aria-label={t("submission.urlLabel")}
                                />
                            </TextField>

                            {/* grader selector + actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Dropdown>
                                    <DropdownTrigger className="cursor-pointer rounded-2xl border border-default px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <SparkleIcon aria-hidden focusable="false" className="size-4 text-accent" />
                                            <span className="text-sm font-medium">
                                                {t("submission.graderCredits", {
                                                    grader: activeGrader?.label ?? "",
                                                    credits: activeGrader?.creditsLabel ?? "",
                                                })}
                                            </span>
                                            <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                                        </div>
                                    </DropdownTrigger>
                                    <DropdownPopover className="min-w-64">
                                        <DropdownMenu aria-label={t("submission.pickGrader")}>
                                            {graders.map((grader) => (
                                                <DropdownItem
                                                    key={grader.key}
                                                    textValue={grader.label}
                                                    onPress={() => setGraderKey(grader.key)}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span>{grader.label}</span>
                                                        <Typography type="body-xs" color="muted">
                                                            {grader.creditsLabel}
                                                        </Typography>
                                                    </div>
                                                </DropdownItem>
                                            ))}
                                        </DropdownMenu>
                                    </DropdownPopover>
                                </Dropdown>

                                <Button
                                    variant="primary"
                                    className="ml-auto"
                                    isDisabled={url.trim() === "" || isSubmitting}
                                    isPending={isSubmitting}
                                    onPress={onSubmit}
                                >
                                    {t("submission.submit")}
                                </Button>
                                <Button variant="secondary" onPress={() => { void mutate() }}>
                                    {t("submission.viewAttempts")}
                                </Button>
                            </div>
                        </div>

                        {/* your result */}
                        <div className="flex flex-col gap-3 rounded-3xl border border-default bg-surface p-4">
                            <Typography type="body" weight="semibold">
                                {t("submission.resultTitle")}
                            </Typography>
                            {result ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon
                                            aria-hidden
                                            focusable="false"
                                            weight="fill"
                                            className="size-6 text-success"
                                        />
                                        <Typography type="h6" weight="bold">
                                            {t("submission.score", { score: result.score, total: result.total })}
                                        </Typography>
                                        <Chip size="sm" variant="soft" className="ml-auto">
                                            {t("submission.attempts", { count: result.attempts })}
                                        </Chip>
                                    </div>
                                    <ProgressMeter value={result.score} max={result.total} />
                                    <Typography type="body-sm" color="muted">
                                        {result.feedback}
                                    </Typography>
                                </div>
                            ) : (
                                <Typography type="body-sm" color="muted">
                                    {t("submission.noResult")}
                                </Typography>
                            )}
                        </div>
                    </>
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** Submission skeleton — settings + task + result. */
const SubmissionSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-1/2 rounded-large" />
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
    </div>
)
