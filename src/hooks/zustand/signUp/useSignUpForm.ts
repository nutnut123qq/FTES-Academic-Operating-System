"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import validator from "validator"
import { useSignUpStore } from "./store"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { usePostRegisterSwr } from "@/hooks/swr/api/rest/mutations/usePostRegisterSwr"
import { usePostVerifyRegistrationSwr } from "@/hooks/swr/api/rest/mutations/usePostVerifyRegistrationSwr"
import { RestError } from "@/modules/api/rest/client"
import { useRestWithToast } from "@/modules/toast/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { resetSignUpState, setSignUpState, SignUpState } from "@/redux/slices/state"

/**
 * Returns `true` when a registration failure means "this email already has an ACTIVE account"
 * (`409 IDENTITY_EMAIL_TAKEN`) — surfaced INLINE on the email field instead of a toast.
 */
const isEmailTakenError = (error: unknown): boolean =>
    error instanceof RestError &&
    (error.errorCode === "IDENTITY_EMAIL_TAKEN" || error.status === 409)

/**
 * Sign-up form hook (replaces the formik singleton) — state SHARED via {@link useSignUpStore} so it
 * survives the Registration→OTP step transition. Returns a formik-compatible shape. The current step
 * comes from redux `state.signUpState`.
 *
 * Sign-up is REST (`POST /api/v1/auth/register` → `POST /api/v1/auth/register/verify`): the backend
 * exposes no GraphQL auth mutations, so the old `signUpInit`/`signUpVerifyOtp` GraphQL flow (and its
 * `challengeId`) is gone. Step 1 creates a `PENDING_VERIFICATION` account and emails a 6-digit OTP;
 * an existing ACTIVE email fails with `409 IDENTITY_EMAIL_TAKEN`, mapped to the inline
 * `auth.signUp.email.alreadyExists` error (the old debounced GraphQL `checkEmailExists` bloom-filter
 * probe was GraphQL-only and has been removed — the 409 is now the source of truth). Step 2 verifies
 * the OTP; on success the backend returns a token pair IDENTICAL to `POST /auth/login`, which
 * {@link usePostVerifyRegistrationSwr} persists (LocalStorage + redux) — the user is signed in
 * immediately, so we just close the modal. "Resend OTP" = calling `register` again with the same
 * email (idempotent resend on the backend, 60s cooldown).
 */
