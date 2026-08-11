/**
 * Intake triage for FE-album pictures — shared by the two surfaces that take them
 * (`ExamContribute`'s `AlbumImagePicker` and `FeAlbumManager`).
 *
 * A picker can hand over either a hand-picked `<input multiple>` selection or a WHOLE
 * FOLDER (`<input webkitdirectory>`), and a real exam folder is never clean: it carries
 * `Thumbs.db`, `.DS_Store`, a stray PDF, sub-folders, and sometimes more pages than one
 * album may hold. This module is the pure half of handling that:
 *
 * 1. **keep only pictures the album endpoint accepts** ({@link FE_ALBUM_IMAGE_MIME}),
 * 2. **order a folder pick the way a human reads it** (`de1, de2, de10`, never
 *    `de1, de10, de2`) — pick order IS the album order, because the BE stamps
 *    `sortOrder` as the pictures arrive,
 * 3. **stop at the album cap** while reporting the overflow, never truncating in silence.
 *
 * Everything a caller needs to TELL the user is returned as counts
 * ({@link AlbumPickTriage}); this file never toasts and never touches React, so the rules
 * are unit-testable on their own.
 */

import { FE_ALBUM_IMAGE_MIME, fileExtension } from "./uploadRules"

/**
 * Canonical MIME per album picture extension.
 *
 * Only used when the browser reports NO `File.type` — a real case for folder picks on
 * Windows, where an unregistered extension yields `""`. The file is then re-wrapped with
 * the right type so the multipart part is not sent as `application/octet-stream` (which
 * the BE picture gate refuses). Mirrors the same fallback `resolveResourceMimeType` does
 * for ordinary resource uploads.
 */
const ALBUM_EXTENSION_MIME: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

/** A file as the pickers see it: a folder pick also carries `webkitRelativePath`. */
type PickedFile = File & { readonly webkitRelativePath?: string }

/**
 * The path a picked file is ordered by: `CSD201/2024/de1.png` for a folder pick (the
 * browser's `webkitRelativePath`, sub-folders included), the bare filename otherwise.
 * Normalized to POSIX separators so a Windows pick sorts like every other one.
 *
 * @param file - a picked file.
 * @returns the ordering path (never empty for a real pick).
 */
export const albumFilePath = (file: PickedFile): string => {
    const relative = file.webkitRelativePath
    return (relative !== undefined && relative !== "" ? relative : file.name).replace(
        /\\/g,
        "/",
    )
}

/**
 * Collator doing the actual "natural" comparison: `numeric` makes `de2 < de10`, and the
 * locale is PINNED so the album order does not change with the viewer's language.
 */
const NATURAL_COLLATOR = new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
})

/**
 * Natural ("human") order of two picked paths, compared SEGMENT BY SEGMENT so a folder
 * boundary always outranks the characters around it (`CSD201/2024/de2.png` sits next to
 * `CSD201/2024/de10.png`, not next to `CSD201/2024-extra/…`). Shallower paths come first
 * when one path is a prefix of the other, and an exact collator tie falls back to a code
 * point comparison so the result is total and deterministic.
 *
 * @param a - first path (see {@link albumFilePath}).
 * @param b - second path.
 * @returns negative when `a` sorts first, positive when `b` does, `0` only for equal paths.
 */
export const compareNaturalPath = (a: string, b: string): number => {
    const left = a.split("/")
    const right = b.split("/")
    const shared = Math.min(left.length, right.length)
    for (let index = 0; index < shared; index += 1) {
        const verdict = NATURAL_COLLATOR.compare(left[index], right[index])
        if (verdict !== 0) {
            return verdict
        }
    }
    if (left.length !== right.length) {
        return left.length - right.length
    }
    if (a === b) {
        return 0
    }
    return a < b ? -1 : 1
}

/** How a pick should be triaged. */
export interface AlbumPickOptions {
    /**
     * How many more pictures the album can take — the SERVER's cap minus what is already
     * in it (`FeAlbumView.maxImages`), or `FE_ALBUM_MAX_IMAGES` before the album exists.
     */
    room: number
    /** Per-picture size cap in MB (`FE_ALBUM_MAX_IMAGE_MB`). */
    maxImageMb: number
    /**
     * Sort the survivors by {@link compareNaturalPath}. `true` for a FOLDER pick (the OS
     * hands the files over in an arbitrary order); `false` for a hand-picked selection,
     * whose order the contributor chose deliberately.
     */
    sortByPath?: boolean
}

/** What a pick produced — plus everything the caller must report back to the user. */
export interface AlbumPickTriage {
    /** Pictures to upload, in album order, already capped to `room`. */
    accepted: Array<File>
    /** Entries dropped for not being an accepted picture (`Thumbs.db`, a PDF, …). */
    wrongType: number
    /** Pictures dropped for exceeding the per-picture size cap. */
    tooLarge: number
    /** Valid pictures left out because the album cap was reached. */
    droppedOverCap: number
}

/**
 * The one accepted picture, or `null` when the entry is not one.
 *
 * A file whose type the browser did report must match the album whitelist exactly; a file
 * with NO reported type is judged by its extension and re-wrapped with the canonical MIME
 * (see {@link ALBUM_EXTENSION_MIME}).
 */
const asAlbumImage = (file: File): File | null => {
    const reported = (file.type.split(";")[0] ?? "").trim().toLowerCase()
    if (FE_ALBUM_IMAGE_MIME.includes(reported)) {
        return file
    }
    if (reported !== "") {
        return null
    }
    const fallback = ALBUM_EXTENSION_MIME[fileExtension(file.name)]
    if (fallback === undefined) {
        return null
    }
    return new File([file], file.name, {
        type: fallback,
        lastModified: file.lastModified,
    })
}

/**
 * Triages a pick (files OR a whole folder) into the pictures to upload plus the counts
 * that must be surfaced.
 *
 * Order of operations matters: type → size → sort → cap, so the cap keeps the FIRST `N`
 * pictures of the album order rather than the first `N` the OS happened to list.
 *
 * @param files - every entry the input produced, in the browser's order.
 * @param options - {@link AlbumPickOptions}.
 * @returns the {@link AlbumPickTriage}; never throws, never mutates `files`.
 */
export const triageAlbumPick = (
    files: ReadonlyArray<File>,
    { room, maxImageMb, sortByPath = false }: AlbumPickOptions,
): AlbumPickTriage => {
    const maxBytes = maxImageMb * 1024 * 1024
    const kept: Array<{ file: File, path: string }> = []
    let wrongType = 0
    let tooLarge = 0

    for (const file of files) {
        // The path comes from the ORIGINAL file: re-wrapping loses `webkitRelativePath`.
        const path = albumFilePath(file)
        const image = asAlbumImage(file)
        if (image === null) {
            wrongType += 1
            continue
        }
        if (image.size > maxBytes) {
            tooLarge += 1
            continue
        }
        kept.push({ file: image, path })
    }

    if (sortByPath) {
        kept.sort((left, right) => compareNaturalPath(left.path, right.path))
    }

    const fits = Math.max(0, room)
    return {
        accepted: kept.slice(0, fits).map((entry) => entry.file),
        wrongType,
        tooLarge,
        droppedOverCap: Math.max(0, kept.length - fits),
    }
}
