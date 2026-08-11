"use client"

import useSWRMutation from "swr/mutation"

import { uploadFeAlbumImage } from "@/modules/api/rest/resource"
import {
    classifyResourceUploadError,
    type ResourceUploadErrorReason,
} from "@/components/features/resource/ResourceUpload/uploadFlow"
import {
    FE_IMAGE_RATE_LIMIT_BACKOFF_MS,
    nextFeImageUploadDelayMs,
} from "./feAlbumManage"

/** Trigger arg for {@link useMutateAddFeAlbumImagesSwr}. */
export interface AddFeAlbumImagesParams {
    /** The FE resource (album) the pictures are appended to. */
    resourceId: string
    /** Pictures to append, in the order they should land. */
    files: Array<File>
    /** Ping after each picture settles, for the panel's counter. */
    onProgress?: (done: number, total: number) => void
    /**
     * Ping while the pacer (or a 429 backoff) is sleeping, so the panel can say why
     * nothing is happening. `0` clears the notice.
     */
    onWait?: (waitMs: number) => void
    /** Abort the run between pictures / during a wait. */
    signal?: AbortSignal
}

/** Outcome of a bulk add — reported honestly rather than collapsed into success/failure. */
export interface AddFeAlbumImagesResult {
    /** Pictures the server accepted. */
    uploaded: number
    /** Pictures the server refused for a non-throttling reason. */
    failed: number
    /** The run stopped early because the server kept throttling. */
    stoppedByRateLimit: boolean
    /** The caller aborted mid-run. */
    cancelled: boolean
    /** Reason of the first refusal, for the panel's error line. */
    firstErrorReason: ResourceUploadErrorReason | null
}

/** `setTimeout` as an abortable promise (an abort resolves early, it never rejects). */
const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise<void>((resolve) => {
        if (ms <= 0 || signal?.aborted) {
            resolve()
            return
        }
        const finish = () => {
            clearTimeout(timer)
            signal?.removeEventListener("abort", finish)
            resolve()
        }
        const timer = setTimeout(finish, ms)
        signal?.addEventListener("abort", finish, { once: true })
    })

/**
 * Appends pictures to an EXISTING FE album, one request each
 * (`POST /api/v1/resources/{id}/images`).
 *
 * **Sequential, never parallel** — the BE stamps `sortOrder` on arrival, so a parallel
 * burst would scramble the order the curator picked (same reasoning as
 * `useMutateCreateFeAlbumSwr`).
 *
 * **Self-paced** — the endpoint allows 10 uploads/min and 60/hour per viewer. Before
 * each request {@link nextFeImageUploadDelayMs} says whether a slot is free; a bulk add
 * therefore sleeps between pictures instead of firing 50 requests and collecting
 * `RESOURCE_RATE_LIMITED`. An add of ten or fewer never waits.
 *
 * **Throttled anyway → back off, then stop** — if the server 429s regardless (another
 * tab, an hour-window carry-over), the SAME picture is retried on the
 * {@link FE_IMAGE_RATE_LIMIT_BACKOFF_MS} schedule; once that is exhausted the run stops
 * with `stoppedByRateLimit` rather than burning the remaining files against a closed
 * window. Any OTHER refusal (a bad picture) only costs that one file — the run carries
 * on, exactly like the create-album chain.
 *
 * @returns The `useSWRMutation` handle (`trigger` / `isMutating`).
 */
export const useMutateAddFeAlbumImagesSwr = () => {
    return useSWRMutation<AddFeAlbumImagesResult, Error, string, AddFeAlbumImagesParams>(
        "POST_ADD_FE_ALBUM_IMAGES_SWR",
        async (_key, { arg }) => {
            const { resourceId, files, onProgress, onWait, signal } = arg
            /** Epoch ms of every upload started in THIS run — the pacer's window. */
            const startedAt: Array<number> = []
            let uploaded = 0
            let failed = 0
            let stoppedByRateLimit = false
            let firstErrorReason: ResourceUploadErrorReason | null = null

            for (let index = 0; index < files.length; index += 1) {
                if (signal?.aborted) {
                    break
                }
                const paceMs = nextFeImageUploadDelayMs(startedAt, Date.now())
                if (paceMs > 0) {
                    onWait?.(paceMs)
                    await sleep(paceMs, signal)
                    onWait?.(0)
                    if (signal?.aborted) {
                        break
                    }
                }

                let attempt = 0
                for (;;) {
                    try {
                        startedAt.push(Date.now())
                        await uploadFeAlbumImage(resourceId, files[index])
                        uploaded += 1
                        break
                    } catch (error) {
                        const { reason } = classifyResourceUploadError(error)
                        if (reason === "rateLimited") {
                            const backoffMs = FE_IMAGE_RATE_LIMIT_BACKOFF_MS[attempt]
                            if (backoffMs !== undefined && !signal?.aborted) {
                                attempt += 1
                                onWait?.(backoffMs)
                                await sleep(backoffMs, signal)
                                onWait?.(0)
                                if (!signal?.aborted) {
                                    continue
                                }
                            }
                            firstErrorReason = firstErrorReason ?? reason
                            stoppedByRateLimit = true
                            break
                        }
                        failed += 1
                        firstErrorReason = firstErrorReason ?? reason
                        break
                    }
                }

                onProgress?.(uploaded, files.length)
                if (stoppedByRateLimit) {
                    break
                }
            }

            return {
                uploaded,
                failed,
                stoppedByRateLimit,
                cancelled: signal?.aborted === true,
                firstErrorReason,
            }
        },
    )
}
