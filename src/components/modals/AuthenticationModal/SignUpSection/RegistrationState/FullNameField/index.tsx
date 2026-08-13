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

/** Props for {@link FullNameField}. */
export interface FullNameFieldProps extends WithClassNames<undefined> {
    /** Current full name value. */
    value: string
    /** Validation error message, if any. */
    error?: string
    /** Whether the field has been touched (controls error visibility). */
    touched?: boolean
    /** Fired with the new full name value on change. */
    onChangeValue: (value: string) => void
    /** Fired when the field loses focus. */
    onBlurField: () => void
}

/**
 * Full name input row for the sign-up registration step.
 *
 * Presentational: value + validation driven by props, forwards change/blur
 * events upward. No business logic. Unlike the `UsernameField` row the field is
 * REQUIRED (an FE-side rule — the backend takes `fullName` as optional): it
 * seeds the profile `displayName`, which has no other entry point at sign-up.
 * @param props - value, validation state, and change/blur callbacks
 */
export const FullNameField = ({
    value,
    error,
    touched,
    onChangeValue,
    onBlurField,
    className,
}: FullNameFieldProps) => {
    const t = useTranslations()
    return (
        <TextField variant="secondary" isInvalid={!!(touched && error)} className={cn(className)}>
            <Label htmlFor="sign-up-full-name" className="text-sm">
                {t("auth.signUp.fullName.label")}
            </Label>
            <Input
                id="sign-up-full-name"
                variant="secondary"
                type="text"
                autoComplete="name"
                placeholder={t("auth.signUp.fullName.placeholder")}
                name="fullName"
                value={value}
                onChange={(event) => onChangeValue(event.target.value)}
                onBlur={onBlurField}
            />
            <FieldError>{error}</FieldError>
        </TextField>
    )
}
