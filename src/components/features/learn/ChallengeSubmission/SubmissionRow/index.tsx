"use client"

import React, { useState } from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Input,
    Spinner,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import { CaretDownIcon, PencilLineIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { LastAttemptResult } from "./LastAttemptResult"
import type {
    ChallengeRequirement,
    GraderOption,
    SubmissionAttempt,
} from "../../hooks/useQueryChallengeSubmissionSwr"

/** Props for {@link SubmissionRow}. */
export interface SubmissionRowProps {
    requirement: ChallengeRequirement
    passThreshold: number
    graders: Array<GraderOption>
    /** The most recent attempt (mock-appended locally after a submit). */
    latestAttempt: SubmissionAttempt | null
    /** Fires with a fabricated attempt when the learner submits. */
    onSubmitted: (attempt: SubmissionAttempt) => void
    /** Opens the attempts history for this requirement. */
    onViewAttempts: () => void
    /** Extra classes. */
    className?: string
}

/**
 * One requirement's submission row (StarCI port): the description, a URL input, a
 * grader-model picker with credits, Submit + View-attempts actions, an
 * AI-processing state while grading, and the last attempt's result inline.
 *
 * Submission is a local mock (fabricates a graded attempt after a short tick,
 * mirroring the async grader) — a real BE runs the grader over a socket and
 * streams job status. The grader picker + credits + attempts are faithful to
 * StarCI's panel, minus the live quota/socket wiring.
 *
 * @param props - {@link SubmissionRowProps}
 */
export const SubmissionRow = ({
    requirement,
    passThreshold,
    graders,
    latestAttempt,
    onSubmitted,
    onViewAttempts,
    className,
}: SubmissionRowProps) => {
    const t = useTranslations("learn")
    const [url, setUrl] = useState("")
    const [graderKey, setGraderKey] = useState(graders[0]?.key ?? "auto")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const activeGrader = graders.find((grader) => grader.key === graderKey) ?? graders[0]

    const onSubmit = () => {
        if (url.trim() === "" || isSubmitting) {
            return
        }
        setIsSubmitting(true)
        // MOCK grader: fabricate a graded attempt after a tick. Swap for the socket
        // job-status flow + `submitChallengeSubmission` mutation when the BE lands.
        window.setTimeout(() => {
            const attemptNumber = (latestAttempt?.attemptNumber ?? 0) + 1
            onSubmitted({
                id: `${requirement.id}-a${attemptNumber}`,
                attemptNumber,
                score: Math.min(requirement.score, 88 + attemptNumber * 3),
                submissionUrl: url.trim(),
                servedModel: activeGrader?.label ?? "Auto",
                processedAt: new Date().toISOString(),
                feedbacks: [
                    {
                        id: `${requirement.id}-a${attemptNumber}-f1`,
                        severity: "medium",
                        message: t("submission.mockFeedback"),
                        location: "src/main.ts:12",
                    },
                ],
            })
            setIsSubmitting(false)
        }, 700)
    }

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {requirement.description ? (
                <MarkdownContent markdown={requirement.description} className="text-xs text-muted" />
            ) : null}

            {/* submission URL */}
            <TextField variant="secondary" className="w-full" isDisabled={isSubmitting}>
                <Input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder={requirement.urlPlaceholder}
                    aria-label={t("submission.urlLabel")}
                />
            </TextField>

            {/* AI processing state */}
            {isSubmitting ? (
                <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <Typography type="body-sm" color="muted">
                        {t("submission.processing")}
                    </Typography>
                </div>
            ) : null}

            {/* grader picker + credits */}
            <div className="flex w-full items-center justify-between gap-2">
                <Dropdown>
                    <DropdownTrigger className="cursor-pointer rounded-2xl border border-default px-3 py-2">
                        <div className="flex items-center gap-2">
                            <SparkleIcon aria-hidden focusable="false" className="size-4 text-accent" />
                            <span className="text-sm font-medium">{activeGrader?.label ?? ""}</span>
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
                {activeGrader ? (
                    <Typography type="body-sm" color="muted" className="shrink-0">
                        {activeGrader.creditsLabel}
                    </Typography>
                ) : null}
            </div>

            {/* actions */}
            <div className="flex w-full items-center gap-2">
                <Button
                    variant="primary"
                    className="shrink-0"
                    isPending={isSubmitting}
                    isDisabled={url.trim() === "" || isSubmitting}
                    onPress={onSubmit}
                >
                    <PencilLineIcon aria-hidden focusable="false" className="size-5" />
                    {t("submission.submit")}
                </Button>
                <Button variant="secondary" className="min-w-0 flex-1" onPress={onViewAttempts}>
                    <span className="truncate">{t("submission.viewAttempts")}</span>
                </Button>
            </div>

            {/* last attempt result */}
            {latestAttempt && latestAttempt.score !== null ? (
                <LastAttemptResult
                    earnedScore={latestAttempt.score}
                    maxScore={requirement.score}
                    passThreshold={passThreshold}
                    feedbacks={latestAttempt.feedbacks}
                />
            ) : null}
        </div>
    )
}

export default SubmissionRow
