import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { SystemConfigData } from "@/modules/types/system-config"

/**
 * App-wide system settings. The FTES BE has no public `systemConfig` query, so this
 * is hydrated with FE-side `DEFAULT_SYSTEM_CONFIG` (see `useQuerySystemConfigSwr`).
 */
export interface SystemSlice {
    /**
     * Challenge-related config (pass threshold, etc.). Undefined until the first successful fetch.
     */
    config?: SystemConfigData
}

/** Initial state for the system slice. */
const initialState: SystemSlice = {}

/**
 * Slice caching the system configuration fetched from the API.
 */
export const systemSlice = createSlice(
    {
        name: "system",
        initialState,
        reducers: {
            /** Store (or clear) the system configuration payload from the API. */
            setSystemConfig: (
                state,
                action: PayloadAction<SystemConfigData | undefined>,
            ) => {
                state.config = action.payload
            },
        },
    },
)

/** Root reducer for the system slice. */
export const systemReducer = systemSlice.reducer
/** Actions exported from the system slice. */
export const { setSystemConfig } = systemSlice.actions
