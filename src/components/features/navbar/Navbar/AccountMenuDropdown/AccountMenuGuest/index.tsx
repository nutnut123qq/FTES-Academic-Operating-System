"use client"

import React, { useCallback } from "react"
import {
    Dropdown,
    Label,
} from "@heroui/react"
import {
    SignInIcon,
    UserPlusIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AuthenticationModalTab } from "@/redux/slices/tabs"
import { useAppDispatch } from "@/redux/hooks"
import { setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAccountMenuOverlayState, useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AccountMenuGuest}. */
export type AccountMenuGuestProps = WithClassNames<undefined>

/**
 * Account dropdown menu for SIGNED-OUT viewers: sign in + sign up, each opening
 * the authentication modal on its tab. Self-contained — dispatches the auth tab,
 * closes the menu, and opens the overlay; takes no data props.
 *
 * @param props - optional className (placement only).
 */
export const AccountMenuGuest = ({ className }: AccountMenuGuestProps) => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const { close } = useAccountMenuOverlayState()
    const { open: openAuthentication } = useAuthenticationOverlayState()

    /** Open the auth modal on the chosen tab, then close this dropdown. */
    const onAuth = useCallback(
        (tab: AuthenticationModalTab) => {
            dispatch(setAuthenticationModalTab(tab))
            close()
            openAuthentication()
        },
        [dispatch, close, openAuthentication],
    )

    return (
        <Dropdown.Menu className={className}>
            <Dropdown.Section>
                <Dropdown.Item
                    id="sign-in"
                    textValue={t("auth.signIn.submit")}
                    onPress={() => onAuth(AuthenticationModalTab.SignIn)}
                >
                    <SignInIcon className="size-5" />
                    <Label>{t("auth.signIn.submit")}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                    id="sign-up"
                    textValue={t("auth.signUp.submit")}
                    onPress={() => onAuth(AuthenticationModalTab.SignUp)}
                >
                    <UserPlusIcon className="size-5" />
                    <Label>{t("auth.signUp.submit")}</Label>
                </Dropdown.Item>
            </Dropdown.Section>
        </Dropdown.Menu>
    )
}
