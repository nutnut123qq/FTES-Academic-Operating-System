"use client"

import { create } from "zustand"

/** Text field of the sign-in form. */
type SignInField = "email" | "password" | "otp"

/**
 * Zustand store for the sign-in form — SHARED so values (email, challengeId…) survive the
 * Credentials → OTP step transition (CredentialsState unmounts, OtpState mounts). Previously a
 * formik singleton.
 */
interface SignInStoreState {
    /** Email. */
    email: string
    /** Whether the email exists in the DB (bloom filter). */
    emailExists: boolean
    /** Password. */
    password: string
    /** 6-digit OTP. */
    otp: string
    /** challengeId from signInInit, used to verify the OTP. */
    challengeId?: string
    /** Captcha token from Turnstile widget. */
    captchaToken?: string
    /** Persist the session. */
    rememberMe: boolean
    /** Touched fields. */
    touched: Record<SignInField, boolean>
    /** Whether a submit is in flight. */
    isSubmitting: boolean
    /** Set one field's value. */
    setValue: (field: keyof Omit<SignInStoreState, "touched" | "isSubmitting" | "setValue" | "setTouched" | "setIsSubmitting" | "reset">, value: string | boolean | undefined) => void
    /** Mark one field as touched. */
    setTouched: (field: SignInField, value: boolean) => void
    /** Set the submitting flag. */
    setIsSubmitting: (value: boolean) => void
    /** Reset the whole form. */
    reset: () => void
}

const initialState = {
    email: "",
    emailExists: true,
    password: "",
    otp: "",
    challengeId: undefined as string | undefined,
    captchaToken: undefined as string | undefined,
    rememberMe: false,
    touched: { email: false, password: false, otp: false },
    isSubmitting: false,
}

/** Shared store for the sign-in form. */
export const useSignInStore = create<SignInStoreState>((set) => ({
    ...initialState,
    setValue: (field, value) => set({ [field]: value } as Partial<SignInStoreState>),
    setTouched: (field, value) => set((state) => ({ touched: { ...state.touched, [field]: value } })),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    reset: () => set({ ...initialState }),
}))
