"use client"

import { create } from "zustand"

/** First-party cookie that persists the visitor's choice. */
const CONSENT_COOKIE = "starci-cookie-consent"
/** Remember the choice for a year. */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Persisted shape of the consent cookie. `necessary` is implicit (always on). */
interface ConsentValue {
    analytics: boolean
}

/** Read the consent cookie (client only); null when absent / unreadable. */
const readConsentCookie = (): ConsentValue | null => {
    if (typeof document === "undefined") {
        return null
    }
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))
    if (!match) {
        return null
    }
    try {
        const raw = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1))
        const parsed = JSON.parse(raw) as Partial<ConsentValue>
        return { analytics: Boolean(parsed.analytics) }
    } catch {
        return null
    }
}

/** Persist the consent cookie (client only). */
const writeConsentCookie = (value: ConsentValue): void => {
    if (typeof document === "undefined") {
        return
    }
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `${CONSENT_COOKIE}=${encoded}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
}

/**
 * Cookie-consent store (GDPR / VN PDPD). Holds the visitor's committed choice and
 * exposes the imperative commits used by the banner + preferences modal. The
 * choice is persisted in a first-party cookie (`starci-cookie-consent`) read once
 * via {@link CookieConsentStoreState.hydrate}; analytics scripts are gated on
 * `decided && analyticsAllowed` (see AnalyticsGate), so nothing loads before an
 * affirmative choice. `decided` starts `null` so the banner / GA render nothing
 * pre-hydration (no SSR mismatch).
 */
interface CookieConsentStoreState {
    /** null = not hydrated yet, false = no choice made (show banner), true = decided. */
    decided: boolean | null
    /** Whether the visitor allowed analytics cookies. */
    analyticsAllowed: boolean
    /** Read the persisted choice once (idempotent — no-op after the first decision). */
    hydrate: () => void
    /** Accept every category. */
    acceptAll: () => void
    /** Reject every optional category (necessary stays on). */
    rejectAll: () => void
    /** Commit a granular choice from the preferences modal. */
    save: (analyticsAllowed: boolean) => void
}

/** Shared cookie-consent store. */
export const useCookieConsentStore = create<CookieConsentStoreState>((set, get) => {
    const commit = (analyticsAllowed: boolean) => {
        writeConsentCookie({ analytics: analyticsAllowed })
        set({ decided: true, analyticsAllowed })
    }
    return {
        decided: null,
        analyticsAllowed: false,
        hydrate: () => {
            if (get().decided !== null) {
                return
            }
            const stored = readConsentCookie()
            set(
                stored
                    ? { decided: true, analyticsAllowed: stored.analytics }
                    : { decided: false, analyticsAllowed: false },
            )
        },
        acceptAll: () => commit(true),
        rejectAll: () => commit(false),
        save: (analyticsAllowed) => commit(analyticsAllowed),
    }
})
