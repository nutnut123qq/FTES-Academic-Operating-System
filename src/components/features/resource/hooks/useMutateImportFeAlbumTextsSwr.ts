"use client"

import useSWRMutation from "swr/mutation"

import { importFeAlbumTextFile } from "@/modules/api/rest/resource"
import type { FeTextImportFailure } from "@/modules/api/rest/resource"

/** Trigger arg for {@link useMutateImportFeAlbumTextsSwr}. */
export interface ImportFeAlbumTextsParams {
    /** The FE resource (album) the pages are appended to. */
    resourceId: string
    /** Text exam files to import, in the order they should land. */
    files: Array<File>
    /** Ping after each file settles, for the panel's counter. */
    onProgress?: (done: number, total: number) => void
    /** Abort the run between files. */
    signal?: AbortSignal
}

/** Outcome of a text import — reported honestly rather than collapsed into success/failure. */
export interface ImportFeAlbumTextsResult {
    /** Pages the server created. */
    imported: number
    /** Files the server refused, with the reason it gave. */
    failed: Array<FeTextImportFailure>
    /** What the AI had to guess, deduplicated across files. */
    warnings: Array<string>
    /** The caller aborted mid-run. */
    cancelled: boolean
}

/**
 * Imports text exam files into an FE album, **one file per request, sequentially**.
 *
 * Why not one request with every file: each file is a separate AI normalisation call that the
 * server runs one after another under a 90-second budget each. Ten files in a single request is
 * fifteen minutes of held connection — every proxy in front of the app cuts it long before that,
 * and the user is handed a bare network error *after* some pages have already been created, so
 * retrying duplicates them. Sequential single-file requests fail one file at a time, which is a
 * failure the panel can actually explain and the user can actually act on.
 *
 * Sequential rather than parallel for the same reason the picture uploader is: the server
 * rate-limits per user per file, and firing ten at once just converts the limit into ten errors.
 *
 * A refusal never aborts the run — the remaining files are still attempted, and every reason is
 * collected for the panel.
 */
export const useMutateImportFeAlbumTextsSwr = () => {
    return useSWRMutation<ImportFeAlbumTextsResult, Error, string, ImportFeAlbumTextsParams>(
        "POST_IMPORT_FE_ALBUM_TEXTS_SWR",
        async (_key, { arg }) => {
            const { resourceId, files, onProgress, signal } = arg
            const failed: Array<FeTextImportFailure> = []
            const warnings = new Set<string>()
            let imported = 0
            let cancelled = false

            for (let i = 0; i < files.length; i += 1) {
                if (signal?.aborted) {
                    cancelled = true
                    break
                }
                const file = files[i]
                try {
                    const result = await importFeAlbumTextFile(resourceId, file)
                    imported += result.created?.length ?? 0
                    result.failed?.forEach((f) => failed.push(f))
                    result.warnings?.forEach((w) => warnings.add(w))
                } catch (error) {
                    // The whole request failed (403, 503, network). Attribute it to THIS file so
                    // the panel can name it, and keep going with the rest.
                    failed.push({
                        filename: file.name,
                        reason: error instanceof Error ? error.message : "Không nạp được file",
                    })
                }
                onProgress?.(i + 1, files.length)
            }

            return { imported, failed, warnings: Array.from(warnings), cancelled }
        },
    )
}
