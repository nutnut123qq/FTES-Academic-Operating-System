"use client"

import React, {
    useCallback,
    useMemo,
    useState,
} from "react"
import {
    Button,
    Chip,
    Spinner,
    cn,
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
import type {
    AiLabModelSelection,
    AiLabParamsForm,
} from "../types"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { type AiGradableModel } from "@/modules/api/graphql/queries/types/ai-models"
import { type AiLabPlaygroundData } from "@/modules/api/graphql/queries/types/ai-lab-playground"
import { type GraphQLResponse } from "@/modules/api/graphql/types"
import { type RunPlaygroundPromptData } from "@/modules/api/graphql/mutations/types/run-playground-prompt"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAiLabRunStreamSocketIo } from "@/hooks/socketio/useAiLabRunStreamSocketIo"
import { useMutateRunPlaygroundPromptSwr } from "@/hooks/swr/api/graphql/mutations/useMutateRunPlaygroundPromptSwr"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { useQueryMyAiQuotaSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiQuotaSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import { useQueryMyAiLabRunsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiLabRunsSwr"
import { AiLabRunStatus } from "@/hooks/socketio/types/ai-lab"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Props for {@link PromptPlayground}. */
export type PromptPlaygroundProps = WithClassNames<undefined> & {
    /** The playground bound to this lesson. */
    playground: AiLabPlaygroundData
}

/** Default param values used when the playground does not seed them. */
const FALLBACK_PARAMS: AiLabParamsForm = {
    temperature: 0.7,
    topP: 1,
    maxTokens: 1024,
}

/** Build the param form from the playground defaults (falling back per field). */
const buildDefaultParams = (playground: AiLabPlaygroundData): AiLabParamsForm => ({
    temperature: playground.defaultParams?.temperature ?? FALLBACK_PARAMS.temperature,
    topP: playground.defaultParams?.topP ?? FALLBACK_PARAMS.topP,
    maxTokens: playground.defaultParams?.maxTokens ?? FALLBACK_PARAMS.maxTokens,
})

/**
 * Prompt playground surface: system + user prompt inputs, generation params, a lane/model
 * picker, and a Run/Abort control. The streamed response is read live from the Redux
 * `aiLabRunById` map via {@link useAiLabRunStreamSocketIo}; cache hits render inline.
 *
 * Container: owns the editable prompt/param/selection state and the run mutation, then
 * subscribes to the `/ai_lab` token stream for non-cached runs.
 * @param props - {@link PromptPlaygroundProps}
 */
export const PromptPlayground = ({ playground, className }: PromptPlaygroundProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const runGraphQL = useGraphQLWithToast()

    // Editable prompt + param + lane state, seeded from the playground defaults.
    const [systemPrompt, setSystemPrompt] = useState(playground.defaultSystemPrompt ?? "")
    const [userPrompt, setUserPrompt] = useState(playground.defaultUserPrompt ?? "")
    const [params, setParams] = useState<AiLabParamsForm>(() => buildDefaultParams(playground))
    const [selection, setSelection] = useState<AiLabModelSelection>({
        mode: AiMode.Auto,
        model: null,
        provider: null,
    })

    // The run currently being tracked (set after the mutation returns a streaming run id).
    const [runId, setRunId] = useState<string | undefined>(undefined)
    // Inline output when the run was served from cache (no socket stream).
    const [cachedOutput, setCachedOutput] = useState<string | null>(null)
    // Window budget hint returned by the last run.
    const [quotaExhausted, setQuotaExhausted] = useState(false)

    const runPromptSwr = useMutateRunPlaygroundPromptSwr()
    const { run, subscribe, abort, reset } = useAiLabRunStreamSocketIo(runId)

    // Lane/model catalog + entitlement for the picker.
    const aiModelsSwr = useQueryAiModelsSwr()
    const aiSettingsSwr = useQueryMyAiSettingsSwr()
    const canPremium = Boolean(aiSettingsSwr.data?.canPremium)
    useQueryMyAiQuotaSwr()
    const runsSwr = useQueryMyAiLabRunsSwr(playground.id)

    const gradableModels = useMemo<Array<AiGradableModel>>(
        () => aiModelsSwr.data?.aiModels?.data?.gradableModels ?? [],
        [aiModelsSwr.data],
    )

    /** Route to AI settings so the user can subscribe or add a BYOK key. */
    const onGoToAiSettings = useCallback(
        () => {
            router.push(`/${locale}/profile/settings/ai-settings`)
        },
        [router, locale],
    )

    // The run is streaming while the socket has a live, not-yet-done entry for it.
    const isStreaming = Boolean(run && !run.done)
    const isPending = runPromptSwr.isMutating || isStreaming

    /** Submit the prompt: fire the mutation, then either render the cache hit or subscribe to the stream. */
    const onRun = useCallback(
        async () => {
            if (!userPrompt.trim()) {
                return
            }
            // Reset prior run state before starting a new one.
            if (runId) {
                reset(runId)
            }
            setRunId(undefined)
            setCachedOutput(null)
            // The run payload captured from the mutation so the success path can drive streaming.
            let result: GraphQLResponse<RunPlaygroundPromptData> | undefined
            const ok = await runGraphQL<RunPlaygroundPromptData>(
                async () => {
                    const response = await runPromptSwr.trigger({
                        playgroundId: playground.id,
                        systemPrompt: systemPrompt.trim() || undefined,
                        userPrompt: userPrompt.trim(),
                        params: {
                            temperature: params.temperature,
                            topP: params.topP,
                            maxTokens: params.maxTokens,
                        },
                        mode: selection.mode,
                        selectedModel: selection.model ?? undefined,
                        selectedModelProvider: selection.provider ?? undefined,
                    })
                    result = response.data?.runPlaygroundPrompt
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
            const { runId: nextRunId, status, cachedOutput: nextCachedOutput, quotaExhausted: exhausted } =
                result.data
            setQuotaExhausted(exhausted)
            // Cache hit: the output is returned inline, never streamed over the socket.
            if (status === AiLabRunStatus.Cached) {
                setCachedOutput(nextCachedOutput ?? "")
                setRunId(nextRunId)
                return
            }
            // Live run: track it and subscribe to the token stream.
            setRunId(nextRunId)
            subscribe(nextRunId)
        },
        [
            userPrompt,
            runId,
            reset,
            runGraphQL,
            runPromptSwr,
            playground.id,
            systemPrompt,
            params,
            selection,
            subscribe,
        ],
    )

    /** Abort the in-flight stream. */
    const onAbort = useCallback(
        () => {
            if (runId) {
                abort(runId)
            }
        },
        [runId, abort],
    )

    /** Restore the prompts/params to the playground defaults and drop the tracked run. */
    const onReset = useCallback(
        () => {
            setSystemPrompt(playground.defaultSystemPrompt ?? "")
            setUserPrompt(playground.defaultUserPrompt ?? "")
            setParams(buildDefaultParams(playground))
            setSelection({ mode: AiMode.Auto, model: null, provider: null })
            setCachedOutput(null)
            if (runId) {
                reset(runId)
            }
            setRunId(undefined)
        },
        [playground, runId, reset],
    )

    // Output to render: cache hit text, otherwise the accumulated stream.
    const outputText = cachedOutput ?? run?.output ?? ""
    const isCached = cachedOutput !== null
    const isFailed = run?.status === AiLabRunStatus.Failed
    const promptTokens = run?.promptTokens
    const completionTokens = run?.completionTokens
    const priorRuns = runsSwr.data ?? []

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{t("aiLab.playground.title")}</h3>
                <p className="text-sm text-muted">{t("aiLab.playground.description")}</p>
            </div>

            {/* System prompt */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="ai-lab-system-prompt"
                    className="text-sm text-muted"
                >
                    {t("aiLab.playground.systemPrompt")}
                </label>
                <textarea
                    id="ai-lab-system-prompt"
                    rows={3}
                    value={systemPrompt}
                    disabled={isPending}
                    onChange={(event) => setSystemPrompt(event.target.value)}
                    placeholder={t("aiLab.playground.systemPromptPlaceholder")}
                    className="w-full resize-y rounded-2xl border border-default bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
                />
            </div>

            {/* User prompt */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="ai-lab-user-prompt"
                    className="text-sm text-muted"
                >
                    {t("aiLab.playground.userPrompt")}
                </label>
                <textarea
                    id="ai-lab-user-prompt"
                    rows={5}
                    value={userPrompt}
                    disabled={isPending}
                    onChange={(event) => setUserPrompt(event.target.value)}
                    placeholder={t("aiLab.playground.userPromptPlaceholder")}
                    className="w-full resize-y rounded-2xl border border-default bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
                />
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

            {/* Lane/model + actions */}
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="tertiary"
                        size="sm"
                        isDisabled={isPending}
                        onPress={onReset}
                    >
                        {t("aiLab.playground.resetToDefault")}
                    </Button>
                    {isStreaming ? (
                        <Button
                            variant="danger"
                            size="sm"
                            onPress={onAbort}
                        >
                            {t("aiLab.playground.abort")}
                        </Button>
                    ) : null}
                    <Button
                        variant="primary"
                        size="sm"
                        isPending={isPending}
                        isDisabled={!userPrompt.trim()}
                        onPress={onRun}
                    >
                        {t("aiLab.playground.run")}
                    </Button>
                </div>
            </div>

            {/* Quota exhausted nudge → BYOK */}
            {quotaExhausted ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3">
                    <span className="text-sm">
                        {t("aiLab.playground.quotaExhausted")} {t("aiLab.playground.byokNudge")}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onPress={onGoToAiSettings}
                    >
                        {t("aiLab.playground.goToAiSettings")}
                    </Button>
                </div>
            ) : null}

            {/* Output pane */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">{t("aiLab.playground.output")}</span>
                    {isCached ? (
                        <Chip
                            size="sm"
                            color="default"
                            variant="soft"
                        >
                            {t("aiLab.playground.cached")}
                        </Chip>
                    ) : null}
                    {isStreaming ? <Spinner size="sm" /> : null}
                </div>
                <div className="min-h-24 rounded-2xl border border-default bg-surface p-4">
                    {isFailed ? (
                        <span className="text-sm text-danger">
                            {run?.errorMessage ?? t("aiLab.playground.failed")}
                        </span>
                    ) : outputText ? (
                        <MarkdownContent markdown={outputText} />
                    ) : (
                        <span className="text-sm text-muted">{t("aiLab.playground.outputEmpty")}</span>
                    )}
                </div>
                {(promptTokens != null || completionTokens != null) ? (
                    <span className="text-xs text-muted">
                        {t("aiLab.playground.tokens", {
                            prompt: promptTokens ?? 0,
                            completion: completionTokens ?? 0,
                        })}
                    </span>
                ) : null}
            </div>

            {/* Prior runs */}
            {priorRuns.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted">{t("aiLab.playground.runHistory")}</span>
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-default">
                        {priorRuns.map((priorRun) => (
                            <div
                                key={priorRun.id}
                                className="flex items-center justify-between gap-3 border-b border-divider px-4 py-2 last:border-b-0"
                            >
                                <span className="min-w-0 truncate text-sm">{priorRun.userPrompt}</span>
                                <Chip
                                    size="sm"
                                    color={priorRun.status === AiLabRunStatus.Failed ? "danger" : "default"}
                                    variant="soft"
                                >
                                    {t(`aiLab.status.${priorRun.status}`)}
                                </Chip>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
