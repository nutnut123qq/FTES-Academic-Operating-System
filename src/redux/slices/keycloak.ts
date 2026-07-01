import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"

/**
 * Redux state for Keycloak authentication session.
 */
export interface KeycloakSlice {
    /** The access token. */
    accessToken?: string
    /** Whether the user is authenticated. */
    authenticated: boolean
    /** Whether the Keycloak adapter has finished initialising. */
    initialized: boolean
}

/**
 * The initial state of the keycloak slice.
 */
const initialState: KeycloakSlice = {
    /** The access token. */
    accessToken: undefined,
    /** Whether the user is authenticated. */
    authenticated: false,
    /** Whether the keycloak is initialized. */
    initialized: false,
}

/**
 * Slice tracking Keycloak authentication state (token, auth flag, init flag).
 */
export const keycloakSlice = createSlice(
    {
        /** The name of the slice. */
        name: "keycloak",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** Store the latest Keycloak access token (or clear it on sign-out). */
            setAccessToken: (
                state,
                action: PayloadAction<string | undefined>
            ) => {
                state.accessToken = action.payload
            },
            /** The action to set the authenticated state. */
            setAuthenticated: (
                state,
                action: PayloadAction<boolean>
            ) => {
                state.authenticated = action.payload
            },
            /** The action to set the initialized state. */
            setInitialized: (
                state,
                action: PayloadAction<boolean>
            ) => {
                state.initialized = action.payload
            },
        },
    }
)

/** Root reducer for the keycloak slice. */
export const keycloakReducer = keycloakSlice.reducer
/** Actions exported from the keycloak slice. */
export const {
    setAccessToken,
    setAuthenticated,
    setInitialized,
} = keycloakSlice.actions
