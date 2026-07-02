"use client"

import React, { useEffect } from "react"
import { SignInSection } from "./SignInSection"
import { SignUpSection } from "./SignUpSection"
import { cn, Modal } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { AuthenticationModalTab } from "@/redux/slices/tabs"
import { resetSignInState, resetSignUpState } from "@/redux/slices/state"
import { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AuthenticationModal}. */
type AuthenticationModalProps = WithClassNames<undefined>

/**
 * The single sign-in / sign-up surface of the app (popup-only auth — spec
 * `auth-popup-entry`). Every entry point (account menu, guest-gated actions via
 * `useRequireAuth`, `?auth=` deep links) opens THIS modal; there is no full-page
 * login/sign-up route.
 *
 * Focus trap, ESC close, backdrop close and focus restore come from the HeroUI
 * `Modal` (react-aria) baseline — nothing here disables them. Below the `sm`
 * breakpoint the dialog renders as a full-width bottom sheet (container `p-0`,
 * dialog uncapped width + scrollable body). When a guarded action stashed a
 * context message key, it renders above the active section and is cleared —
 * together with both flow states — whenever the modal closes.
 */
export const AuthenticationModal = ({ className }: AuthenticationModalProps = {}) => {
    const t = useTranslations()
    const { isOpen, setOpen, context, setContext } = useAuthenticationOverlayState()
    const dispatch = useAppDispatch()
    const authenticationModalTab = useAppSelector((state) => state.tabs.authenticationModalTab)

    useEffect(() => {
        if (!isOpen) {
            dispatch(resetSignInState())
            dispatch(resetSignUpState())
            // stale context must never leak into the next open (e.g. account menu)
            setContext(null)
        }
    }, [dispatch, isOpen, setContext])
    const renderSection = () => {
        switch (authenticationModalTab) {
        case AuthenticationModalTab.SignIn:
            return <SignInSection />
        case AuthenticationModalTab.SignUp:
            return <SignUpSection />
        }
    }
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={setOpen}
        >
            <Modal.Backdrop>
                {/* <sm: drop the container gutter so the sheet spans the full viewport width */}
                <Modal.Container size="xs" className="max-sm:p-0!">
                    <Modal.Dialog
                        aria-label={
                            authenticationModalTab === AuthenticationModalTab.SignUp
                                ? t("auth.signUp.title")
                                : t("auth.signIn.title")
                        }
                        className={cn(
                            // <sm: full-width bottom sheet — uncap the xs width, square the
                            // bottom corners, keep content scrollable inside the viewport
                            "max-sm:max-w-none! max-sm:rounded-b-none! max-sm:max-h-[92dvh] max-sm:overflow-y-auto",
                            className,
                        )}
                    >
                        {context ? (
                            <div
                                role="status"
                                className="mb-3 rounded-xl bg-accent/10 p-3 text-center text-sm text-accent"
                            >
                                {t(context)}
                            </div>
                        ) : null}
                        {renderSection()}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
