"use client"

import React from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Typography,
    cn,
} from "@heroui/react"
import { CaretDownIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { AiModelCatalog } from "@/modules/api/rest/ai"

/** Props for {@link AiModelPicker}. */
export interface AiModelPickerProps {
    /** Model catalog from `GET /api/v1/ai/models` (undefined while loading). */
    catalog: AiModelCatalog | undefined
    /** Selected model id; `null` = BE default (`defaults.chat`). */
    value: string | null
    /** Fires with the picked model id (`null` when the default entry is picked). */
    onChange: (modelId: string | null) => void
    /** Disables the trigger (e.g. while a grade is in flight). */
    isDisabled?: boolean
    /** Extra classes on the trigger. */
    className?: string
}

/**
 * Reusable AI model dropdown fed by the ftes-ai-service catalog
 * (`data.models[] {id,label}` + `data.defaults.chat`). The first entry is the
 * BE default (sends no `model` field); every model grades/answers differently,
 * so surfaces must show the model actually used from the response.
 */
export const AiModelPicker = ({
    catalog,
    value,
    onChange,
    isDisabled,
    className,
}: AiModelPickerProps) => {
    const t = useTranslations("learn")
    const models = catalog?.models ?? []
    const defaultId = catalog?.defaults?.chat
    const labelOf = (id: string | undefined): string => {
        if (!id) return t("codeGrading.defaultModel")
        return models.find((model) => model.id === id)?.label ?? id
    }
    const activeLabel = value
        ? labelOf(value)
        : defaultId
            ? t("codeGrading.defaultModelWith", { model: labelOf(defaultId) })
            : t("codeGrading.defaultModel")

    return (
        <Dropdown>
            <DropdownTrigger
                isDisabled={isDisabled || models.length === 0}
                className={cn(
                    "cursor-pointer rounded-2xl border border-default px-3 py-2",
                    className,
                )}
            >
                <div className="flex items-center gap-2">
                    <SparkleIcon aria-hidden focusable="false" className="size-4 text-accent" />
                    <span className="max-w-56 truncate text-sm font-medium">{activeLabel}</span>
                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                </div>
            </DropdownTrigger>
            <DropdownPopover className="min-w-64">
                <DropdownMenu aria-label={t("codeGrading.pickModel")}>
                    <DropdownItem
                        key="__default"
                        textValue={t("codeGrading.defaultModel")}
                        onPress={() => onChange(null)}
                    >
                        <div className="flex flex-col">
                            <span>{t("codeGrading.defaultModel")}</span>
                            {defaultId ? (
                                <Typography type="body-xs" color="muted">
                                    {labelOf(defaultId)}
                                </Typography>
                            ) : null}
                        </div>
                    </DropdownItem>
                    {models.map((model) => (
                        <DropdownItem
                            key={model.id}
                            textValue={model.label ?? model.id}
                            onPress={() => onChange(model.id)}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span>{model.label ?? model.id}</span>
                                {model.pricing_hint ? (
                                    <Typography type="body-xs" color="muted">
                                        {model.pricing_hint}
                                    </Typography>
                                ) : null}
                            </div>
                        </DropdownItem>
                    ))}
                </DropdownMenu>
            </DropdownPopover>
        </Dropdown>
    )
}
