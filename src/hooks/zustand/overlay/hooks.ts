"use client"

import { useCallback } from "react"
import { useOverlayStore, type OverlayKey, type FollowListContext } from "./store"
import type { PaymentContext } from "@/modules/types/payment"
import type { QueryActiveAdvertisementData } from "@/modules/api/graphql/queries/types/active-advertisement"

/**
 * Return shape of an overlay accessor — matches HeroUI's `UseOverlayStateReturn`
 * (`useOverlayState`) exactly so existing consumers need no changes.
 */
export interface OverlayStateHandle {
    /** Whether the overlay is open. */
    readonly isOpen: boolean
    /** Set the open state (used by `onOpenChange`). */
    setOpen: (isOpen: boolean) => void
    /** Open the overlay. */
    open: () => void
    /** Close the overlay. */
    close: () => void
    /** Toggle the open state. */
    toggle: () => void
}

/**
 * Factory: builds an overlay handle for one key, subscribing via selector to `openMap[key]` so it
 * only re-renders when that overlay changes. Actions come from the store (stable refs) and are
 * wrapped in `useCallback` to keep a fixed identity across renders.
 * @param key - the overlay identifier.
 * @returns a handle matching the HeroUI shape.
 */
const useOverlayHandle = (key: OverlayKey): OverlayStateHandle => {
    const isOpen = useOverlayStore((state) => state.openMap[key])
    const setOpenFor = useOverlayStore((state) => state.setOpenFor)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const closeOverlay = useOverlayStore((state) => state.closeOverlay)
    const toggleOverlay = useOverlayStore((state) => state.toggleOverlay)
    const setOpen = useCallback((next: boolean) => setOpenFor(key, next), [setOpenFor, key])
    const open = useCallback(() => openOverlay(key), [openOverlay, key])
    const close = useCallback(() => closeOverlay(key), [closeOverlay, key])
    const toggle = useCallback(() => toggleOverlay(key), [toggleOverlay, key])
    return { isOpen, setOpen, open, close, toggle }
}

/** Account menu overlay state. */
export const useAccountMenuOverlayState = () => useOverlayHandle("accountMenu")
/** AI processing overlay state. */
export const useAIProcessingOverlayState = () => useOverlayHandle("aiProcessing")
/** AI quota overlay state. */
export const useAiQuotaOverlayState = () => useOverlayHandle("aiQuota")
/** Authentication overlay state. */
export const useAuthenticationOverlayState = () => useOverlayHandle("authentication")
/** Avatar-upload modal overlay state (edit-profile avatar dropzone). */
export const useAvatarUploadOverlayState = () => useOverlayHandle("avatarUpload")
/** Challenge overlay state. */
export const useChallengeOverlayState = () => useOverlayHandle("challenge")
/** Content overlay state. */
export const useContentOverlayState = () => useOverlayHandle("content")
/** Content AI chat drawer overlay state (ask StarCi AI about the current content). */
export const useContentAiChatOverlayState = () => useOverlayHandle("contentAiChat")
/** Content AI settings modal overlay state (model picker + clear history). */
export const useContentAiSettingsOverlayState = () => useOverlayHandle("contentAiSettings")
/** Cookie preferences modal overlay state ("Tùy chỉnh" granular cookie consent). */
export const useCookiePreferencesOverlayState = () => useOverlayHandle("cookiePreferences")
/** CV preview overlay state. */
export const useCvPreviewOverlayState = () => useOverlayHandle("cvPreview")
/** CV review level details overlay state. */
export const useCvReviewLevelDetailsOverlayState = () => useOverlayHandle("cvReviewLevelDetails")
/** CV submission attempts drawer overlay state. */
export const useCvSubmissionAttemptsDrawerOverlayState = () => useOverlayHandle("cvSubmissionAttemptsDrawer")
/** CV update overlay state. */
export const useCvUpdateOverlayState = () => useOverlayHandle("cvUpdate")
/** E2E-result drawer overlay state (lesson footer proof panel). */
export const useE2eResultOverlayState = () => useOverlayHandle("e2eResult")
/** Feedback details overlay state. */
export const useFeedbackDetailsOverlayState = () => useOverlayHandle("feedbackDetails")
/** Foundation overlay state. */
export const useFoundationOverlayState = () => useOverlayHandle("foundation")
/** Headhunter overlay state. */
export const useHeadhunterOverlayState = () => useOverlayHandle("headhunter")
/** Language overlay state. */
export const useLanguageOverlayState = () => useOverlayHandle("language")
/** Lesson video overlay state. */
export const useLessonVideoOverlayState = () => useOverlayHandle("lessonVideo")
/** Link GitHub overlay state. */
export const useLinkGithubOverlayState = () => useOverlayHandle("linkGithub")
/** Livestream calendar overlay state. */
export const useLivestreamCalendarOverlayState = () => useOverlayHandle("livestreamCalendar")
/**
 * Payment overlay state — UNLIKE the other overlays: it carries a {@link PaymentContext} payload.
 * `open(context)` stashes the payload then opens (one modal serves multiple flows: course enroll /
 * AI subscription); the modal reads `context` to pick the mutation. Overrides the base handle's
 * `open` to accept the payload.
 * @returns the overlay handle (`isOpen`, `setOpen`, `close`, `toggle`) plus `context` and `open(context)`.
 */
