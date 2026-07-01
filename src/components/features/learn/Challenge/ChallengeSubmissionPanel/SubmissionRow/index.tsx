"use client"

import { WarningCircleIcon, PencilLineIcon } from "@phosphor-icons/react"
import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Button,
    cn,
    FieldError,
    Input,
    Spinner,
    TextField,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useSystemAiAutoConfig,
} from "@/hooks/useSystemAiAutoConfig"
import type {
    ChallengeGradeSelection,
    ChallengeSubmissionRowViewModel,
} from "../types"
import type { QueryMyCreditUsageResponseData } from "@/modules/api/graphql/queries/types/my-credit-usage"
import {
    GradeCreditDisplayKind,
} from "../types"
import {
    resolveGradeCreditDisplay,
} from "../utils"
import {
    GradeModelDropdown,
} from "@/components/blocks/grading/GradeModelDropdown"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import {
    LastAttemptResult,
} from "./LastAttemptResult"
import { JobCategory } from "@/modules/types/enums/job-category"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { AIProcessingText } from "@/components/reuseable/AIProcessingText"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { AiGradableModel } from "@/modules/api/graphql/queries/types/ai-models"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SubmissionRow}. */
export interface SubmissionRowProps extends WithClassNames<undefined> {
    /** Pre-computed render state for the row. */
    row: ChallengeSubmissionRowViewModel
    /** Fraction of the max score required to pass (0..1). */
    passThreshold: number
    /** Enabled models the grading dropdown can offer. */
    gradeModels: Array<AiGradableModel>
    /** This row's current grading-lane + model selection. */
    gradeSelection: ChallengeGradeSelection
    /** Whether the Premium lane is unlocked for this user. */
    canPremium: boolean
    /** Credit usage snapshot for the lane label beside the picker. */
    creditUsage: QueryMyCreditUsageResponseData | undefined
    /** Opens the AI quota details modal. */
    onOpenAiQuota: () => void
    /** Fired with the new URL value when the input changes. */
    onChangeUrl: (fieldName: string, value: string) => void
    /** Fired when the URL input is blurred (marks it touched). */
    onBlurUrl: (fieldName: string) => void
    /** Fired to submit this row's URL for grading. */
    onSubmit: (submissionId: string, index: number) => void
    /** Fired with this row's new grading selection. */
    onSelectGrade: (submissionId: string, selection: ChallengeGradeSelection) => void
    /** Fired when a locked model is pressed — route to the subscription page. */
    onUpgrade: () => void
    /** Fired to open the attempt history for this submission. */
    onViewAttempts: (submissionId: string) => void
    /**
     * True when the row is rendered INSIDE an accordion item (the deliverables list): the
     * accordion header already shows the title/status/score + owns the separation, so the row
     * drops its own title line + border/padding and renders only the form + result.
     */
    inAccordion?: boolean
}

/**
 * One challenge requirement: title, description, URL input, grade/history actions, the
 * active AI-processing panel and the last-attempt result.
 *
 * Presentational: renders the supplied {@link ChallengeSubmissionRowViewModel} and forwards
 * user intents through `onXXX` props; no data fetching or orchestration.
 * @param props - {@link SubmissionRowProps}
 */
