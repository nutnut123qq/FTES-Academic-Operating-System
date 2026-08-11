"use client"

import useSWR from "swr"

import {
    getResourceDownloadUrl,
    getResourceVersions,
    type VersionResponse,
} from "@/modules/api/rest/resource"

/** What the PE paper viewer needs to render the exam sheet itself. */
export interface PePaperPreview {
    /** MIME of the current version, or `null` when the resource has no file yet. */
    mimeType: string | null
    /** Original filename, for the download affordance's label. */
    originalFilename: string | null
    /**
     * A URL the browser can render INLINE — only ever set for a picture. PDFs and
     * archives live in the provider's `raw` bucket, whose delivery URL answers 401, so
     * those must go through the BE download stream instead of an `<img>`/`<iframe>`.
     */
    imageUrl: string | null
}

/** Picks the version the resource currently points at (falling back to the newest). */
const currentVersion = (
    versions: Array<VersionResponse>,
    currentVersionId: string | null | undefined,
): VersionResponse | null => {
    if (versions.length === 0) {
        return null
    }
    const pinned = currentVersionId
        ? versions.find((version) => version.id === currentVersionId)
        : undefined
    return (
        pinned ??
        versions.reduce((latest, version) =>
            version.versionNo > latest.versionNo ? version : latest,
        )
    )
}

/**
 * Resolves how to show a PE exam paper: its MIME (from
 * `GET /resources/{id}/versions`) and, for a picture, a URL that renders inline
 * (`GET /resources/{id}/download-url`).
 *
 * The presigned URL is fetched ONLY for images by design. Cloudinary refuses direct
 * delivery of the `raw` bucket where PDFs/zips land (measured: `/download` answers
 * `200 application/pdf` while the provider URL for the same file answers `401`), so
 * asking for one on a PDF would just produce a broken embed — those fall back to the
 * BE-streamed download the caller offers. A failure to mint the URL degrades to `null`
 * for the same reason, never to an error state.
 *
 * @param resourceId - The PE resource; `""` gates the fetch off.
 * @param currentVersionId - `ResourceResponse.currentVersionId` when the detail has
 * loaded, so the preview follows the pinned version rather than guessing.
 * @returns The raw SWR handle over {@link PePaperPreview}.
 */
export const useQueryPePaperSwr = (
    resourceId: string,
    currentVersionId: string | null | undefined,
) => {
    return useSWR<PePaperPreview, Error>(
        resourceId ? (["PE_PAPER_PREVIEW_SWR", resourceId, currentVersionId ?? ""] as const) : null,
        async () => {
            const versions = await getResourceVersions(resourceId)
            const version = currentVersion(versions ?? [], currentVersionId)
            const mimeType = version?.mimeType ?? null

            if (!mimeType || !mimeType.toLowerCase().startsWith("image/")) {
                return {
                    mimeType,
                    originalFilename: version?.originalFilename ?? null,
                    imageUrl: null,
                }
            }

            const url = await getResourceDownloadUrl(resourceId)
                .then((response) => response.url)
                .catch(() => null)
            return {
                mimeType,
                originalFilename: version?.originalFilename ?? null,
                imageUrl: url,
            }
        },
    )
}
