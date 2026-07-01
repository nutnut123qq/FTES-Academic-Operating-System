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
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PasswordField}. */
export interface PasswordFieldProps extends WithClassNames<undefined> {
    /** DOM id / `name` for the input (e.g. `sign-up-password`). */
    fieldId: string
    /** Form field name passed to the underlying input. */
    name: string
    /** Label text shown above the input. */
    label: string
    /** Placeholder text shown inside the input. */
    placeholder: string
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
 * Reusable password input row for the sign-up step, used for both the password
 * and confirm-password fields, with an independent show/hide toggle.
 *
 * Presentational: owns only the local plaintext-visibility toggle (UI state);
 * everything else is prop-driven. No business logic.
 * @param props - field identity, label/placeholder, value, validation, callbacks
 */
export const PasswordField = ({
    fieldId,
    name,
    label,
    placeholder,
    value,
    error,
    touched,
    onChangeValue,
    onBlurField,
    className,
}: PasswordFieldProps) => {
    // local UI-only state: whether this field is shown as plaintext
    const [showPassword, setShowPassword] = useState(false)
    const onToggleVisibility = useCallback(
        () => setShowPassword((shown) => !shown),
        [],
    )

    return (
        <TextField variant="secondary" className={cn(className)} isInvalid={!!(touched && error)}>
            <Label htmlFor={fieldId} className="text-sm">
                {label}
            </Label>
            <div className="relative">
                <Link
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
                    id={fieldId}
                    required
                    variant="secondary"
                    type={showPassword ? "text" : "password"}
                    placeholder={placeholder}
                    name={name}
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
