"use client"

import React, { useMemo, useState } from "react"
import { cn, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { ConfigScope, FlagStatus } from "@/resources/constants/config"
import { configService } from "@/services/config"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { ConfigSkeleton } from "../ConfigSkeleton"
import { useQueryConfigFlagsSwr } from "../hooks"
import { FlagRow, FLAG_STATUS_LABEL_KEY } from "./FlagRow"
import { FlagConfirmModal } from "./FlagConfirmModal"
import type { PendingFlagChange } from "./FlagConfirmModal"

/** Status filter value: everything or one status. */
type StatusFilter = "all" | FlagStatus

/** The filter chips, in display order. */
const STATUS_FILTERS: ReadonlyArray<StatusFilter> = ["all", "on", "off", "rollout"]

/** Props for {@link FeatureFlagsPanel}. */
export interface FeatureFlagsPanelProps {
    /** Active config scope (only `"global"` reaches this panel). */
    scope: ConfigScope
}

/**
 * FeatureFlagsPanel — the `feature-flags` category: searchable, status-filterable
 * list of flags; each row offers the Off/On/Rollout radiogroup (status changes go
 * through {@link FlagConfirmModal}) and a rollout-percent input. All I/O flows
 * through the `configService` seam + the SWR-shaped flags hook.
 */
export const FeatureFlagsPanel = ({ scope }: FeatureFlagsPanelProps) => {
    const t = useTranslations()
    const swr = useQueryConfigFlagsSwr(scope)
    const [query, setQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [pending, setPending] = useState<PendingFlagChange | null>(null)
    const [isApplying, setIsApplying] = useState(false)

    const flags = useMemo(() => swr.data ?? [], [swr.data])
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return flags.filter((flag) => {
            if (statusFilter !== "all" && flag.status !== statusFilter) return false
            if (!q) return true
            return (
                flag.key.toLowerCase().includes(q)
                || t(flag.descriptionKey).toLowerCase().includes(q)
            )
        })
    }, [flags, query, statusFilter, t])

    /** Apply the confirmed status change through the service, then revalidate. */
    const onConfirm = async () => {
        if (!pending) return
        setIsApplying(true)
        try {
            await configService.setFlag(pending.flag.key, { status: pending.next })
            await swr.mutate()
        } catch {
            toast.danger(t("admin.config.settings.saveError"))
        } finally {
            setIsApplying(false)
            setPending(null)
        }
    }

    /** Commit a rollout-percent tweak (no confirm — still audited by the mock). */
    const onCommitRollout = async (flagKey: string, percent: number) => {
        try {
            await configService.setFlag(flagKey, { rolloutPercent: percent })
            await swr.mutate()
        } catch {
            toast.danger(t("admin.config.settings.saveError"))
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t("admin.config.flags.searchPlaceholder")}
                    variant="secondary"
                />
                <div
                    role="group"
                    aria-label={t("admin.config.flags.filterLabel")}
                    className="flex flex-wrap gap-2"
                >
                    {STATUS_FILTERS.map((filter) => {
                        const isActive = statusFilter === filter
                        const label = filter === "all"
                            ? t("admin.config.flags.filterAll")
                            : t(FLAG_STATUS_LABEL_KEY[filter])
                        return (
                            <button
                                key={filter}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setStatusFilter(filter)}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-xs transition-colors",
                                    isActive
                                        ? "border-accent bg-accent/10 text-accent"
                                        : "border-default text-muted hover:bg-default",
                                )}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <AsyncContent
                isLoading={!swr.data && !swr.error}
                skeleton={<ConfigSkeleton />}
                error={!swr.data ? swr.error : undefined}
                errorContent={{
                    title: t("admin.config.errorTitle"),
                    description: t("admin.config.errorBody"),
                    onRetry: () => { void swr.mutate() },
                    retryLabel: t("admin.config.retry"),
                }}
                isEmpty={filtered.length === 0}
                emptyContent={{
                    title: t("admin.config.flags.emptyTitle"),
                    description: t("admin.config.flags.emptyBody"),
                }}
            >
                <ul className="flex flex-col gap-3">
                    {filtered.map((flag) => (
                        <li key={flag.key}>
                            <FlagRow
                                flag={flag}
                                isBusy={isApplying}
                                onRequestStatus={(target, next) => setPending({ flag: target, next })}
                                onCommitRollout={(target, percent) => {
                                    void onCommitRollout(target.key, percent)
                                }}
                            />
                        </li>
                    ))}
                </ul>
            </AsyncContent>

            <FlagConfirmModal
                pending={pending}
                isApplying={isApplying}
                onConfirm={() => { void onConfirm() }}
                onCancel={() => {
                    if (!isApplying) setPending(null)
                }}
            />
        </div>
    )
}
