"use client"

import React, { useEffect } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"
import { useCookieConsentStore } from "@/hooks/zustand/cookieConsent/store"

/** Props for {@link AnalyticsGate}. */
export interface AnalyticsGateProps {
    /** GA4 Measurement Id (already gated on being configured by the caller). */
    gaId: string
}

/**
 * Consent gate for Google Analytics — renders the GA tag ONLY after the visitor has affirmatively
 * allowed analytics ({@link useCookieConsentStore} `decided && analyticsAllowed`). Until then nothing is
 * injected, so the script is blocked before consent (GDPR / VN PDPD), not merely "loaded but inactive".
 * Replaces the unconditional `<GoogleAnalytics>` in the locale layout. `"use client"` for the store.
 *
 * @param props - {@link AnalyticsGateProps}
 */
export const AnalyticsGate = ({ gaId }: AnalyticsGateProps) => {
    const decided = useCookieConsentStore((state) => state.decided)
    const analyticsAllowed = useCookieConsentStore((state) => state.analyticsAllowed)
    const hydrate = useCookieConsentStore((state) => state.hydrate)

    useEffect(() => {
        hydrate()
    }, [hydrate])

    if (decided !== true || !analyticsAllowed) {
        return null
    }
    return <GoogleAnalytics gaId={gaId} />
}
