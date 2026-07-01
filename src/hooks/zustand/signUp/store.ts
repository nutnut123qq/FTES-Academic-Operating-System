"use client"

import { create } from "zustand"

/** Touched field of the sign-up form. */
type SignUpField = "email" | "password" | "confirmPassword" | "agreeToTerms" | "otp"

/**
 * Zustand store for the sign-up form — SHARED so values survive the Registration → OTP step
 * transition. Previously a formik singleton.
 */
interface SignUpStoreState {
    /** Email (also the username). */
    email: string
    /** Whether the email already exists (for sign-up, existing = error). */
    emailExists: boolean
    /** Password. */
    password: string
    /** Password confirmation. */
    confirmPassword: string
    /** Whether the terms are accepted. */
    agreeToTerms: boolean
    /** 6-digit OTP. */
    otp: string
    /** challengeId from signUpInit. */
    challengeId?: string
    /** Captcha token from Turnstile widget. */
    captchaToken?: string
    /** Touched fields. */
    touched: Record<SignUpField, boolean>
    /** Whether a submit is in flight. */
    isSubmitting: boolean
    /** Set one field's value. */
    setValue: (field: "email" | "emailExists" | "password" | "confirmPassword" | "agreeToTerms" | "otp" | "challengeId" | "captchaToken", value: string | boolean | undefined) => void
    /** Mark one field as touched. */
    setTouched: (field: SignUpField, value: boolean) => void
    /** Set the submitting flag. */
    setIsSubmitting: (value: boolean) => void
    /** Reset the whole form. */
    reset: () => void
}

const initialState = {
    email: "",
    emailExists: false,
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    otp: "",
    challengeId: undefined as string | undefined,
    captchaToken: undefined as string | undefined,
    touched: { email: false, password: false, confirmPassword: false, agreeToTerms: false, otp: false },
    isSubmitting: false,
}

/** Shared store for the sign-up form. */
export const useSignUpStore = create<SignUpStoreState>((set) => ({
    ...initialState,
    setValue: (field, value) => set({ [field]: value } as Partial<SignUpStoreState>),
    setTouched: (field, value) => set((state) => ({ touched: { ...state.touched, [field]: value } })),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    reset: () => set({ ...initialState }),
}))
