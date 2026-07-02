"use client"

/**
 * Sign-up step: registration form (email, passwords, terms).
 *
 * Container: owns the sign-up formik (singleton `useSignUpForm()`) and the
 * switch-to-sign-in action; renders presentational field children inside the
 * modal chrome. Modal shell matches {@link SignInSection} `CredentialsState`.
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
import { EmailField } from "./EmailField"
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

/** Props for {@link RegistrationState}; no own props (singleton-driven). */
export type RegistrationStateProps = WithClassNames<undefined>

/**
 * Registration form container for the sign-up tab.
 */
export const RegistrationState = () => {
    const dispatch = useAppDispatch()
    const t = useTranslations()
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

    const onSubmit = useCallback(
        () => {
            submitForm()
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
                <EmailField
                    value={values.email}
                    error={errors.email}
                    touched={touched.email}
                    onChangeValue={onChangeEmail}
                    onBlurField={onBlurEmail}
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
                    onPress={onSubmit}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? <Spinner color="current" size="sm" /> : null}
                            {t("auth.signUp.submit")}
                        </>
                    )}
                </Button>
                <div className="h-3" />
                <SignInPrompt onSwitchToSignIn={onSwitchToSignIn} />
            </Modal.Body>
        </>
    )
}
