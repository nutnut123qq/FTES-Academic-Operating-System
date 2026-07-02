"use client"

import React from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    FieldError,
    Input,
    Label,
    Switch,
    TextField,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { CaretDownIcon } from "@phosphor-icons/react"
import type { SettingField } from "@/resources/constants/config"

/** A field's draft value: text/number/select drafts are strings, toggles booleans. */
export type SettingDraftValue = string | boolean

/** Props for {@link SettingFieldControl}. */
export interface SettingFieldControlProps {
    /** The setting this control edits. */
    field: SettingField
    /** Current draft value. */
    value: SettingDraftValue
    /** Validation error message (already translated), if any. */
    error?: string
    /** Fired with the new draft value. */
    onChange: (value: SettingDraftValue) => void
    /** Disables the control while a save is in flight. */
    isDisabled: boolean
}

/**
 * SettingFieldControl — maps a {@link SettingField} type to its HeroUI control:
 * `text`/`number` → labelled Input (+ FieldError), `select` → labelled Dropdown,
 * `toggle` → labelled Switch row. Presentation of ONE field; the form owns the
 * draft, validation and save.
 */
export const SettingFieldControl = ({
    field,
    value,
    error,
    onChange,
    isDisabled,
}: SettingFieldControlProps) => {
    const t = useTranslations()
    const inputId = `config-field-${field.key.replace(/\./g, "-")}`
    const label = t(field.labelKey)
    const help = field.helpKey ? t(field.helpKey) : undefined

    if (field.type === "toggle") {
        return (
            <div className="flex items-center justify-between gap-3 rounded-large border border-separator p-4">
                <div className="flex flex-col gap-0">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    {help ? <span className="text-xs text-muted">{help}</span> : null}
                </div>
                <Switch
                    isSelected={value === true}
                    isDisabled={isDisabled}
                    onChange={(next) => onChange(next)}
                    aria-label={label}
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
            </div>
        )
    }

    if (field.type === "select") {
        const options = field.options ?? []
        const current = options.find((option) => option.value === value)
        return (
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground" id={`${inputId}-label`}>
                    {label}
                </span>
                <Dropdown>
                    <DropdownTrigger
                        aria-labelledby={`${inputId}-label`}
                        isDisabled={isDisabled}
                        className="w-full cursor-pointer rounded-large border border-separator px-3 py-2 sm:max-w-sm"
                    >
                        <div className="flex w-full items-center justify-between gap-2 text-sm">
                            {current ? t(current.labelKey) : String(value)}
                            <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                        </div>
                    </DropdownTrigger>
                    <DropdownPopover className="min-w-56">
                        <DropdownMenu aria-label={label}>
                            {options.map((option) => (
                                <DropdownItem
                                    key={option.value}
                                    textValue={t(option.labelKey)}
                                    onPress={() => onChange(option.value)}
                                >
                                    {t(option.labelKey)}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </DropdownPopover>
                </Dropdown>
                {help ? <span className="text-xs text-muted">{help}</span> : null}
            </div>
        )
    }

    // text / number
    return (
        <TextField
            variant="secondary"
            isInvalid={!!error}
            className="flex flex-col gap-2 sm:max-w-sm"
        >
            <Label htmlFor={inputId} className="text-sm">
                {label}
            </Label>
            <Input
                id={inputId}
                variant="secondary"
                type={field.type === "number" ? "number" : "text"}
                min={field.validation?.min}
                max={field.validation?.max}
                value={String(value)}
                disabled={isDisabled}
                onChange={(event) => onChange(event.target.value)}
            />
            {help ? <span className="text-xs text-muted">{help}</span> : null}
            <FieldError>{error}</FieldError>
        </TextField>
    )
}
