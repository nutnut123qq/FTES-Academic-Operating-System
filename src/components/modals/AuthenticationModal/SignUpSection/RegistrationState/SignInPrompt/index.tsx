"use client"

import React from "react"
import {
    cn,
    Link,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SignInPrompt}. */
export interface SignInPromptProps extends WithClassNames<undefined> {
    /** Fired when the user chooses to switch back to the sign-in tab. */
    onSwitchToSignIn: () => void
}

/**
 * "Already have an account? Sign in" footer link for the sign-up step.
 *
 * Presentational: forwards the switch-tab intent via `onSwitchToSignIn`.
 * @param props - the switch-to-sign-in callback
 */
export const SignInPrompt = ({
    onSwitchToSignIn,
    className,
}: SignInPromptProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex justify-center items-center gap-1.5", className)}>
            <div className="text-xs text-muted">
                {t("auth.signUp.haveAccount")}
            </div>
            <Link
                className="text-xs"
                onPress={onSwitchToSignIn}
            >
                {t("auth.signUp.signIn")}
            </Link>
        </div>
    )
}
