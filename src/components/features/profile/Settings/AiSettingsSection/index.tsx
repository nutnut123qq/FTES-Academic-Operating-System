"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
    Button,
    Input,
    Label,
    Skeleton,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { KeyIcon, RobotIcon, SparkleIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import { useMutateUpdateMyAiSettingsSwr } from "@/hooks/swr/api/graphql/mutations/useMutateUpdateMyAiSettingsSwr"
import { AiMode, ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"
import type { UpdateMyAiSettingsRequest } from "@/modules/api/graphql/mutations/types/update-my-ai-settings"
import type { GraphQLResponse } from "@/modules/api/graphql/types"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { handleRadioGroupKeyDown } from "../radio-group"
import { buildAiSettingsRequest, buildClearByokRequest } from "./logic"

/** The three lanes, in render order (mirrors `AiMode`). */
const LANES = [AiMode.Auto, AiMode.Premium, AiMode.Byok] as const

/** The BYOK providers the backend accepts, in render order. */
const PROVIDERS = [ModelProvider.Gemini, ModelProvider.OpenAI] as const

/** Lane → icon. */
const LANE_ICON: Record<AiMode, React.ReactNode> = {
    [AiMode.Auto]: <RobotIcon className="size-5" aria-hidden focusable="false" />,
    [AiMode.Premium]: <SparkleIcon className="size-5" aria-hidden focusable="false" />,
    [AiMode.Byok]: <KeyIcon className="size-5" aria-hidden focusable="false" />,
}

/**
 * AiSettingsSection — the "Cài đặt FrosTES" settings screen: which AI lane the
 * viewer runs on (Auto / Premium / bring-your-own-key) and, for BYOK, the stored
 * provider + API key.
 *
 * Reads `myAiSettings` and writes `updateMyAiSettings`, both through the existing
 * SWR wrappers. The lane picker only ENABLES what the account may actually use —
 * `canPremium` / `canByok` come from the server, and a locked lane says so instead
 * of failing on save.
 *
 * The key itself is never echoed back by the API (only `byokKeyLast4`), so the
 * field always starts empty and a blank field means "keep what is stored" — which
 * is only safe while the provider is unchanged; {@link buildAiSettingsRequest}
 * owns that branch and is unit-tested.
 */
export const AiSettingsSection = () => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const { data, isLoading, error, mutate } = useQueryMyAiSettingsSwr()
    const { trigger, isMutating } = useMutateUpdateMyAiSettingsSwr()

    const [mode, setMode] = useState<AiMode>(AiMode.Auto)
    const [provider, setProvider] = useState<ModelProvider>(ModelProvider.Gemini)
    const [apiKey, setApiKey] = useState("")
    const [formError, setFormError] = useState<string | null>(null)

    // adopt the server's answer once it lands (and after every successful write,
    // since the write revalidates this same key)
    useEffect(() => {
        if (!data) return
        setMode(data.preferredMode ?? data.effectiveMode)
        setProvider(data.byokProvider ?? ModelProvider.Gemini)
        setApiKey("")
    }, [data])

    /** Which lanes this account may pick. */
    const laneEnabled = useMemo<Record<AiMode, boolean>>(
        () => ({
            [AiMode.Auto]: true,
            [AiMode.Premium]: data?.canPremium ?? false,
            [AiMode.Byok]: data?.canByok ?? false,
        }),
        [data?.canPremium, data?.canByok],
    )

    /** Send one request to `updateMyAiSettings` and refresh the settings cache. */
    const save = async (request: UpdateMyAiSettingsRequest, successMessage: string) => {
        await runGraphQL(
            async (): Promise<GraphQLResponse> => {
                const result = await trigger(request)
                const envelope = result?.data?.updateMyAiSettings
                if (!envelope) {
                    throw new Error(t("aiSettings.error"))
                }
                if (!envelope.success) {
                    throw new Error(envelope.message || t("aiSettings.error"))
                }
                return envelope
            },
            { successMessage, showErrorToast: true },
        )
        await mutate()
    }

    /** Validate the form, then persist it. */
    const onSave = async () => {
        if (!data) return
        const built = buildAiSettingsRequest(
            { mode, byokProvider: provider, byokApiKey: apiKey },
            { byokProvider: data.byokProvider, hasByokKey: data.hasByokKey },
        )
        if (!built.ok) {
            setFormError(t("aiSettings.byokKeyRequired"))
            return
        }
        setFormError(null)
        await save(built.request, t("aiSettings.saved"))
    }

    /** Wipe the stored key + provider. */
    const onRemoveKey = async () => {
        setFormError(null)
        await save(buildClearByokRequest(), t("aiSettings.keyRemoved"))
    }

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={<Skeleton className="h-96 w-full rounded-2xl" />}
            error={!data ? error : undefined}
            errorContent={{
                title: t("aiSettings.error"),
                onRetry: () => { void mutate() },
                retryLabel: t("aiSettings.retry"),
            }}
        >
            <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-0">
                    <Typography type="h6" weight="bold">
                        {t("aiSettings.title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("aiSettings.subtitle")}
                    </Typography>
                </div>

                {/* what the server says is actually in force right now (the preferred
                    lane can differ from the effective one when eligibility drops) */}
                <div className="flex flex-wrap items-center gap-2">
                    <Typography type="body-sm" color="muted">
                        {t("aiSettings.effectiveNow")}
                    </Typography>
                    <StatusChip tone="accent">
                        {t(`aiSettings.lanes.${data?.effectiveMode ?? AiMode.Auto}.title`)}
                    </StatusChip>
                    <Typography type="body-sm" color="muted">
                        {t("aiSettings.planLabel")}
                    </Typography>
                    <StatusChip tone={data?.tier ? "success" : "neutral"}>
                        {data?.tier ?? t("aiSettings.planFree")}
                    </StatusChip>
                </div>

                <section className="flex flex-col gap-3">
                    <div className="text-sm text-muted">{t("aiSettings.laneLabel")}</div>
                    <div
                        role="radiogroup"
                        aria-label={t("aiSettings.laneLabel")}
                        className="grid gap-2 sm:grid-cols-3"
                        onKeyDown={handleRadioGroupKeyDown}
                    >
                        {LANES.map((lane) => {
                            const isSelected = mode === lane
                            const enabled = laneEnabled[lane]
                            return (
                                <button
                                    key={lane}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    aria-disabled={!enabled || isMutating}
                                    disabled={!enabled || isMutating}
                                    tabIndex={isSelected ? 0 : -1}
                                    onClick={() => {
                                        setMode(lane)
                                        setFormError(null)
                                    }}
                                    className={cn(
                                        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left text-sm outline-none transition-colors",
                                        "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                        !enabled && "cursor-not-allowed opacity-50",
                                        isSelected
                                            ? "border-accent bg-accent/10 text-accent"
                                            : "border-default text-foreground hover:bg-default",
                                    )}
                                >
                                    <span className="flex items-center gap-2 font-semibold">
                                        {LANE_ICON[lane]}
                                        {t(`aiSettings.lanes.${lane}.title`)}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {t(`aiSettings.lanes.${lane}.desc`)}
                                    </span>
                                    {!enabled ? (
                                        <span className="text-xs text-warning">
                                            {t("aiSettings.premiumLocked")}
                                        </span>
                                    ) : null}
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* the key card only matters on the BYOK lane, or while a key is still
                    on file (so it can be removed after switching away) */}
                {mode === AiMode.Byok || data?.hasByokKey ? (
                    <SectionCard
                        title={t("aiSettings.byok.heading")}
                        icon={<KeyIcon className="size-5 text-muted" aria-hidden focusable="false" />}
                        action={data?.hasByokKey ? (
                            <Button
                                size="sm"
                                variant="danger"
                                isDisabled={isMutating}
                                onPress={() => { void onRemoveKey() }}
                            >
                                {t("aiSettings.byok.removeKey")}
                            </Button>
                        ) : undefined}
                    >
                        <div className="flex flex-col gap-4">
                            <Typography type="body-xs" color="muted">
                                {t("aiSettings.byokSubtitle")}
                            </Typography>

                            <div className="flex flex-col gap-2">
                                <div className="text-sm text-muted">
                                    {t("aiSettings.byok.provider")}
                                </div>
                                <div
                                    role="radiogroup"
                                    aria-label={t("aiSettings.byok.provider")}
                                    className="grid grid-cols-2 gap-2"
                                    onKeyDown={handleRadioGroupKeyDown}
                                >
                                    {PROVIDERS.map((option) => {
                                        const isSelected = provider === option
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                aria-disabled={isMutating}
                                                disabled={isMutating}
                                                tabIndex={isSelected ? 0 : -1}
                                                onClick={() => {
                                                    setProvider(option)
                                                    setFormError(null)
                                                }}
                                                className={cn(
                                                    "rounded-xl border p-3 text-sm outline-none transition-colors",
                                                    "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                                    isSelected
                                                        ? "border-accent bg-accent/10 text-accent"
                                                        : "border-default text-foreground hover:bg-default",
                                                )}
                                            >
                                                {t(`aiSettings.providerName.${option}`)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {data?.hasByokKey ? (
                                <Typography type="body-xs" color="muted">
                                    {t("aiSettings.byok.keyOnFile")}
                                    {data.byokKeyLast4 ? ` · ····${data.byokKeyLast4}` : ""}
                                </Typography>
                            ) : null}

                            <TextField variant="secondary" isInvalid={Boolean(formError)}>
                                <Label htmlFor="ai-settings-byok-key">
                                    {t("aiSettings.byok.apiKey")}
                                </Label>
                                <Input
                                    id="ai-settings-byok-key"
                                    type="password"
                                    value={apiKey}
                                    autoComplete="off"
                                    placeholder={data?.hasByokKey
                                        ? t("aiSettings.byok.apiKeyPlaceholderReplace")
                                        : t("aiSettings.byok.apiKeyPlaceholder")}
                                    onChange={(event) => {
                                        setApiKey(event.target.value)
                                        setFormError(null)
                                    }}
                                />
                            </TextField>

                            <Typography type="body-xs" color="muted">
                                {t("aiSettings.byok.keyHint")}
                            </Typography>

                            {formError ? (
                                <Typography type="body-xs" className="text-danger" role="alert">
                                    {formError}
                                </Typography>
                            ) : null}
                        </div>
                    </SectionCard>
                ) : null}

                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        size="sm"
                        isPending={isMutating}
                        isDisabled={isMutating || !data}
                        onPress={() => { void onSave() }}
                    >
                        {t("aiSettings.save")}
                    </Button>
                </div>
            </section>
        </AsyncContent>
    )
}
