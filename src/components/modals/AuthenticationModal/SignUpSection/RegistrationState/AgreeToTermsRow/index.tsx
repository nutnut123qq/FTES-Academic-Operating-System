"use client"

import React from "react"
import {
    Checkbox,
    cn,
    Label,
    Link,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useTranslations,
} from "next-intl"

/** Props for {@link AgreeToTermsRow}. */
export interface AgreeToTermsRowProps extends WithClassNames<undefined> {
    /** Whether the terms checkbox is checked. */
    isSelected: boolean
    /** Validation error message, if any. */
    error?: string
    /** Whether the field has been touched (controls error visibility). */
    touched?: boolean
    /** Fired with the new checked state. */
    onChangeSelected: (selected: boolean) => void
}

/**
 * Terms-and-privacy agreement checkbox with inline error.
 *
 * Presentational: checked state + validation driven by props; the terms /
 * privacy links are display-only (as in the original). No business logic.
 * @param props - selected state, validation, and the change callback
 */
export const AgreeToTermsRow = ({
    isSelected,
    error,
    touched,
    onChangeSelected,
    className,
}: AgreeToTermsRowProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div className="flex items-start gap-1.5">
                <Checkbox
                    id="sign-up-agree-to-terms"
                    className="w-full"
                    variant="secondary"
                    isSelected={isSelected}
                    onChange={(value) => onChangeSelected(Boolean(value))}
                >
                    <Checkbox.Control>
                        <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content className="w-full">
                        <Label htmlFor="sign-up-agree-to-terms">
                            <div className="text-xs text-muted">
                                <span>{t("auth.signUp.agreeToTerms.prefix")}{" "}</span>
                                <Link className="text-xs underline inline ">
                                    {t("auth.signUp.agreeToTerms.terms")}
                                </Link>{" "}
                                <span>{t("auth.signUp.agreeToTerms.and")}{" "}</span>
                                <Link className="text-xs underline inline ">
                                    {t("auth.signUp.agreeToTerms.privacy")}
                                </Link>{" "}
                                <span>{t("auth.signUp.agreeToTerms.and")}{" "}</span>
                            </div>
                        </Label>
                    </Checkbox.Content>
                </Checkbox>
            </div>
            {touched && error ? (
                <div className="text-xs text-danger mt-1">
                    {error}
                </div>
            ) : null}
        </div>
    )
}
