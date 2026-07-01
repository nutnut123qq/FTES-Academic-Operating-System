"use client"

import React from "react"
import {
    cn,
    FieldError,
    Input,
    Label,
    TextField,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useTranslations,
} from "next-intl"

/** Props for {@link EmailField}. */
export interface EmailFieldProps extends WithClassNames<undefined> {
    /** Current email value. */
    value: string
    /** Validation error message, if any. */
    error?: string
    /** Whether the field has been touched (controls error visibility). */
    touched?: boolean
    /** Fired with the new email value on change. */
    onChangeValue: (value: string) => void
    /** Fired when the field loses focus. */
    onBlurField: () => void
}

/**
 * Email input row for the sign-in credentials step.
 *
 * Presentational: renders the labelled email field and forwards change/blur
 * events upward. No business logic.
 * @param props - value, validation state, and change/blur callbacks
 */
export const EmailField = ({
    value,
    error,
    touched,
    onChangeValue,
    onBlurField,
    className,
}: EmailFieldProps) => {
    const t = useTranslations()
    return (
        <TextField variant="secondary" isInvalid={!!(touched && error)} className={cn(className)}>
            <Label htmlFor="sign-in-email" className="text-sm">
                {t("auth.signIn.email.label")}
            </Label>
            <Input
                id="sign-in-email"
                required
                variant="secondary"
                type="email"
                placeholder={t("auth.signIn.email.placeholder")}
                name="email"
                value={value}
                onChange={(event) => onChangeValue(event.target.value)}
                onBlur={onBlurField}
            />
            <FieldError>{error}</FieldError>
        </TextField>
    )
}
