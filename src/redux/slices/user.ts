import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { EnrollmentEntity } from "@/modules/types/entities/enrollment"
import type { UserEntity } from "@/modules/types/entities/user"
import type { ViewerScopedGrant } from "@/modules/api/graphql/queries/types/me"

/** RBAC access derived from the GraphQL `Viewer` (permission codes + scoped grants). */
export interface ViewerAccess {
    /** Flat permission codes the viewer holds (BE `Viewer.permissions`). */
    permissions: Array<string>
    /** Role grants scoped to a resource/scope (BE `Viewer.scopedGrants`). */
    scopedGrants: Array<ViewerScopedGrant>
}

/**
 * Client state for the authenticated user and their course enrollment.
 */
export interface UserSlice {
    /** The user. */
    user: UserEntity | null
    /** Flat permission codes from `me.permissions` (empty until the viewer resolves). */
    permissions: Array<string>
    /** Scoped role grants from `me.scopedGrants`. */
    scopedGrants: Array<ViewerScopedGrant>
    /** Whether the user is enrolled in the course. */
    enrolled: boolean
    /** The user's enrollment. */
    enrollment?: EnrollmentEntity
}

/**
 * The initial state of the user slice.
 */
const initialState: UserSlice = {
    /** The user. */
    user: null,
    /** The viewer's permission codes. */
    permissions: [],
    /** The viewer's scoped role grants. */
    scopedGrants: [],
    /** Whether the user is enrolled in the course. */
    enrolled: false,
    /** The user's enrollment. */
    enrollment: undefined,
}

/**
 * Slice tracking the signed-in user entity, enrollment flag, and enrollment detail.
 */
export const userSlice = createSlice(
    {
        /** The name of the slice. */
        name: "user",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the user. */
            setUser: (
                state,
                action: PayloadAction<UserEntity | null>
            ) => {
                state.user = action.payload
                // Signing out (null) also clears RBAC access so gated UI re-hides.
                if (action.payload === null) {
                    state.permissions = []
                    state.scopedGrants = []
                }
            },
            /** Store the viewer's RBAC access (permissions + scoped grants) from `me`. */
            setViewerAccess: (
                state,
                action: PayloadAction<ViewerAccess>,
            ) => {
                state.permissions = action.payload.permissions
                state.scopedGrants = action.payload.scopedGrants
            },
            /** The action to set the enrolled state. */
            setEnrolled: (
                state, 
                action: PayloadAction<boolean>
            ) => {
                state.enrolled = action.payload
            },
            /** The action to set the enrollment. */
            setEnrollment: (
                state, 
                action: PayloadAction<EnrollmentEntity | undefined>
            ) => {
                state.enrollment = action.payload
            },
        },
    },
)

/** Root reducer for the user slice. */
export const userReducer = userSlice.reducer
/** Actions exported from the user slice. */
export const {
    setUser,
    setViewerAccess,
    setEnrolled,
    setEnrollment,
} = userSlice.actions