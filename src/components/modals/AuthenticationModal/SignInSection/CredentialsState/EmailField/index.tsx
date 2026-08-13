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
    /** Current identifier value (email OR username). */
    value: string
    /** Validation error message, if any. */
    error?: string
    /** Whether the field has been touched (controls error visibility). */
    touched?: boolean
    /** Fired with the new identifier value on change. */
    onChangeValue: (value: string) => void
    /** Fired when the field loses focus. */
    onBlurField: () => void
}

/**
 * Login identifier input row for the sign-in credentials step — accepts an EMAIL **or** a USERNAME
 * (the backend resolves either via `findByUsernameOrEmailIgnoreCase`).
 *
 * Presentational: renders the labelled field and forwards change/blur events upward. No business
 * logic. `type="text"` + `autoComplete="username"` on purpose: `type="email"` made the browser
 * reject a plain username, which was the only thing blocking username login on the FE. The
 * component/props keep the `Email…` name to match the `email` field of the sign-in store; only the
 * user-facing label/placeholder moved to the `auth.signIn.identifier.*` keys.
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
                {t("auth.signIn.identifier.label")}
            </Label>
            <Input
                id="sign-in-email"
                variant="secondary"
                type="text"
                autoComplete="username"
                placeholder={t("auth.signIn.identifier.placeholder")}
                name="email"
                value={value}
                onChange={(event) => onChangeValue(event.target.value)}
                onBlur={onBlurField}
            />
            <FieldError>{error}</FieldError>
        </TextField>
    )
}
