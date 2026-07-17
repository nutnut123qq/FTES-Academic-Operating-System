"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import {
    presignGroupMedia,
    uploadGroupMediaFile,
    verifyGroupMedia,
} from "@/modules/api/rest/group"
import { groupHeaderKey } from "./useQueryGroupSwr"

/** Which group image a media upload targets. */
export type GroupMediaKind = "AVATAR" | "COVER"

/**
 * Runs the group avatar/cover upload as three sequential steps
 * (`presign → upload → verify` — change group-identity-media-rules-rsvp §6.1),
 * throwing a STEP-SPECIFIC localized error so a `runRestWithToast` caller surfaces
 * exactly which step failed ("không nửa vời"). On success the group header cache is
 * revalidated so the new signed URL renders. Returns the verified URL.
 *
 * @param groupId - the owning group id.
 */
export const useMutateGroupMediaSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()
    const t = useTranslations("groupsHub")

    const upload = useCallback(
        async (kind: GroupMediaKind, file: File): Promise<string> => {
            // Step 1 — presign
            let presign
            try {
                presign = await presignGroupMedia(groupId, {
                    kind,
                    contentType: file.type,
                    sizeBytes: file.size,
                })
            } catch {
                throw new Error(t("identity.presignFailed"))
            }

            // Step 2 — upload the raw file to the presigned URL
            try {
                await uploadGroupMediaFile(presign.uploadUrl, file)
            } catch {
                throw new Error(t("identity.uploadFailed"))
            }

            // Step 3 — verify + set on the group
            let ref
            try {
                ref = await verifyGroupMedia(groupId, { kind, storageKey: presign.storageKey })
            } catch {
                throw new Error(t("identity.verifyFailed"))
            }

            await mutate(groupHeaderKey(groupId))
            return ref.url
        },
        [groupId, mutate, t],
    )

    return { upload }
}
