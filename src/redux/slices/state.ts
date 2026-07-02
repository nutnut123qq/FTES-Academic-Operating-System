import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

/**
 * The state for the sign in section.
 */
export enum SignInState {
    Credentials = "credentials",
    OTP = "otp",
    /** TOTP challenge after OTP verify, shown only when the account has 2FA enabled. */
    TwoFactor = "twoFactor",
}

/**
 * The state for the sign-up section (extend when adding verify-email / OTP steps).
 */
export enum SignUpState {
    Registration = "registration",
    /** After `signUpInit`; user enters OTP (`signUpVerifyOtp`). */
    Otp = "otp",
}

/**
 * The slice for UI states.
 */
export interface StateSlice {
    /** Current step of the sign-in flow. */
    signInState: SignInState
    /** Current step of the sign-up flow. */
    signUpState: SignUpState
}

/**
 * The initial state of the state slice.
 */
const initialState: StateSlice = {
    signInState: SignInState.Credentials,
    signUpState: SignUpState.Registration,
}

/**
 * Slice tracking multi-step sign-in and sign-up flow states.
 */
export const stateSlice = createSlice({
    name: "state",
    initialState,
    reducers: {
        /** Advance or reset the sign-in step. */
        setSignInState: (state, action: PayloadAction<SignInState>) => {
            state.signInState = action.payload
        },
        /** Reset sign-in flow to the credentials (initial) step. */
        resetSignInState: (state) => {
            state.signInState = SignInState.Credentials
        },
        /** Advance or reset the sign-up step. */
        setSignUpState: (state, action: PayloadAction<SignUpState>) => {
            state.signUpState = action.payload
        },
        /** Reset sign-up flow to the registration (initial) step. */
        resetSignUpState: (state) => {
            state.signUpState = SignUpState.Registration
        },
    },
})

/** Root reducer for the state slice. */
export const stateReducer = stateSlice.reducer

/** Actions exported from the state slice. */
export const {
    setSignInState,
    resetSignInState,
    setSignUpState,
    resetSignUpState,
} = stateSlice.actions
