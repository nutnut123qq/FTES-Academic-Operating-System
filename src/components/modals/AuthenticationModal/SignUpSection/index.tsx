"use client"

/**
 * Sign-up section inside {@link AuthenticationModal}.
 *
 * Mirrors {@link SignInSection}: router on Redux `state.signUpState`.
 * Flow: **Registration** (`POST /auth/register`) → **Otp** (`POST /auth/register/verify`).
 *
 * ### Data layer
 * - {@link usePostRegisterSwr} — REST register (also the idempotent OTP resend).
 * - {@link usePostVerifyRegistrationSwr} — REST verify; returns a login token pair.
 * - {@link useSignUpForm} — submit branches + `email` / `otp` values.
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
