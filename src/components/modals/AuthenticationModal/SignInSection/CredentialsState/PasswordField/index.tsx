"use client"

import { Eye as EyeIcon, EyeSlash as EyeClosedIcon } from "@gravity-ui/icons"
import React, {
    useCallback,
    useState,
} from "react"
import {
    cn,
    FieldError,
    Input,
    Label,
    Link,
    TextField,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useTranslations,
} from "next-intl"

/** Props for {@link PasswordField}. */
export interface PasswordFieldProps extends WithClassNames<undefined> {
    /** Current password value. */
    value: string
    /** Validation error message, if any. */
    error?: string
    /** Whether the field has been touched (controls error visibility). */
    touched?: boolean
    /** Fired with the new password value on change. */
    onChangeValue: (value: string) => void
    /** Fired when the field loses focus. */
    onBlurField: () => void
}

/**
 * Password input row for the sign-in credentials step, with a show/hide
 * toggle and a "forgot password" link.
 *
 * Presentational: owns only the local plaintext-visibility toggle (UI state);
 * value + validation are driven by props. No business logic.
 * @param props - value, validation state, and change/blur callbacks
 */
export const PasswordField = ({
    value,
    error,
    touched,
    onChangeValue,
    onBlurField,
    className,
}: PasswordFieldProps) => {
    const t = useTranslations()

    // local UI-only state: whether the password is shown as plaintext
    const [showPassword, setShowPassword] = useState(false)
    const onToggleVisibility = useCallback(
        () => setShowPassword((shown) => !shown),
        [],
    )

    return (
        <TextField variant="secondary" isInvalid={!!(touched && error)} className={cn(className)}>
            <Label htmlFor="sign-in-password" className="text-sm">
                {t("auth.signIn.password.label")}
            </Label>
            <div className="relative">
                <Link
                    aria-label={showPassword ? t("auth.signIn.password.hide") : t("auth.signIn.password.show")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-md p-1 text-muted outline-none transition-opacity hover:opacity-80"
                    onPress={onToggleVisibility}
                >
                    {showPassword ? (
                        <EyeIcon className="h-5 w-5" />
                    ) : (
                        <EyeClosedIcon className="h-5 w-5" />
                    )}
                </Link>
                <Input
                    id="sign-in-password"
                    required
                    variant="secondary"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.signIn.password.placeholder")}
                    name="password"
                    className="w-full"
                    value={value}
                    onChange={(event) => onChangeValue(event.target.value)}
                    onBlur={onBlurField}
                />
            </div>
            <FieldError>{error}</FieldError>
        </TextField>
    )
}
