"use client"

import React from "react"
import {
    cn,
    Link,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useTranslations,
} from "next-intl"

/** Props for {@link SignUpPrompt}. */
export interface SignUpPromptProps extends WithClassNames<undefined> {
    /** Fired when the user chooses to switch to the sign-up tab. */
    onSwitchToSignUp: () => void
}

/**
 * "No account? Sign up" footer link for the sign-in step.
 *
 * Presentational: forwards the switch-tab intent via `onSwitchToSignUp`.
 * @param props - the switch-to-sign-up callback
 */
export const SignUpPrompt = ({
    onSwitchToSignUp,
    className,
}: SignUpPromptProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex justify-center items-center gap-1.5", className)}>
            <div className="text-xs text-muted">
                {t("auth.signIn.noAccount")}
            </div>
            <Link
                className="text-xs"
                onPress={onSwitchToSignUp}
            >
                {t("auth.signIn.signUp")}
            </Link>
        </div>
    )
}
