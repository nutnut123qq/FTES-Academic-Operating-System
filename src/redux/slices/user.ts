import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { EnrollmentEntity } from "@/modules/types/entities/enrollment"
import type { UserEntity } from "@/modules/types/entities/user"

/**
 * Client state for the authenticated user and their course enrollment.
 */
export interface UserSlice {
    /** The user. */
    user: UserEntity | null
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
    setEnrolled,
    setEnrollment,
} = userSlice.actions