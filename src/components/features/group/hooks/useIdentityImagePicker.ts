"use client"

import { useEffect, useState } from "react"
import { validateIdentityImage, type IdentityImageError } from "../utils/validate-identity-image"

/** State + actions for one identity image picker (avatar OR cover). */
export interface IdentityImagePickerHandle {
    /** The accepted local file (null until a valid pick). */
    file: File | null
    /** Local object-URL preview of {@link IdentityImagePickerHandle.file}. */
    preview: string | null
    /** What the control should display: fresh preview, else the saved URL (unless removed). */
    shown: string | null
    /** Validation error key (`groupsHub.identity.*`) of the last rejected pick. */
    error: IdentityImageError | null
    /** Validates + accepts a picked file (revokes the previous preview). */
    accept: (file: File) => void
    /** Records a rejection surfaced by the picker UI (e.g. ImageDropzone filter). */
    reject: (reason: IdentityImageError) => void
    /**
     * Drops the PICKED file only. The saved image is untouched, so `shown` falls back
     * to `currentUrl` — "I picked the wrong file" must never read as "remove the image
     * the server holds".
     */
    discardPick: () => void
    /**
     * Marks the image as REMOVED: drops any pick AND hides the saved image, so `shown`
     * is null until a new pick lands. This is the state the owner flushes as a real
     * clear — use {@link IdentityImagePickerHandle.discardPick} to undo a pick.
     */
    remove: () => void
}

/**
 * Manages one group identity image pick: validation (type/size), local
 * object-URL preview with revoke-on-change/unmount, inline error key, and a
 * remove action. `currentUrl` pre-seeds the control from the group's saved
 * image (management surface); `remove` hides it so a new pick can replace it.
 *
 * @param currentUrl - The group's saved image URL to pre-seed from (null on create).
 * @returns The picker handle. See {@link IdentityImagePickerHandle}.
 */
export const useIdentityImagePicker = (
    currentUrl: string | null = null,
): IdentityImagePickerHandle => {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [error, setError] = useState<IdentityImageError | null>(null)
    const [cleared, setCleared] = useState(false)

    // revoke the previous object URL whenever the preview changes + on unmount
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview)
            }
        }
    }, [preview])

    const accept = (next: File) => {
        const invalid = validateIdentityImage(next)
        if (invalid) {
            setError(invalid)
            return
        }
        setError(null)
        setFile(next)
        setPreview(URL.createObjectURL(next))
    }

    const reject = (reason: IdentityImageError) => setError(reason)

    const discardPick = () => {
        setFile(null)
        setPreview(null)
        setError(null)
    }

    // `cleared` is what makes the SAVED image disappear — only a real removal sets it.
    const remove = () => {
        discardPick()
        setCleared(true)
    }

    return {
        file,
        preview,
        shown: preview ?? (cleared ? null : currentUrl),
        error,
        accept,
        reject,
        discardPick,
        remove,
    }
}
