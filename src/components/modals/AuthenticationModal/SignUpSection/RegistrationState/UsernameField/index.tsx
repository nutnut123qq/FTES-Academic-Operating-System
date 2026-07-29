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

/** Props for {@link UsernameField}. */
export interface UsernameFieldProps extends WithClassNames<undefined> {
    /** Current username value. */
    value: string
    /** Validation error message, if any. */
    error?: string
    /** Whether the field has been touched (controls error visibility). */
    touched?: boolean
    /** Fired with the new username value on change. */
    onChangeValue: (value: string) => void
    /** Fired when the field loses focus. */
    onBlurField: () => void
}

/**
 * Optional username input row for the sign-up registration step.
 *
 * Presentational: value + validation driven by props, forwards change/blur
 * events upward. No business logic. The field is OPTIONAL — a helper line tells
 * the user that leaving it blank lets the backend derive a username from the
 * email local-part (`abc@gmail.com → abc`).
 * @param props - value, validation state, and change/blur callbacks
 */
export const UsernameField = ({
    value,
    error,
    touched,
    onChangeValue,
    onBlurField,
    className,
}: UsernameFieldProps) => {
    const t = useTranslations()
    return (
        <TextField variant="secondary" isInvalid={!!(touched && error)} className={cn(className)}>
            <Label htmlFor="sign-up-username" className="text-sm">
                {t("auth.signUp.username.label")}
            </Label>
            <Input
                id="sign-up-username"
                variant="secondary"
                type="text"
                autoComplete="username"
                placeholder={t("auth.signUp.username.placeholder")}
                name="username"
                value={value}
                aria-describedby="sign-up-username-helper"
                onChange={(event) => onChangeValue(event.target.value)}
                onBlur={onBlurField}
            />
            <div id="sign-up-username-helper" className="text-xs text-muted">
                {t("auth.signUp.username.helper")}
            </div>
            <FieldError>{error}</FieldError>
        </TextField>
    )
}
