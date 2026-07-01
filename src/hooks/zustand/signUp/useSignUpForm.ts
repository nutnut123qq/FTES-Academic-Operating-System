"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import validator from "validator"
import _ from "lodash"
import { useSignUpStore } from "./store"
import { useMutateSignUpSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignUpInitSwr"
import { useMutateSignUpVerifyOtpSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignUpVerifyOtpSwr"
import { useQueryCheckEmailExistsSwr } from "@/hooks/swr/api/graphql/queries/useQueryCheckEmailExistsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { resetSignUpState, setSignUpState, SignUpState } from "@/redux/slices/state"

/**
 * Sign-up form hook (replaces the formik singleton) — state SHARED via {@link useSignUpStore} so it
 * survives the Registration→OTP step transition. Returns a formik-compatible shape. The current step
 * comes from redux `state.signUpState`. Includes a debounced email-exists check (sign-up: existing = error).
 */
export const useSignUpForm = () => {
    const t = useTranslations()
    const runGraphQL = useGraphQLWithToast()
    const dispatch = useAppDispatch()
    const signUpState = useAppSelector((state) => state.state.signUpState)
    const { trigger: mutateSignUpInit } = useMutateSignUpSwr()
    const { trigger: mutateSignUpVerifyOtp } = useMutateSignUpVerifyOtpSwr()
    const { trigger: queryCheckEmailExists } = useQueryCheckEmailExistsSwr()

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
                let nextChallengeId: string | undefined
                const ok = await runGraphQL(
                    async () => {
                        const apolloResult = await mutateSignUpInit({
                            request: { email, password },
                            headers: captchaToken ? { "x-captcha-token": captchaToken } : undefined,
                        })
                        const env = apolloResult.data?.signUpInit
                        if (!env) {
                            throw new Error("signUpInit failed")
                        }
                        nextChallengeId = env.data?.challengeId
                        if (!env.success || !nextChallengeId) {
                            throw new Error(env.error ?? env.message ?? "signUpInit failed")
                        }
                        return env
                    },
                    { showErrorToast: true, showSuccessToast: true },
                )
                if (!ok) {
                    return
                }
                setValue("challengeId", nextChallengeId)
                setValue("otp", "")
                dispatch(setSignUpState(SignUpState.Otp))
                return
            }
            const ok = await runGraphQL(
                async () => {
                    if (!challengeId) {
                        throw new Error("challengeId is required")
                    }
                    const apolloResult = await mutateSignUpVerifyOtp({ request: { challengeId, otp } })
                    const verifyEnv = apolloResult.data?.signUpVerifyOtp
                    if (!verifyEnv) {
                        throw new Error("signUpVerifyOtp failed")
                    }
                    return verifyEnv
                },
                { showErrorToast: true, showSuccessToast: true },
            )
            if (!ok) {
                return
            }
            reset()
            dispatch(resetSignUpState())
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
        } finally {
            setIsSubmitting(false)
        }
    }, [signUpState, email, password, challengeId, otp, captchaToken, mutateSignUpInit, mutateSignUpVerifyOtp, setValue, dispatch, reset, setIsSubmitting, runGraphQL])

    useEffect(() => {
        const controller = new AbortController()
        const debounced = _.debounce(async () => {
            const trimmed = email.trim()
            if (!trimmed || !validator.isEmail(trimmed)) {
                return
            }
            const result = await queryCheckEmailExists({ request: { email: trimmed }, signal: controller.signal })
            if (result.isBloomFilterReady) {
                setValue("emailExists", result.exists)
            }
        }, 300)
        debounced()
        return () => {
            controller.abort()
            debounced.cancel()
        }
    }, [email, queryCheckEmailExists, setValue])

    /** Formik-compat: the form is valid when there are no errors left. */
    const isValid = Object.keys(errors).length === 0
    /** Formik-compat `resetForm`: reset the store to its initial state. */
    const resetForm = useCallback(() => reset(), [reset])

    return { values, errors, touched, submitForm, setFieldValue, setFieldTouched, isSubmitting, isValid, resetForm }
}
