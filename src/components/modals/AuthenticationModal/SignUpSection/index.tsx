"use client"

/**
 * Sign-up section inside {@link AuthenticationModal}.
 *
 * Mirrors {@link SignInSection}: router on Redux `state.signUpState`.
 * Flow: **Registration** (`signUpInit`) → **Otp** (`signUpVerifyOtp`).
 *
 * ### Data layer
 * - {@link useMutateSignUpSwr} — GraphQL `signUpInit` (SWR singleton).
 * - {@link useMutateSignUpVerifyOtpSwr} — GraphQL `signUpVerifyOtp`.
 * - {@link useSignUpForm} — submit branches + `challengeId` / `otp` values.
 */
import React from "react"
import { RegistrationState } from "./RegistrationState"
import { OtpState } from "./OtpState"
import { useAppSelector } from "@/redux/hooks"
import { SignUpState } from "@/redux/slices/state"

/**
 * Renders the active sign-up step from `signUpState`.
 */
export const SignUpSection = () => {
    const signUpState = useAppSelector((state) => state.state.signUpState)
    switch (signUpState) {
    case SignUpState.Registration:
        return <RegistrationState />
    case SignUpState.Otp:
        return <OtpState />
    default:
        return null
    }
}
