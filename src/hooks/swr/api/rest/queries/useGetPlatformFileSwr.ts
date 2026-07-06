"use client"

import useSWR from "swr"
import { getPlatformFile, type PlatformFileView } from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link getPlatformFile}.
 */
export const useGetPlatformFileSwr = (fileId: string) => {
    const swr = useSWR<PlatformFileView, Error>(
        ["GET_PLATFORM_FILE_SWR", fileId],
        () => getPlatformFile(fileId),
    )

    return swr
}
