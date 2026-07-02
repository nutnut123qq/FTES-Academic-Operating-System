/** Accepted identity image MIME types (mirrors `blocks/identity/ImageDropzone`). */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

/** Max identity image size in bytes (5 MB — mirrors the BE avatar limit). */
export const IDENTITY_IMAGE_MAX_SIZE = 5 * 1024 * 1024

/** i18n error key (under `groupsHub.identity.*`) for a rejected identity image. */
export type IdentityImageError = "invalidType" | "tooLarge"

/**
 * Validates a picked group identity image (avatar or cover) BEFORE accepting it.
 * Shared by the create form and the management identity section so both surfaces
 * enforce the same type/size rules.
 *
 * @param file - The picked file.
 * @returns The `groupsHub.identity.*` error key, or null when the file is valid.
 */
export const validateIdentityImage = (file: File): IdentityImageError | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return "invalidType"
    }
    if (file.size > IDENTITY_IMAGE_MAX_SIZE) {
        return "tooLarge"
    }
    return null
}
