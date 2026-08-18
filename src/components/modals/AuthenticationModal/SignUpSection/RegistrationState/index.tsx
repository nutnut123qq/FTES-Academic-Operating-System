"use client"

/**
 * Sign-up step: registration form (full name, email, optional username, passwords, terms).
 *
 * Container: owns the sign-up formik (singleton `useSignUpForm()`) and the
 * switch-to-sign-in action; renders presentational field children inside the
 * modal chrome. Modal shell matches {@link SignInSection} `CredentialsState`, including the real
 * `<form>` wrapper that makes Enter submit.
 */
import React, {
    useCallback,
} from "react"
import {
    Button,
    Modal,
    Spinner,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { FederatedAuthButtons } from "../../FederatedAuthButtons"
import { EmailField } from "./EmailField"
import { FullNameField } from "./FullNameField"
import { UsernameField } from "./UsernameField"
import { PasswordField } from "./PasswordField"
import { AgreeToTermsRow } from "./AgreeToTermsRow"
import { SignInPrompt } from "./SignInPrompt"
import { useAppDispatch } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { resetSignUpState } from "@/redux/slices/state"
import { useSignUpForm } from "@/hooks/zustand/signUp/useSignUpForm"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { Turnstile } from "@/components/reuseable/Turnstile"
import { publicEnv } from "@/resources/env/public"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useFederatedLoginComplete } from "@/hooks/auth"

/** Props for {@link RegistrationState}; no own props (singleton-driven). */
export type RegistrationStateProps = WithClassNames<undefined>

/**
 * Registration form container for the sign-up tab.
 */
export const RegistrationState = () => {
    const dispatch = useAppDispatch()
    const t = useTranslations()
    const { close: onAuthenticationClose } = useAuthenticationOverlayState()
    const completeFederatedLogin = useFederatedLoginComplete()
    const {
        values,
        errors,
        touched,
        submitForm,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
        resetForm,
        isValid,
    } = useSignUpForm()

    /**
     * Google signup === Google login (the BE creates on first use): close the modal, then run
     * the shared federated gate so a brand-new account is forced to set a password.
     */
    const onGoogleSuccess = useCallback(() => {
        onAuthenticationClose()
        void completeFederatedLogin()
    }, [onAuthenticationClose, completeFederatedLogin])

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

    const onChangeFullName = useCallback(
        (value: string) => {
            setFieldValue("fullName", value)
        },
        [
            setFieldValue,
        ],
    )
    const onBlurFullName = useCallback(
        () => {
            setFieldTouched("fullName", true)
        },
        [
            setFieldTouched,
        ],
    )

    const onChangeUsername = useCallback(
        (value: string) => {
            setFieldValue("username", value)
        },
        [
            setFieldValue,
        ],
    )
    const onBlurUsername = useCallback(
        () => {
            setFieldTouched("username", true)
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

    const onChangeConfirmPassword = useCallback(
        (value: string) => {
            setFieldValue("confirmPassword", value)
        },
        [
            setFieldValue,
        ],
    )
    const onBlurConfirmPassword = useCallback(
        () => {
            setFieldTouched("confirmPassword", true)
        },
        [
            setFieldTouched,
        ],
    )

    const onChangeAgreeToTerms = useCallback(
        (selected: boolean) => {
            // third arg true: run validation so `errors.agreeToTerms` clears when checked
            setFieldValue("agreeToTerms", selected, true)
            setFieldTouched("agreeToTerms", true, false)
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
     * already submits the form through this handler. Keeping `onPress` as well would call the
     * register endpoint TWICE per click. Same pattern as the `OtpVerifyForm` / `ForgotPasswordForm`
     * pages.
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

    /** Reset the form + sign-up state, then switch to the sign-in tab. */
    const onSwitchToSignIn = useCallback(
        () => {
            resetForm()
            dispatch(resetSignUpState())
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
        },
        [
            resetForm,
            dispatch,
        ],
    )

    // pending mock auth also disables the submit — no double submit (spec: modal quality)
    const isSubmitDisabled = !isValid || (publicEnv().captcha.enabled && !values.captchaToken) || isSubmitting

    return (
        <>
            <Modal.CloseTrigger />
            <Modal.Header>
                <div className="text-center">
                    <div className="font-semibold text-lg">{t("auth.signUp.title")}</div>
                    <div className="text-xs text-muted">{t("auth.signUp.desc")}</div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <FederatedAuthButtons onGoogleSuccess={onGoogleSuccess} />

                {/* Real <form> so Enter inside a field submits (mirrors the sign-in tab). */}
                <form onSubmit={onSubmit} noValidate>
                    <FullNameField
                        value={values.fullName}
                        error={errors.fullName}
                        touched={touched.fullName}
                        onChangeValue={onChangeFullName}
                        onBlurField={onBlurFullName}
                    />
                    <div className="h-3" />
                    <EmailField
                        value={values.email}
                        error={errors.email}
                        touched={touched.email}
                        onChangeValue={onChangeEmail}
                        onBlurField={onBlurEmail}
                    />
                    <div className="h-3" />
                    <UsernameField
                        value={values.username}
                        error={errors.username}
                        touched={touched.username}
                        onChangeValue={onChangeUsername}
                        onBlurField={onBlurUsername}
                    />
                    <div className="h-3" />
                    <PasswordField
                        fieldId="sign-up-password"
                        name="password"
                        label={t("auth.signUp.password.label")}
                        placeholder={t("auth.signUp.password.placeholder")}
                        showToggleLabel={t("auth.signUp.password.show")}
                        hideToggleLabel={t("auth.signUp.password.hide")}
                        value={values.password}
                        error={errors.password}
                        touched={touched.password}
                        onChangeValue={onChangePassword}
                        onBlurField={onBlurPassword}
                    />
                    <div className="h-3" />
                    <PasswordField
                        fieldId="sign-up-confirm-password"
                        name="confirmPassword"
                        label={t("auth.signUp.confirmPassword.label")}
                        placeholder={t("auth.signUp.confirmPassword.placeholder")}
                        showToggleLabel={t("auth.signUp.confirmPassword.show")}
                        hideToggleLabel={t("auth.signUp.confirmPassword.hide")}
                        value={values.confirmPassword}
                        error={errors.confirmPassword}
                        touched={touched.confirmPassword}
                        onChangeValue={onChangeConfirmPassword}
                        onBlurField={onBlurConfirmPassword}
                    />
                    <div className="h-3" />
                    <AgreeToTermsRow
                        isSelected={values.agreeToTerms}
                        error={errors.agreeToTerms}
                        touched={touched.agreeToTerms}
                        onChangeSelected={onChangeAgreeToTerms}
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
                        isDisabled={isSubmitDisabled}
                        isPending={isSubmitting}
                    >
                        {({ isPending }) => (
                            <>
                                {isPending ? <Spinner color="current" size="sm" /> : null}
                                {t("auth.signUp.submit")}
                            </>
                        )}
                    </Button>
                </form>
                <div className="h-3" />
                <SignInPrompt onSwitchToSignIn={onSwitchToSignIn} />
            </Modal.Body>
        </>
    )
}
