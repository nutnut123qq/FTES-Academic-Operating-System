import type { QueryNotificationTargetData } from "@/modules/api/graphql/queries/types/notifications"

/**
 * Encode a notification target into the opaque global id the route index
 * expects: base64url of `"<entityName>:<id>"`. Shared by the bell popover and
 * the notification center so the encoding lives in exactly one place.
 *
 * @param target - the snapshotted notification target (`entityName` + `id`).
 * @returns the base64url-encoded `<entityName>:<id>` global id.
 */
export const encodeNotificationGlobalId = (
    target: QueryNotificationTargetData,
): string => {
    const raw = `${target.entityName}:${target.id}`
    // base64 → base64url (the route index decodes base64url(`<entityName>:<id>`))
    return btoa(raw)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}
