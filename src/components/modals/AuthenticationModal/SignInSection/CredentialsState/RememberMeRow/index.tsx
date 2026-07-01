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

/** Props for {@link RememberMeRow}. */
export interface RememberMeRowProps extends WithClassNames<undefined> {
    /** Whether the "remember me" box is checked. */
    isSelected: boolean
    /** Fired with the new checked state. */
    onChangeSelected: (selected: boolean) => void
}

/**
 * "Remember me" checkbox paired with the "forgot password" link.
 *
 * Presentational: checked state is driven by props; the forgot-password link
 * is display-only (no handler in the original). No business logic.
 * @param props - selected state and the change callback
 */
export const RememberMeRow = ({
    isSelected,
    onChangeSelected,
    className,
}: RememberMeRowProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex justify-between", className)}>
            <Checkbox
                id="sign-in-remember-me"
                variant="secondary"
                isSelected={isSelected}
                onChange={(value) => onChangeSelected(Boolean(value))}
            >
                <Checkbox.Control>
                    <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content className="w-full">
                    <Label htmlFor="sign-in-remember-me">
                        <div className="text-xs text-muted">
                            <span>{t("auth.signIn.rememberMe")}{" "}</span>
                        </div>
                    </Label>
                </Checkbox.Content>
            </Checkbox>
            <Link className="text-xs cursor-pointer hover:opacity-80">
                {t("auth.signIn.forgotPassword")}
            </Link>
        </div>
    )
}
