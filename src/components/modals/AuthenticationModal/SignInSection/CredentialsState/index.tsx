"use client"

/**
 * **Sign-in step 1** — OAuth shortcuts, identifier (email OR username) + password, link to the
 * sign-up tab.
 *
 * Container: owns the sign-in formik (singleton `useSignInForm()`), the
 * router/dispatch wiring, and the OAuth redirect action; renders presentational
 * children inside the modal chrome (`Modal.CloseTrigger`, `Header`, `Body`). The credential fields
 * live in a real `<form>` (Enter submits); the OAuth button sits outside it on purpose.
 *
 * @see {@link SignInSection} for Redux step routing and folder conventions.
 */
import React, {
    useCallback,
    useEffect,
} from "react"
import {
    Button,
    Modal,
    Separator,
    Spinner,
} from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { GoogleSignInButton } from "./GoogleSignInButton"
import { EmailField } from "./EmailField"
import { PasswordField } from "./PasswordField"
import { RememberMeRow } from "./RememberMeRow"
import { SignUpPrompt } from "./SignUpPrompt"
import { useAppDispatch } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useSignInForm } from "@/hooks/zustand/signIn/useSignInForm"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Turnstile } from "@/components/reuseable/Turnstile"
import { publicEnv } from "@/resources/env/public"
import { pathConfig } from "@/resources/path"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"

/** Props for {@link CredentialsState}; no own props (singleton-driven). */
export type CredentialsStateProps = WithClassNames<undefined>

/**
 * Credentials step container for the sign-in tab.
 */
export const CredentialsState = () => {
    const t = useTranslations()
    const {
        values,
        errors,
        touched,
        submitForm,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
    } = useSignInForm()

    const router = useRouter()
    const dispatch = useAppDispatch()
    const locale = useLocale()
    const { close: onAuthenticationClose } = useAuthenticationOverlayState()

    // pre-check remember-me from the stored preference (spec auth-session-preferences)
    useEffect(() => {
        const stored = LocalStorage.getItem<boolean>(LocalStorageId.AuthRememberMe)
        if (stored !== undefined) {
            setFieldValue("rememberMe", stored)
        }
    }, [setFieldValue])

    const onChangeEmail = useCallback(
        (value: string) => {
            setFieldValue("email", value)
        },
        [
            setFieldValue,
        ],
    )
    const onBlurEmail = useCallback(
        () => {
            setFieldTouched("email", true)
        },
        [
            setFieldTouched,
        ],
    )

    const onChangePassword = useCallback(
        (value: string) => {
            setFieldValue("password", value)
        },
        [
            setFieldValue,
        ],
    )
    const onBlurPassword = useCallback(
        () => {
            setFieldTouched("password", true)
        },
        [
            setFieldTouched,
        ],
    )

    const onChangeRememberMe = useCallback(
        (selected: boolean) => {
            // third arg true: run validation so dependent errors clear
            setFieldValue("rememberMe", selected, true)
            setFieldTouched("rememberMe", true, false)
        },
        [
            setFieldValue,
            setFieldTouched,
        ],
    )

    /**
     * Native form submit — also fires when the user presses Enter inside any field.
     *
     * The submit Button deliberately carries NO `onPress`: HeroUI's `Button` spreads `type` into
     * `react-aria`'s `useButton`, which puts `type="submit"` on the real DOM `<button>`, so a click
     * already submits the form through this handler. Keeping `onPress` as well would call the login
     * endpoint TWICE per click. Same pattern as the `OtpVerifyForm` / `ForgotPasswordForm` pages.
     */
    const onSubmit = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault()
            void submitForm()
        },
        [
            submitForm,
        ],
    )

    const onSwitchToSignUp = useCallback(
        () => {
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignUp))
        },
        [
            dispatch,
        ],
    )

    /** Close the modal and go to the full-page forgot-password flow. */
    const onForgotPassword = useCallback(
        () => {
            onAuthenticationClose()
            router.push(pathConfig().locale(locale).authentication().forgotPassword().build())
        },
        [
            onAuthenticationClose,
            router,
            locale,
        ],
    )

    // pending mock auth also disables the submit — no double submit (spec: modal quality)
    const isSubmitDisabled = (publicEnv().captcha.enabled && !values.captchaToken) || isSubmitting

    return (
        <>
            <Modal.CloseTrigger />
            <Modal.Header>
                <div className="text-center">
                    <div className="font-semibold text-lg">{t("auth.signIn.title")}</div>
                    <div className="text-xs text-muted">{t("auth.signIn.desc")}</div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <GoogleSignInButton onSuccess={onAuthenticationClose} />

                <div className="h-3" />
                <div className="flex items-center justify-center">
                    <Separator className="flex-1" />
                    <div className="text-xs text-muted">{t("auth.signIn.or")}</div>
                    <Separator className="flex-1" />
                </div>

                {/*
                  * Real <form> so Enter inside a field submits (the Google button stays OUTSIDE it,
                  * otherwise pressing it would submit the credentials form too).
                  */}
                <form onSubmit={onSubmit} noValidate>
                    <div className="h-3" />
                    <EmailField
                        value={values.email}
                        error={errors.email}
                        touched={touched.email}
                        onChangeValue={onChangeEmail}
                        onBlurField={onBlurEmail}
                    />

                    <div className="h-3" />
                    <PasswordField
                        value={values.password}
                        error={errors.password}
                        touched={touched.password}
                        onChangeValue={onChangePassword}
                        onBlurField={onBlurPassword}
                    />

                    <div className="h-3" />
                    <RememberMeRow
                        isSelected={values.rememberMe}
                        onChangeSelected={onChangeRememberMe}
                        onForgotPassword={onForgotPassword}
                    />

                    {publicEnv().captcha.enabled && (
                        <Turnstile
                            onVerify={(token) => setFieldValue("captchaToken", token)}
                            onExpire={() => setFieldValue("captchaToken", undefined)}
                            onError={() => setFieldValue("captchaToken", undefined)}
                        />
                    )}

                    <div className="h-3" />
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isPending={isSubmitting}
                        isDisabled={isSubmitDisabled}
                    >
                        {({ isPending }) => (
                            <>
                                {isPending ? <Spinner color="current" size="sm" /> : null}
                                {t("auth.signIn.submit")}
                            </>
                        )}
                    </Button>
                </form>

                <div className="h-3" />
                <SignUpPrompt onSwitchToSignUp={onSwitchToSignUp} />
            </Modal.Body>
        </>
    )
}