export const usePaymentOverlayState = () => {
    const base = useOverlayHandle("payment")
    const context = useOverlayStore((state) => state.paymentContext)
    const setPaymentContext = useOverlayStore((state) => state.setPaymentContext)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(
        (next: PaymentContext) => {
            setPaymentContext(next)
            openOverlay("payment")
        },
        [setPaymentContext, openOverlay],
    )
    return { ...base, open, context }
}
/**
 * Interstitial ad modal overlay state.
 *
 * Overrides `open` to accept the active ad and stashes it so the global modal (mounted in
 * `ModalContainer`) can render it.
 * @returns the overlay handle plus `context` (the ad) and `open(ad)`.
 */
export const useAdModalOverlayState = () => {
    const base = useOverlayHandle("adModal")
    const context = useOverlayStore((state) => state.adModalContext)
    const setContext = useOverlayStore((state) => state.setAdModalContext)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(
        (next: QueryActiveAdvertisementData) => {
            setContext(next)
            openOverlay("adModal")
        },
        [setContext, openOverlay],
    )
    return { ...base, open, context }
}

/**
 * Follow-list modal overlay state. Like {@link useAdModalOverlayState}, overrides
 * `open` to accept a {@link FollowListContext} (whose graph + which tab) and
 * stashes it so the global modal (mounted in `ModalContainer`) can render it.
 * @returns the overlay handle plus `context` and `open(context)`.
 */
export const useFollowListOverlayState = () => {
    const base = useOverlayHandle("followList")
    const context = useOverlayStore((state) => state.followListContext)
    const setContext = useOverlayStore((state) => state.setFollowListContext)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(
        (next: FollowListContext) => {
            setContext(next)
            openOverlay("followList")
        },
        [setContext, openOverlay],
    )
    return { ...base, open, context }
}

/** Personal project task attempts drawer overlay state. */
export const usePersonalProjectTaskAttemptsDrawerOverlayState = () => useOverlayHandle("personalProjectTaskAttemptsDrawer")
/** Manage-pinned-projects modal overlay state (profile owner only). */
export const usePinnedProjectsOverlayState = () => useOverlayHandle("pinnedProjects")
/** Premium gate overlay state. */
export const usePremiumGateOverlayState = () => useOverlayHandle("premiumGate")
/** Search overlay state. */
export const useSearchOverlayState = () => useOverlayHandle("search")
/** Share overlay state. */
export const useShareOverlayState = () => useOverlayHandle("share")
/** Submission attempts overlay state. */
export const useSubmissionAttemptsOverlayState = () => useOverlayHandle("submissionAttempts")

/**
 * Shared content-AI model selection — the chat composer and the settings modal
 * read/write the same selected model so both dropdowns stay in sync.
 * @returns the selected model and its setter.
 */
export const useContentAiSelectedModel = (): {
    readonly selectedModel: string | null
    setSelectedModel: (model: string | null) => void
} => {
    const selectedModel = useOverlayStore((state) => state.contentAiSelectedModel)
    const setSelectedModel = useOverlayStore((state) => state.setContentAiSelectedModel)
    return { selectedModel, setSelectedModel }
}

/**
 * Content-AI "history cleared" signal — the settings modal bumps the nonce after
 * clearing the saved conversation; the chat watches it to reset its live thread.
 * @returns the current nonce and a function to bump it.
 */
export const useContentAiClearSignal = (): {
    readonly clearNonce: number
    signalCleared: () => void
} => {
    const clearNonce = useOverlayStore((state) => state.contentAiClearNonce)
    const signalCleared = useOverlayStore((state) => state.signalContentAiCleared)
    return { clearNonce, signalCleared }
}

/**
 * Highlighted lesson passage the learner wants to ask about — set by the
 * "ask AI about this passage" floating button, read by the chat composer to
 * scope the next question. Cleared after the question is sent or the chat closes.
 * @returns the selected passage and its setter.
 */
export const useContentAiSelection = (): {
    readonly selection: string | null
    readonly selectionContext: string | null
    setSelection: (passage: string | null, context?: string | null) => void
} => {
    const selection = useOverlayStore((state) => state.contentAiSelection)
    const selectionContext = useOverlayStore((state) => state.contentAiSelectionContext)
    const setSelection = useOverlayStore((state) => state.setContentAiSelection)
    return { selection, selectionContext, setSelection }
}
