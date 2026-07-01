"use client"

import React, { useEffect } from "react"
import {
    Button,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { StickyBottomBar } from "@/components/blocks/layout/StickyBottomBar"
import { useCookieConsentStore } from "@/hooks/zustand/cookieConsent/store"
import { useCookiePreferencesOverlayState } from "@/hooks/zustand/overlay/hooks"

/**
 * Cookie consent banner — the non-blocking bottom bar shown until the visitor makes a choice.
 *
 * Reads the committed consent from {@link useCookieConsentStore}; renders only while `decided === false`
 * (hidden during pre-hydration `null` and once decided `true`). Buttons keep parity (Accept / Reject are
 * equal-size real buttons — GDPR/PDPD: reject must be as easy as accept); "Tùy chỉnh" opens the granular
 * preferences modal. Mounted once globally in `InnerLayout`. `"use client"` for the store + i18n.
 */
export const CookieConsentBanner = () => {
    const t = useTranslations()
    const decided = useCookieConsentStore((state) => state.decided)
    const hydrate = useCookieConsentStore((state) => state.hydrate)
    const acceptAll = useCookieConsentStore((state) => state.acceptAll)
    const rejectAll = useCookieConsentStore((state) => state.rejectAll)
    const preferences = useCookiePreferencesOverlayState()

    // read the consent cookie once on mount (idempotent in the store)
    useEffect(() => {
        hydrate()
    }, [hydrate])

    // null = not hydrated yet, true = already decided → render nothing
    if (decided !== false) {
        return null
    }

    return (
        <StickyBottomBar>
            <div
                role="region"
                aria-label={t("cookieConsent.title")}
                className="mx-auto flex max-w-[1280px] flex-col gap-3 sm:flex-row sm:items-center"
            >
                <Typography type="body-sm" color="muted" className="flex-1">
                    {t("cookieConsent.body")}
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="primary" size="sm" onPress={acceptAll}>
                        {t("cookieConsent.acceptAll")}
                    </Button>
                    <Button variant="secondary" size="sm" onPress={rejectAll}>
                        {t("cookieConsent.reject")}
                    </Button>
                    <Button variant="tertiary" size="sm" onPress={preferences.open}>
                        {t("cookieConsent.customize")}
                    </Button>
                </div>
            </div>
        </StickyBottomBar>
    )
}
