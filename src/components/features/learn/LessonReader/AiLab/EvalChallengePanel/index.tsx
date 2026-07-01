"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    Button,
    Chip,
    Spinner,
    cn,
    toast,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    LaneModelPicker,
} from "../LaneModelPicker"
import {
    ParamControls,
} from "../ParamControls"
import {
    CaseResultRow,
} from "./CaseResultRow"
import type {
    AiLabModelSelection,
    AiLabParamsForm,
} from "../types"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { type AiGradableModel } from "@/modules/api/graphql/queries/types/ai-models"
import { type GraphQLResponse } from "@/modules/api/graphql/types"
import { type SubmitEvalChallengeData } from "@/modules/api/graphql/mutations/types/submit-eval-challenge"
import { JobStatus } from "@/modules/types/enums/job-status"
import { type WithClassNames } from "@/modules/types/base/class-name"
import { PublicationEvent } from "@/hooks/socketio/enums/publication-event"
import { useJobNotificationsSocketIo } from "@/hooks/socketio/useJobNotificationsSocketIo"
import { useMutateSubmitEvalChallengeSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSubmitEvalChallengeSwr"
import { useQueryAiLabEvalResultSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiLabEvalResultSwr"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link EvalChallengePanel}. */
export type EvalChallengePanelProps = WithClassNames<undefined> & {
    /** Eval set this lesson grades against. */
    evalSetId: string
}

/** Default param values used as a starting point for an eval submission. */
const DEFAULT_PARAMS: AiLabParamsForm = {
    temperature: 0.2,
    topP: 1,
    maxTokens: 1024,
}

/**
 * Evaluation challenge surface: a system prompt + a `{{input}}` user template + params/model,
 * submitted to `submitEvalChallenge`. The background grading job is tracked over the existing
 * `/job_notifications` socket; once it completes the eval result is refetched and the per-case
 * breakdown is rendered.
 *
 * Container: owns the editable template/param/selection state, the submit mutation, the
 * tracked job/eval-run ids, and the result refetch.
 * @param props - {@link EvalChallengePanelProps}
 */
export const EvalChallengePanel = ({ evalSetId, className }: EvalChallengePanelProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const runGraphQL = useGraphQLWithToast()

    const enrollmentId = useAppSelector((state) => state.user.enrollment?.id)

    // Editable submission state.
    const [systemPrompt, setSystemPrompt] = useState("")
    const [userTemplate, setUserTemplate] = useState("")
    const [params, setParams] = useState<AiLabParamsForm>(DEFAULT_PARAMS)
    const [selection, setSelection] = useState<AiLabModelSelection>({
        mode: AiMode.Auto,
        model: null,
        provider: null,
    })

    // The grading job + eval run currently tracked.
    const [jobId, setJobId] = useState<string | undefined>(undefined)
    const [evalRunId, setEvalRunId] = useState<string | undefined>(undefined)

    const submitEvalSwr = useMutateSubmitEvalChallengeSwr()
    const evalResultSwr = useQueryAiLabEvalResultSwr(evalRunId)
    const aiModelsSwr = useQueryAiModelsSwr()
    const aiSettingsSwr = useQueryMyAiSettingsSwr()
    const canPremium = Boolean(aiSettingsSwr.data?.canPremium)

    const jobNotificationsSocket = useJobNotificationsSocketIo()
    const jobStatusByJobId = useAppSelector((state) => state.socketIo.jobStatusByJobId)

    const gradableModels = useMemo<Array<AiGradableModel>>(
        () => aiModelsSwr.data?.aiModels?.data?.gradableModels ?? [],
        [aiModelsSwr.data],
    )

    // Live status of the tracked grading job, if any.
    const jobStatus = jobId ? jobStatusByJobId[jobId]?.data?.status : undefined
    const isGrading = jobStatus === JobStatus.Queued || jobStatus === JobStatus.Processing
    const isPending = submitEvalSwr.isMutating || isGrading

    // When the grading job completes, refetch the eval result so the breakdown lights up.
    const refetchEvalResult = evalResultSwr.mutate
    useEffect(
        () => {
            if (jobStatus === JobStatus.Completed && evalRunId) {
                void refetchEvalResult()
            }
        },
        [jobStatus, evalRunId, refetchEvalResult],
    )

    /** Route to AI settings so the user can subscribe or add a BYOK key. */
    const onGoToAiSettings = useCallback(
        () => {
            router.push(`/${locale}/profile/settings/ai-settings`)
        },
        [router, locale],
    )

    /** Submit the template for grading and subscribe to the new job's notifications. */
    const onSubmit = useCallback(
        async () => {
            if (!userTemplate.trim()) {
                return
            }
            if (!enrollmentId) {
                toast.danger("Error", {
                    description: t("aiLab.eval.empty"),
                })
                return
            }
            // The submission payload captured from the mutation so the success path can subscribe to the job.
            let result: GraphQLResponse<SubmitEvalChallengeData> | undefined
            const ok = await runGraphQL<SubmitEvalChallengeData>(
                async () => {
                    const response = await submitEvalSwr.trigger({
                        evalSetId,
                        enrollmentId,
                        systemPrompt: systemPrompt.trim() || undefined,
                        userTemplate: userTemplate.trim(),
                        params: {
                            temperature: params.temperature,
                            topP: params.topP,
                            maxTokens: params.maxTokens,
                        },
                        mode: selection.mode,
                        selectedModel: selection.model ?? undefined,
                        selectedModelProvider: selection.provider ?? undefined,
                    })
                    result = response.data?.submitEvalChallenge
                    if (!result?.success || !result.data) {
                        throw new Error(result?.message ?? response.error?.message)
                    }
                    return result
                },
                { showSuccessToast: false },
            )
            if (!ok || !result?.data) {
                return
            }
            const { evalRunId: nextEvalRunId, jobId: nextJobId } = result.data
            setEvalRunId(nextEvalRunId)
            setJobId(nextJobId)
            jobNotificationsSocket.emit(
                PublicationEvent.SubscribeJobNotification,
                {
                    data: { jobId: nextJobId },
                    locale,
                },
            )
        },
        [
            userTemplate,
            enrollmentId,
            runGraphQL,
            submitEvalSwr,
            evalSetId,
            systemPrompt,
            params,
            selection,
            jobNotificationsSocket,
            locale,
            t,
        ],
    )

    const result = evalResultSwr.data
    const caseResults = useMemo(
        () => [...(result?.caseResults ?? [])].sort((prev, next) => prev.orderIndex - next.orderIndex),
        [result?.caseResults],
    )
    const passedCount = useMemo(
        () => caseResults.filter((caseResult) => caseResult.passed).length,
        [caseResults],
    )

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{t("aiLab.eval.title")}</h3>
                <p className="text-sm text-muted">{t("aiLab.eval.description")}</p>
            </div>

            {/* System prompt */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="ai-lab-eval-system-prompt"
                    className="text-sm text-muted"
                >
                    {t("aiLab.eval.systemPrompt")}
                </label>
                <textarea
                    id="ai-lab-eval-system-prompt"
                    rows={3}
                    value={systemPrompt}
                    disabled={isPending}
                    onChange={(event) => setSystemPrompt(event.target.value)}
                    placeholder={t("aiLab.eval.systemPromptPlaceholder")}
                    className="w-full resize-y rounded-2xl border border-default bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
                />
            </div>

            {/* User template */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="ai-lab-eval-user-template"
                    className="text-sm text-muted"
                >
                    {t("aiLab.eval.userTemplate")}
                </label>
                <textarea
                    id="ai-lab-eval-user-template"
                    rows={5}
                    value={userTemplate}
                    disabled={isPending}
                    onChange={(event) => setUserTemplate(event.target.value)}
                    placeholder={t("aiLab.eval.userTemplatePlaceholder")}
                    className="w-full resize-y rounded-2xl border border-default bg-background px-4 py-3 text-sm font-mono text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
                />
                <span className="text-xs text-muted">{t("aiLab.eval.templatePlaceholderHint")}</span>
            </div>

            {/* Params */}
            <div className="flex flex-col gap-2">
                <span className="text-sm text-muted">{t("aiLab.playground.params")}</span>
                <ParamControls
                    params={params}
                    isDisabled={isPending}
                    onChange={setParams}
                />
            </div>

            {/* Lane/model + submit */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">{t("aiLab.playground.model")}:</span>
                    <LaneModelPicker
                        models={gradableModels}
                        selection={selection}
                        canPremium={canPremium}
                        isDisabled={isPending}
                        onSelect={setSelection}
                        onUpgrade={onGoToAiSettings}
                    />
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    isPending={isPending}
                    isDisabled={!userTemplate.trim()}
                    onPress={onSubmit}
                >
                    {isGrading ? t("aiLab.eval.grading") : t("aiLab.eval.submit")}
                </Button>
            </div>

            {/* Grading in flight */}
            {isGrading ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                    <Spinner size="sm" />
                    {t("aiLab.eval.grading")}
                </div>
            ) : null}

            {/* Verdict + per-case breakdown */}
            {result && caseResults.length > 0 ? (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">
                            {t("aiLab.eval.passedSummary", {
                                passed: passedCount,
                                total: caseResults.length,
                            })}
                        </span>
                        {result.totalScore != null && result.maxScore != null ? (
                            <Chip
                                size="sm"
                                color="default"
                                variant="soft"
                            >
                                {t("aiLab.eval.score", {
                                    score: result.totalScore,
                                    max: result.maxScore,
                                })}
                            </Chip>
                        ) : null}
                        {result.passed != null ? (
                            <Chip
                                size="sm"
                                color={result.passed ? "success" : "danger"}
                                variant="soft"
                            >
                                {result.passed ? t("aiLab.eval.passed") : t("aiLab.eval.failed")}
                            </Chip>
                        ) : null}
                    </div>
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-default">
                        {caseResults.map((caseResult) => (
                            <CaseResultRow
                                key={caseResult.id}
                                caseResult={caseResult}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
