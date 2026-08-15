"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button, Skeleton, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { RobotIcon, SparkleIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import { useMutateUpdateMyAiSettingsSwr } from "@/hooks/swr/api/graphql/mutations/useMutateUpdateMyAiSettingsSwr"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import type { GraphQLResponse } from "@/modules/api/graphql/types"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { handleRadioGroupKeyDown } from "../radio-group"

/** The lanes, in render order (mirrors `AiMode`). */
const LANES = [AiMode.Auto, AiMode.Premium] as const

/** Lane → icon. */
const LANE_ICON: Record<AiMode, React.ReactNode> = {
    [AiMode.Auto]: <RobotIcon className="size-5" aria-hidden focusable="false" />,
    [AiMode.Premium]: <SparkleIcon className="size-5" aria-hidden focusable="false" />,
}

/**
 * AiSettingsSection — the "Cài đặt FrosTES" settings screen: which AI lane the
 * viewer runs on (Auto / Premium).
 *
 * Reads `myAiSettings` and writes `updateMyAiSettings`, both through the existing
 * SWR wrappers. The lane picker only ENABLES what the account may actually use —
 * `canPremium` comes from the server, and a locked lane says so instead of failing
 * on save.
 *
 * There is no bring-your-own-key lane: a user's own API key means their own AI
 * allowance rather than the FTES plan's, which the product dropped. Both lanes
 * here run on the platform's quota.
 */
export const AiSettingsSection = () => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const { data, isLoading, error, mutate } = useQueryMyAiSettingsSwr()
    const { trigger, isMutating } = useMutateUpdateMyAiSettingsSwr()

    const [mode, setMode] = useState<AiMode>(AiMode.Auto)

    // adopt the server's answer once it lands (and after every successful write,
    // since the write revalidates this same key)
    useEffect(() => {
        if (!data) return
        setMode(data.preferredMode ?? data.effectiveMode)
    }, [data])

    /** Which lanes this account may pick. */
    const laneEnabled = useMemo<Record<AiMode, boolean>>(
        () => ({
            [AiMode.Auto]: true,
            [AiMode.Premium]: data?.canPremium ?? false,
        }),
        [data?.canPremium],
    )

    /** Persist the picked lane and refresh the settings cache. */
    const onSave = async () => {
        if (!data) return
        await runGraphQL(
            async (): Promise<GraphQLResponse> => {
                const result = await trigger({ mode })
                const envelope = result?.data?.updateMyAiSettings
                if (!envelope) {
                    throw new Error(t("aiSettings.error"))
                }
                if (!envelope.success) {
                    throw new Error(envelope.message || t("aiSettings.error"))
                }
                return envelope
            },
            { successMessage: t("aiSettings.saved"), showErrorToast: true },
        )
        await mutate()
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
                        className="grid gap-2 sm:grid-cols-2"
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
                                    onClick={() => { setMode(lane) }}
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
