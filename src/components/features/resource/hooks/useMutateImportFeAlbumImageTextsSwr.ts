"use client"

import useSWRMutation from "swr/mutation"

import { importFeAlbumImageAsText } from "@/modules/api/rest/resource"
import type { FeTextImportFailure } from "@/modules/api/rest/resource"
import type { ImportFeAlbumTextsResult } from "./useMutateImportFeAlbumTextsSwr"

/** Trigger arg for {@link useMutateImportFeAlbumImageTextsSwr}. */
export interface ImportFeAlbumImageTextsParams {
    /** The FE resource (album) the pages are appended to. */
    resourceId: string
    /** Pictures of exam pages, in the order they should land. */
    files: Array<File>
    /** Ping after each picture settles, for the panel's counter. */
    onProgress?: (done: number, total: number) => void
    /** Abort the run between pictures. */
    signal?: AbortSignal
}

/**
 * Turns PICTURES of exam pages into TEXT pages, **one picture per request, sequentially**.
 *
 * Same shape as {@link useMutateImportFeAlbumTextsSwr} and for the same reasons — each picture is
 * one vision call the server runs under a 90-second budget, so a batched request would be cut by
 * the gateway after some pages had already been created — but this one is slower per file: reading
 * a scan costs more than tidying already-typed text. The progress counter is what keeps that from
 * looking like a hang.
 */
export const useMutateImportFeAlbumImageTextsSwr = () => {
    return useSWRMutation<ImportFeAlbumTextsResult, Error, string, ImportFeAlbumImageTextsParams>(
        "POST_IMPORT_FE_ALBUM_IMAGE_TEXTS_SWR",
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
                    const result = await importFeAlbumImageAsText(resourceId, file)
                    imported += result.created?.length ?? 0
                    result.failed?.forEach((f) => failed.push(f))
                    result.warnings?.forEach((w) => warnings.add(w))
                } catch (error) {
                    failed.push({
                        filename: file.name,
                        reason: error instanceof Error ? error.message : "Không số hoá được ảnh",
                    })
                }
                onProgress?.(i + 1, files.length)
            }

            return { imported, failed, warnings: Array.from(warnings), cancelled }
        },
    )
}
