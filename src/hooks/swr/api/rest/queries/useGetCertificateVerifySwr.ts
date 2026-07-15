"use client"

import useSWR from "swr"
import {
    verifyCertificate,
    type CertificateVerifyView,
} from "@/modules/api/rest/course"

/**
 * SWR query wrapper for {@link verifyCertificate} (public, no login).
 *
 * Keyed per code; retry disabled so a not-found code fails fast instead of
 * hammering the rate-limited public endpoint (30 req/min/IP on the BE).
 */
export const useGetCertificateVerifySwr = (code: string) => {
    const swr = useSWR<CertificateVerifyView, Error>(
        code ? ["GET_CERTIFICATE_VERIFY_SWR", code] : null,
        () => verifyCertificate(code),
        { shouldRetryOnError: false },
    )

    return swr
}
