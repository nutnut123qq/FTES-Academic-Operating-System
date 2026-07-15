"use client"

import useSWR from "swr"
import {
    getMyCertificates,
    type CertificateView,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link getMyCertificates}.
 *
 * `GET /courses/me/certificates` is a signed-in-only endpoint, so pass
 * `enabled: false` (e.g. for guests) to skip the request entirely.
 */
export const useGetMyCertificatesSwr = (enabled = true) => {
    const swr = useSWR<Array<CertificateView>, Error>(
        enabled ? "GET_MY_CERTIFICATES_SWR" : null,
        () => getMyCertificates(),
    )

    return swr
}
