import type { NotificationType } from "./types/notifications"
import type {
    QueryNotificationPreferencesData,
    QueryNotificationPreferencesResponse,
} from "./types/notification-preferences"

/**
 * FE-only mock store for notification preferences.
 *
 * BE contract assumption (recorded per CLAUDE.md — NOT an existing endpoint):
 * a real backend would persist one preferences row per user and, ideally,
 * filter muted types server-side. Until that lands, preferences live in this
 * module-level object so `myNotificationPreferences` /
 * `updateMyNotificationPreferences` behave like a real query/mutation pair
 * (standard envelope, nullable `data`) and can be swapped for GraphQL runners
 * without touching the SWR hooks or UI.
 */
const preferencesStore: QueryNotificationPreferencesData = {
    mutedTypes: [],
    muteAll: false,
}

/** Small artificial latency so SWR loading states are exercised in dev. */
const MOCK_LATENCY_MS = 120

/** Resolve after {@link MOCK_LATENCY_MS} to emulate a network round trip. */
const delay = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

/**
 * Reads the current user's notification preferences (mock). Mirrors the shape a
 * real `myNotificationPreferences` GraphQL query would return: the standard
 * envelope with a nullable `data` payload.
 *
 * @returns the mocked Apollo-like response wrapping the preferences.
 */
export const queryMyNotificationPreferences =
    async (): Promise<{ data: QueryNotificationPreferencesResponse }> => {
        await delay()
        return {
            data: {
                myNotificationPreferences: {
                    success: true,
                    message: "OK",
                    data: {
                        mutedTypes: [...preferencesStore.mutedTypes],
                        muteAll: preferencesStore.muteAll,
                    },
                },
            },
        }
    }

/** Request body for {@link mutateUpdateMyNotificationPreferences}. */
export interface UpdateNotificationPreferencesRequest {
    /** Full replacement set of muted types. */
    mutedTypes: Array<NotificationType>
    /** Full replacement value for the master mute switch. */
    muteAll: boolean
}

/** Apollo-like response shape for the mock `updateMyNotificationPreferences`. */
export interface MutateUpdateNotificationPreferencesResponse {
    /** Top-level field wrapping the standard envelope with the saved payload. */
    updateMyNotificationPreferences: {
        success: boolean
        message: string
        error?: string
        data?: QueryNotificationPreferencesData
    }
}

/**
 * Persists the current user's notification preferences (mock — writes the
 * module-level store). Returns the saved payload inside the standard envelope so
 * the caller can revalidate the read hook.
 *
 * @param params - the request holding the full `mutedTypes` + `muteAll` state.
 * @returns the mocked Apollo-like response echoing the saved preferences.
 */
export const mutateUpdateMyNotificationPreferences = async ({
    request,
}: {
    request: UpdateNotificationPreferencesRequest
}): Promise<{ data: MutateUpdateNotificationPreferencesResponse }> => {
    await delay()
    preferencesStore.mutedTypes = [...request.mutedTypes]
    preferencesStore.muteAll = request.muteAll
    return {
        data: {
            updateMyNotificationPreferences: {
                success: true,
                message: "OK",
                data: {
                    mutedTypes: [...preferencesStore.mutedTypes],
                    muteAll: preferencesStore.muteAll,
                },
            },
        },
    }
}
