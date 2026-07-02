"use client"

import React, { useEffect, useState } from "react"
import { Input, TextField, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import type { FeatureFlag, FlagStatus } from "@/resources/constants/config"
import { CONFIG_AUDIT_YOU } from "@/resources/constants/config"
import { handleRadioGroupKeyDown } from "../../utils/radio-group"

/** The three flag statuses, in radiogroup order. */
const STATUS_OPTIONS: ReadonlyArray<FlagStatus> = ["off", "on", "rollout"]

/** i18n key (under `admin.config.flags`) per status. */
export const FLAG_STATUS_LABEL_KEY: Record<FlagStatus, string> = {
    on: "admin.config.flags.statusOn",
    off: "admin.config.flags.statusOff",
    rollout: "admin.config.flags.statusRollout",
}

/** Props for {@link FlagRow}. */
export interface FlagRowProps {
    /** The flag this row renders. */
    flag: FeatureFlag
    /** Fired with the requested status — the panel opens the confirm modal. */
    onRequestStatus: (flag: FeatureFlag, next: FlagStatus) => void
    /** Fired with the new rollout percent (committed on blur/Enter, no confirm). */
    onCommitRollout: (flag: FeatureFlag, percent: number) => void
    /** Disables the controls while a change is in flight. */
    isBusy: boolean
}

/**
 * FlagRow — one feature flag: key + description on the left; the Off/On/Rollout
 * status radiogroup (labelled per flag) + the 0–100 rollout percent input (only
 * while in rollout) on the right; a muted last-changed caption underneath.
 * Status changes are only REQUESTED here — the panel confirms before applying.
 */
export const FlagRow = ({ flag, onRequestStatus, onCommitRollout, isBusy }: FlagRowProps) => {
    const t = useTranslations()
    const locale = useLocale()
    // local draft of the percent so typing does not write the store on each keystroke
    const [percentDraft, setPercentDraft] = useState(String(flag.rolloutPercent))
    useEffect(() => {
        setPercentDraft(String(flag.rolloutPercent))
    }, [flag.rolloutPercent])

    /** Clamp + commit the drafted percent (blur / Enter). */
    const commitPercent = () => {
        const parsed = Math.round(Number(percentDraft))
        const clamped = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : flag.rolloutPercent
        setPercentDraft(String(clamped))
        if (clamped !== flag.rolloutPercent) {
            onCommitRollout(flag, clamped)
        }
    }

    const who = flag.lastChangedBy === CONFIG_AUDIT_YOU
        ? t("admin.config.audit.you")
        : flag.lastChangedBy
    const when = new Date(flag.lastChangedAt).toLocaleString(locale)

    return (
        <div className="flex flex-col gap-3 rounded-large border border-separator p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0">
                <span className="truncate font-mono text-sm font-medium text-foreground">
                    {flag.key}
                </span>
                <span className="text-xs text-muted">{t(flag.descriptionKey)}</span>
                <span className="text-xs text-muted">
                    {t("admin.config.flags.lastChanged", { who, when })}
                </span>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <div
                    role="radiogroup"
                    aria-label={t("admin.config.flags.statusLabel", { key: flag.key })}
                    className={cn("flex gap-2", isBusy && "pointer-events-none opacity-50")}
                    onKeyDown={handleRadioGroupKeyDown}
                >
                    {STATUS_OPTIONS.map((status) => {
                        const isSelected = flag.status === status
                        return (
                            <button
                                key={status}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                aria-disabled={isBusy}
                                disabled={isBusy}
                                tabIndex={isSelected ? 0 : -1}
                                onClick={() => {
                                    if (isBusy || isSelected) return
                                    onRequestStatus(flag, status)
                                }}
                                className={cn(
                                    "rounded-xl border px-3 py-1.5 text-sm outline-none transition-colors",
                                    "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                                    isSelected
                                        ? "border-accent bg-accent/10 text-accent"
                                        : "border-default text-foreground hover:bg-default",
                                )}
                            >
                                {t(FLAG_STATUS_LABEL_KEY[status])}
                            </button>
                        )
                    })}
                </div>
                {flag.status === "rollout" ? (
                    <TextField aria-label={t("admin.config.flags.rolloutPercent")} className="w-28">
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            variant="secondary"
                            value={percentDraft}
                            disabled={isBusy}
                            onChange={(event) => setPercentDraft(event.target.value)}
                            onBlur={commitPercent}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") commitPercent()
                            }}
                        />
                    </TextField>
                ) : null}
            </div>
        </div>
    )
}
