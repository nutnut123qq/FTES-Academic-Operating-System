/**
 * Decoded parts of an opaque global id: the originating entity name and the raw
 * primary-key id.
 */
export interface DecodedGlobalId {
    /** Backend entity name encoded in the id (e.g. `CourseEntity`). */
    entityName: string
    /** Raw primary-key id of the entity (everything after the first `:`). */
    id: string
}

/**
 * Decode an opaque global id produced by the backend.
 *
 * The backend encodes ids as `base64url(`${entityName}:${id}`)`. This reverses
 * that: base64url → utf8 string → split on the FIRST `:` (the id itself may
 * contain `:`, the entity name will not). Useful to turn a `myCourses[].globalId`
 * (which encodes `CourseEntity:<id>`) into the raw course id the outline query
 * needs.
 *
 * @param globalId - The base64url-encoded `entityName:id` string.
 * @returns The decoded `{ entityName, id }`, or `null` when the input is
 *   malformed (not valid base64url, or missing the `:` separator).
 */
export const fromGlobalId = (globalId: string): DecodedGlobalId | null => {
    if (!globalId) {
        return null
    }

    let decoded: string
    try {
        // base64url → bytes → utf8; atob handles standard base64, so normalize
        // the url-safe alphabet (`-_`) back to standard (`+/`) first
        const normalized = globalId.replace(/-/g, "+").replace(/_/g, "/")
        const binary = atob(normalized)
        // re-encode the binary string as utf8 so multibyte ids survive intact
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
        decoded = new TextDecoder().decode(bytes)
    } catch {
        // not valid base64url → malformed
        return null
    }

    const separatorIndex = decoded.indexOf(":")
    if (separatorIndex < 0) {
        // no `:` → not an `entityName:id` payload
        return null
    }

    const entityName = decoded.slice(0, separatorIndex)
    const id = decoded.slice(separatorIndex + 1)
    if (!entityName || !id) {
        return null
    }

    return {
        entityName,
        id,
    }
}
