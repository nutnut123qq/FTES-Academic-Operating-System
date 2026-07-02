"use client"

import React, { useCallback } from "react"
import {
    Dropdown,
    Header,
    Label,
} from "@heroui/react"
import {
    SignInIcon,
    UserPlusIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { AuthenticationModalTab } from "@/redux/slices/tabs"
import { useAppDispatch } from "@/redux/hooks"
import { setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAccountMenuOverlayState, useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { SessionStorage } from "@/modules/storage/session/storage"
import { SessionStorageId } from "@/modules/storage/session/enums/id"
import { EXPLORE_SHORTCUTS, type ExploreShortcut } from "../explore-shortcuts"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AccountMenuGuest}. */
export type AccountMenuGuestProps = WithClassNames<undefined>

/**
 * Account dropdown menu for SIGNED-OUT viewers: sign in + sign up (each opening
 * the authentication modal on its tab) plus the "Khám phá" (Explore) shortcuts
 * section. Public shortcuts (For You / Trending) navigate straight to the
 * community feed; auth-gated ones (Trợ lý AI / Gợi ý cho bạn) open the
 * AuthenticationModal instead, stashing the destination in `AuthReturnTo` so an
 * OAuth sign-in resumes there. Self-contained; takes no data props.
 *
 * @param props - optional className (placement only).
 */
export const AccountMenuGuest = ({ className }: AccountMenuGuestProps) => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const router = useRouter()
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

    /** Explore shortcut: public → navigate; auth-gated → sign-in modal with resume path. */
    const onExplore = useCallback(
        (shortcut: ExploreShortcut) => {
            close()
            if (!shortcut.authGated) {
                router.push(shortcut.path())
                return
            }
            // remember the destination so the OAuth landing resumes the journey there
            SessionStorage.setItem<string>(SessionStorageId.AuthReturnTo, shortcut.path())
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
            openAuthentication("auth.context.explore")
        },
        [close, router, dispatch, openAuthentication],
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
            {/* "Khám phá" — same shortcuts as the signed-in popup, guest-aware */}
            <Dropdown.Section>
                <Header>{t("profileMenu.explore.title")}</Header>
                {EXPLORE_SHORTCUTS.map((shortcut) => (
                    <Dropdown.Item
                        key={shortcut.id}
                        id={shortcut.id}
                        textValue={t(shortcut.labelKey)}
                        onPress={() => onExplore(shortcut)}
                    >
                        {shortcut.icon}
                        <Label>{t(shortcut.labelKey)}</Label>
                    </Dropdown.Item>
                ))}
            </Dropdown.Section>
        </Dropdown.Menu>
    )
}
