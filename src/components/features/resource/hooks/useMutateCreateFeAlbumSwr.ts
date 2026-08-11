"use client"

import useSWRMutation from "swr/mutation"

import {
    createResource,
    submitResource,
    uploadFeAlbumImage,
    type ResourceResponse,
} from "@/modules/api/rest/resource"

/** Trigger arg for {@link useMutateCreateFeAlbumSwr}. */
export interface CreateFeAlbumParams {
    title: string
    description?: string
    /** Subject **UUID** (the BE keys `subjectId` on the uuid, not the course code). */
    subjectId: string
    /** BE `Visibility` enum name; omitted → the BE default (`MEMBERS`). */
    visibility?: string
    /** The album pictures, in the order they should appear. */
    files: Array<File>
    /** Progress ping after each picture lands, for the contribute form's counter. */
    onProgress?: (uploaded: number, total: number) => void
}

/** What a finished album contribution reports back. */
export interface CreateFeAlbumResult {
    /** The resource after `submit` (status `PENDING_APPROVAL` for an ordinary user). */
    resource: ResourceResponse
    /** How many pictures actually landed. */
    uploaded: number
    /** How many pictures the BE refused — the album was still created and submitted. */
    failed: number
}

/**
 * Publishes a contributed FE album in one chain:
 *
 * ```
 * POST /resources                     -> a DRAFT resource of type FE
 * POST /resources/{id}/images   × N   -> the album pictures, one request each
 * POST /resources/{id}/submit         -> PENDING_APPROVAL (staff publish immediately)
 * ```
 *
 * The pictures are uploaded **sequentially**, not in parallel: the BE assigns
 * `sortOrder` on arrival, so a parallel burst would scramble the album the contributor
 * picked. A picture the BE refuses is counted in `failed` and the chain carries on —
 * losing a 50-file contribution because one file was bad would be worse than an album
 * short one page. If NOT ONE picture lands the first failure is rethrown, since an
 * empty album is not worth reviewing.
 *
 * @returns The `useSWRMutation` handle (`trigger` / `isMutating`).
 */
export const useMutateCreateFeAlbumSwr = () => {
    return useSWRMutation<CreateFeAlbumResult, Error, string, CreateFeAlbumParams>(
        "POST_CREATE_FE_ALBUM_SWR",
        async (_key, { arg }) => {
            const created = await createResource({
                title: arg.title.trim(),
                description: arg.description?.trim() || undefined,
                type: "FE",
                subjectId: arg.subjectId,
                visibility: arg.visibility,
            })

            let uploaded = 0
            let firstFailure: unknown = null
            for (const file of arg.files) {
                try {
                    await uploadFeAlbumImage(created.id, file)
                    uploaded += 1
                } catch (error) {
                    firstFailure = firstFailure ?? error
                }
                arg.onProgress?.(uploaded, arg.files.length)
            }

            if (uploaded === 0) {
                throw firstFailure instanceof Error
                    ? firstFailure
                    : new Error(String(firstFailure ?? "FE album upload failed"))
            }

            const resource = await submitResource(created.id)
            return { resource, uploaded, failed: arg.files.length - uploaded }
        },
    )
}
