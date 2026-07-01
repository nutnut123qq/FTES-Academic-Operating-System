"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type {
    AiLabParamsForm,
} from "../types"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ParamControls}. */
export type ParamControlsProps = WithClassNames<undefined> & {
    /** Current generation params. */
    params: AiLabParamsForm
    /** Disables all inputs (e.g. while a run is in flight). */
    isDisabled?: boolean
    /** Fired with the patched params when any field changes. */
    onChange: (params: AiLabParamsForm) => void
}

/** One labelled numeric param input row. */
interface ParamFieldProps {
    /** Label shown above the input. */
    label: string
    /** DOM id for the input. */
    id: string
    /** Current numeric value. */
    value: number
    /** Smallest allowed value. */
    min: number
    /** Largest allowed value. */
    max: number
    /** Step increment. */
    step: number
    /** Disables the input. */
    isDisabled: boolean
    /** Fired with the parsed number on change. */
    onChange: (value: number) => void
}

/** A single numeric param input, styled to match the codebase's plain-input convention. */
const ParamField = ({
    label,
    id,
    value,
    min,
    max,
    step,
    isDisabled,
    onChange,
}: ParamFieldProps) => (
    <div className="flex flex-col gap-2">
        <label
            htmlFor={id}
            className="text-sm text-muted"
        >
            {label}
        </label>
        <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : ""}
            disabled={isDisabled}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full rounded-2xl border border-default bg-background px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        />
    </div>
)

/**
 * Three numeric inputs for the generation params (temperature / top-p / max tokens).
 *
 * Presentational — the parent owns the {@link AiLabParamsForm} state and receives a
 * full patched object on every change.
 * @param props - {@link ParamControlsProps}
 */
export const ParamControls = ({
    params,
    isDisabled = false,
    onChange,
    className,
}: ParamControlsProps) => {
    const t = useTranslations()
    return (
        <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
            <ParamField
                id="ai-lab-temperature"
                label={t("aiLab.playground.temperature")}
                value={params.temperature}
                min={0}
                max={2}
                step={0.1}
                isDisabled={isDisabled}
                onChange={(temperature) => onChange({ ...params, temperature })}
            />
            <ParamField
                id="ai-lab-top-p"
                label={t("aiLab.playground.topP")}
                value={params.topP}
                min={0}
                max={1}
                step={0.05}
                isDisabled={isDisabled}
                onChange={(topP) => onChange({ ...params, topP })}
            />
            <ParamField
                id="ai-lab-max-tokens"
                label={t("aiLab.playground.maxTokens")}
                value={params.maxTokens}
                min={1}
                max={32000}
                step={1}
                isDisabled={isDisabled}
                onChange={(maxTokens) => onChange({ ...params, maxTokens })}
            />
        </div>
    )
}
