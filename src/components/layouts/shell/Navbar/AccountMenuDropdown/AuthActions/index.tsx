"use client"

import React, { useCallback, useMemo } from "react"
import {
    Button,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { AuthenticationModalTab } from "@/redux/slices/tabs"
import type { AccountActionItem } from "../types"
import { useAppDispatch } from "@/redux/hooks"
import { setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAccountMenuOverlayState, useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link AuthActions}.
 */
export type AuthActionsProps = WithClassNames<undefined>

/**
 * Row of authentication call-to-action buttons shown to signed-out users.
 *
 * Container: derives its action items from translations itself, dispatches
 * the auth-tab action, and opens the authentication overlay directly.
 * `"use client"` for hooks + press handlers.
 * @param props - optional root class name
 */
export const AuthActions = ({ className }: AuthActionsProps) => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const { close } = useAccountMenuOverlayState()
    const { open: openAuthentication } = useAuthenticationOverlayState()

    const items = useMemo<Array<AccountActionItem>>(
        () => [
            {
                key: "sign-in",
                label: t("auth.signIn.submit"),
                variant: "primary",
                tab: AuthenticationModalTab.SignIn,
            },
            {
                key: "sign-up",
                label: t("auth.signUp.submit"),
                variant: "tertiary",
                tab: AuthenticationModalTab.SignUp,
            },
        ],
        [t],
    )

    /** Open the auth modal on the chosen tab and close this dropdown. */
    const onSelectAction = useCallback(
        (item: AccountActionItem) => {
            dispatch(setAuthenticationModalTab(item.tab))
            close()
            openAuthentication()
        },
        [dispatch, close, openAuthentication],
    )

    return (
        <div className={cn("flex items-center gap-3", className)}>
            {items.map((item) => (
                <Button
                    key={item.key}
                    variant={item.variant}
                    onPress={() => onSelectAction(item)}
                >
                    {item.label}
                </Button>
            ))}
        </div>
    )
}