export const SubmissionRow = ({
    row,
    passThreshold,
    gradeModels,
    gradeSelection,
    canPremium,
    creditUsage,
    onOpenAiQuota,
    onChangeUrl,
    onBlurUrl,
    onSubmit,
    onSelectGrade,
    onUpgrade,
    onViewAttempts,
    inAccordion = false,
    className,
}: SubmissionRowProps) => {
    const t = useTranslations()
    const aiAutoConfig = useSystemAiAutoConfig()
    const {
        submission,
        fieldName,
        inputId,
        urlValue,
        iconComponent: IconComponent,
        errorMessage,
        isTouched,
        isPending,
        isInputDisabled,
        isLoading,
        activeJobStatus,
        activeJobError,
        showActiveJob,
        lastAttemptScore,
        maxScore,
    } = row

    const creditDisplay = useMemo(
        () => resolveGradeCreditDisplay({
            mode: gradeSelection.mode,
            creditUsage,
            autoCreditCost: aiAutoConfig?.creditCost,
            t,
        }),
        [
            gradeSelection.mode,
            creditUsage,
            aiAutoConfig?.creditCost,
            t,
        ],
    )

    const isQuotaReached = creditDisplay.kind === GradeCreditDisplayKind.QuotaReached

    const onPressCreditLabel = useCallback(() => {
        if (gradeSelection.mode === AiMode.Byok) {
            return
        }
        onOpenAiQuota()
    }, [
        gradeSelection.mode,
        onOpenAiQuota,
    ])

    const creditLabelClassName = useMemo(
        () => cn(
            "inline-flex shrink-0 items-center gap-2 text-sm transition-colors",
            isQuotaReached
                ? "cursor-pointer font-semibold text-danger hover:opacity-90"
                : "cursor-pointer text-muted hover:text-foreground",
        ),
        [isQuotaReached],
    )

    return (
        <div className={cn(!inAccordion && "border-b last:border-b-0 p-3", className)}>
            <div className="flex flex-col gap-3">
                {!inAccordion ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-foreground">
                            <Typography type="body" className="font-semibold">
                                {submission.sortIndex + 1}
                                {". "}
                                {submission.title}
                            </Typography>
                            {IconComponent ? <IconComponent width={16} height={16} /> : null}
                        </div>
                        {submission.description ? (
                            <MarkdownContent
                                markdown={submission.description}
                                className="text-xs text-muted"
                            />
                        ) : null}
                    </div>
                ) : (
                    submission.description ? (
                        <MarkdownContent
                            markdown={submission.description}
                            className="text-xs text-muted"
                        />
                    ) : null
                )}
                <TextField variant="secondary"
                    className="w-full"
                    fullWidth
                    isInvalid={!!(isTouched && errorMessage)}
                >
                    <Input
                        variant="secondary"
                        id={inputId}
                        name={fieldName}
                        disabled={isInputDisabled}
                        placeholder={t("challenge.submissionModal.urlPlaceholder")}
                        value={urlValue}
                        onBlur={() => onBlurUrl(fieldName)}
                        onChange={(event) => onChangeUrl(fieldName, event.target.value)}
                    />
                    <FieldError>
                        {typeof errorMessage === "string" && errorMessage.startsWith("challenge.")
                            ? t(errorMessage)
                            : errorMessage}
                    </FieldError>
                </TextField>
                {
                    showActiveJob && activeJobStatus !== undefined
                        ? (
                            <AIProcessingText
                                classNames={{
                                    innerPanel: "bg-overlay",
                                }}
                                jobCategory={JobCategory.SubmitChallenge}
                                jobStatus={activeJobStatus}
                                error={activeJobError}
                            />
                        )
                        : isLoading
                            ? (
                                <div className="flex items-center gap-2">
                                    <Spinner />
                                    <Typography type="body-sm" className="text-muted">
                                        {t("challenge.submissionModal.loading")}
                                    </Typography>
                                </div>
                            )
                            : null
                }
                <div className="flex flex-col items-start gap-3">
                    <div className="flex w-full items-center justify-between gap-2">
                        <GradeModelDropdown
                            models={gradeModels}
                            selection={gradeSelection}
                            canPremium={canPremium}
                            isDisabled={isPending}
                            floor={AiModelCategory.Economy}
                            onSelect={(selection) => onSelectGrade(submission.id, selection)}
                            onUpgrade={onUpgrade}
                        />
                        {creditDisplay.kind !== GradeCreditDisplayKind.Hidden ? (
                            gradeSelection.mode === AiMode.Byok ? (
                                <span className="shrink-0 text-sm text-muted">
                                    {creditDisplay.text}
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onPressCreditLabel}
                                    className={creditLabelClassName}
                                >
                                    {isQuotaReached ? (
                                        <WarningCircleIcon
                                            className="size-5"
                                        />
                                    ) : null}
                                    <span className="text-sm font-base">{creditDisplay.text}</span>
                                </button>
                            )
                        ) : null}
                    </div>
                    <div className="flex w-full items-center gap-2">
                        <Button
                            isPending={isPending}
                            isDisabled={Boolean(errorMessage) || isInputDisabled}
                            size="lg"
                            variant="primary"
                            className="shrink-0"
                            onPress={() => onSubmit(submission.id, row.index)}
                        >
                            {({ isPending: pending }) => (
                                <>
                                    {pending ? <Spinner color="current" /> : <PencilLineIcon className="size-5 shrink-0" />}
                                    {t("challenge.submissionModal.submit")}
                                </>
                            )}
                        </Button>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="min-w-0 flex-1"
                            onPress={() => onViewAttempts(submission.id)}
                        >
                            <span className="truncate">
                                {t("challenge.submissionModal.viewAttempts")}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
            {submission.userSubmission?.lastAttempt ? (
                <LastAttemptResult
                    earnedScore={lastAttemptScore ?? 0}
                    maxScore={maxScore}
                    passThreshold={passThreshold}
                    feedbacks={submission.userSubmission.lastAttempt.feedbacks}
                />
            ) : null}
        </div>
    )
}
