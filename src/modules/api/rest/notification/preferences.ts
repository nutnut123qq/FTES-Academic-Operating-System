import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"
import type { PreferenceCell, PreferenceUpdate } from "./types"

/**
 * Adapters between the backend preference matrix (8 types × 3 channels,
 * `GET/PUT /api/v1/notifications/preferences`) and the FE
 * `{mutedTypes, muteAll}` model the bell/center/preferences surface consume.
 * Only the IN_APP column drives the FE model — PUSH/EMAIL cells pass through
 * untouched until the UI exposes the per-channel matrix.
 */

/** The channel whose cells drive the FE mute model (bell/center/badge). */
export const IN_APP_CHANNEL = "IN_APP"

/** All 8 backend notification types, in enum declaration order. */
const ALL_TYPES: Array<NotificationType> = Object.values(NotificationType)

/**
 * Derive the FE `{mutedTypes, muteAll}` model from the backend matrix: a type
 * is muted ⇔ its `(type, IN_APP)` cell is disabled; `muteAll` ⇔ EVERY type's
 * IN_APP cell is disabled. When mute-all holds, `mutedTypes` is emptied so
 * switching mute-all back off restores every type (the per-type set under a
 * full mute is not representable in the BE matrix — documented lossy mapping).
 *
 * @param cells - the backend preference matrix.
 * @returns the derived FE preferences model.
 */
export const toNotificationPreferencesData = (
    cells: Array<PreferenceCell>,
): QueryNotificationPreferencesData => {
    const disabled = new Set<string>()
    for (const cell of cells) {
        if (cell.channel === IN_APP_CHANNEL && !cell.enabled) {
            disabled.add(cell.type)
        }
    }
    const mutedTypes = ALL_TYPES.filter((type) => disabled.has(type))
    const muteAll =
        mutedTypes.length > 0 && mutedTypes.length === ALL_TYPES.length
    return { mutedTypes: muteAll ? [] : mutedTypes, muteAll }
}

/**
 * Expand the FE `{mutedTypes, muteAll}` model into the full IN_APP column for
 * `PUT /api/v1/notifications/preferences`. Every type is written on each save
 * (the BE upserts atomically), so the persisted column always mirrors the FE
 * state: a cell is enabled unless its type is muted or mute-all is on.
 *
 * @param data - the FE preferences model to persist.
 * @returns one update per type for the IN_APP channel.
 */
export const toPreferenceUpdates = (
    data: QueryNotificationPreferencesData,
): Array<PreferenceUpdate> => {
    const muted = new Set<string>(data.mutedTypes)
    return ALL_TYPES.map((type) => ({
        type,
        channel: IN_APP_CHANNEL,
        enabled: !data.muteAll && !muted.has(type),
    }))
}