export const useSignUpForm = () => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const dispatch = useAppDispatch()
    const signUpState = useAppSelector((state) => state.state.signUpState)
    const { trigger: mutateRegister } = usePostRegisterSwr()
    const { trigger: mutateVerifyRegistration } = usePostVerifyRegistrationSwr()
    const { close: onAuthenticationClose } = useAuthenticationOverlayState()

    const email = useSignUpStore((state) => state.email)
    const emailExists = useSignUpStore((state) => state.emailExists)
    const password = useSignUpStore((state) => state.password)
    const confirmPassword = useSignUpStore((state) => state.confirmPassword)
    const agreeToTerms = useSignUpStore((state) => state.agreeToTerms)
    const otp = useSignUpStore((state) => state.otp)
    const challengeId = useSignUpStore((state) => state.challengeId)
    const captchaToken = useSignUpStore((state) => state.captchaToken)
    const touched = useSignUpStore((state) => state.touched)
    const isSubmitting = useSignUpStore((state) => state.isSubmitting)
    const setValue = useSignUpStore((state) => state.setValue)
    const setTouchedStore = useSignUpStore((state) => state.setTouched)
    const setIsSubmitting = useSignUpStore((state) => state.setIsSubmitting)
    const reset = useSignUpStore((state) => state.reset)

    const values = useMemo(
        () => ({ state: signUpState, email, emailExists, password, confirmPassword, agreeToTerms, challengeId, captchaToken, otp }),
        [signUpState, email, emailExists, password, confirmPassword, agreeToTerms, challengeId, captchaToken, otp],
    )

    const errors = useMemo(() => {
        const result: { email?: string, password?: string, confirmPassword?: string, agreeToTerms?: string, otp?: string } = {}
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            result.email = t("auth.signUp.email.required")
        } else if (!validator.isEmail(trimmedEmail)) {
            result.email = t("auth.signUp.email.invalid")
        } else if (emailExists) {
            result.email = t("auth.signUp.email.alreadyExists")
        }
        if (signUpState === SignUpState.Registration) {
            if (!password) {
                result.password = t("auth.signUp.password.required")
            } else if (password.length < 8) {
                result.password = t("auth.signUp.password.minLength")
            }
            if (!confirmPassword) {
                result.confirmPassword = t("auth.signUp.confirmPassword.required")
            } else if (confirmPassword !== password) {
                result.confirmPassword = t("auth.signUp.confirmPassword.mismatch")
            }
            if (!agreeToTerms) {
                result.agreeToTerms = t("auth.signUp.agreeToTerms.required")
            }
        }
        if (signUpState === SignUpState.Otp) {
            if (!otp) {
                result.otp = t("auth.signUp.otp.required")
            } else if (!/^\d{6}$/.test(otp)) {
                result.otp = t("auth.signUp.otp.invalid")
            }
        }
        return result
    }, [email, emailExists, password, confirmPassword, agreeToTerms, otp, signUpState, t])

    const setFieldValue = useCallback(
        (field: string, value: string | boolean | undefined, shouldValidate?: boolean) => {
            void shouldValidate
            setValue(field as Parameters<typeof setValue>[0], value)
        },
        [setValue],
    )
    const setFieldTouched = useCallback(
        (field: string, value = true, shouldValidate?: boolean) => {
            void shouldValidate
            if (field === "email" || field === "password" || field === "confirmPassword" || field === "agreeToTerms" || field === "otp") {
                setTouchedStore(field, value)
            }
        },
        [setTouchedStore],
    )

    const submitForm = useCallback(async () => {
        setIsSubmitting(true)
        try {
            if (signUpState === SignUpState.Registration) {
                try {
                    await mutateRegister({ email: email.trim(), password })
                } catch (error) {
                    // 409 IDENTITY_EMAIL_TAKEN → inline Vietnamese error on the email field
                    // ("Email này đã được đăng ký"), NOT a toast — the user can fix it in place.
                    if (isEmailTakenError(error)) {
                        setValue("emailExists", true)
                        setTouchedStore("email", true)
                        return
                    }
                    // every other failure (password policy 400, rate limit 429, network…)
                    // goes through the standard localized REST error toast.
                    toast.danger(t("toast.errorTitle"), {
                        description: error instanceof Error ? error.message : String(error),
                    })
                    return
                }
                toast.success(t("toast.successTitle"), { description: t("auth.signUp.otp.sent") })
                setValue("otp", "")
                dispatch(setSignUpState(SignUpState.Otp))
                return
            }
            // OTP step — verify activates the account AND returns a login token pair; the SWR hook
            // has already persisted it (LocalStorage + redux) when `accessToken` is present.
            const result = await runRest(
                () => mutateVerifyRegistration({ email: email.trim(), otp }),
                { showErrorToast: true, showSuccessToast: true, successMessage: t("auth.signUp.success") },
            )
            // `null` → verify threw (wrong/expired OTP — toast already shown); keep the OTP step open.
            if (!result?.accessToken) {
                return
            }
            reset()
            dispatch(resetSignUpState())
            // the user is now authenticated — close the modal and stay on the current route
            // (no switch to the sign-in tab: verify already signed them in).
            onAuthenticationClose()
        } finally {
            setIsSubmitting(false)
        }
    }, [signUpState, email, password, otp, mutateRegister, mutateVerifyRegistration, runRest, setValue, setTouchedStore, dispatch, reset, onAuthenticationClose, setIsSubmitting, t])

    // the 409-driven "email already registered" flag is only valid for the email it was raised
    // for — editing the email clears it (the next submit re-checks against the backend).
    useEffect(() => {
        setValue("emailExists", false)
    }, [email, setValue])

    /** Formik-compat: the form is valid when there are no errors left. */
    const isValid = Object.keys(errors).length === 0
    /** Formik-compat `resetForm`: reset the store to its initial state. */
    const resetForm = useCallback(() => reset(), [reset])

    return { values, errors, touched, submitForm, setFieldValue, setFieldTouched, isSubmitting, isValid, resetForm }
}
