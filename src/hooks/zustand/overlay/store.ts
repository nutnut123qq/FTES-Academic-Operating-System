"use client"

import { create } from "zustand"
import type { PaymentContext } from "@/modules/types/payment"
import type { QueryActiveAdvertisementData } from "@/modules/api/graphql/queries/types/active-advertisement"

/** Which side of the follow graph the follow-list modal opens on. */
export type FollowListTab = "followers" | "following"

/** Payload for the follow-list modal: whose graph + which tab to open on. */
export interface FollowListContext {
    /** Username of the profile whose follow graph to show. */
    username: string
    /** Tab to open on (followers vs following). */
    tab: FollowListTab
}

/**
 * Serializable snapshot of a selection rect (viewport coordinates), captured
 * BEFORE the browser selection is cleared. Drives where the desktop
 * selection-anchored AI panel is placed (right of the rect → flip left → under).
 * A plain object (not a live `DOMRect`) so it lives safely in the store.
 */
export interface AnchorRect {
    top: number
    left: number
    right: number
    bottom: number
    width: number
    height: number
}

/**
 * Identifier for each overlay (modal/drawer/popover) in the app. Each key holds an independent
 * open state in {@link useOverlayStore}.
 */
export type OverlayKey =
    | "accountMenu"
    | "adModal"
    | "aiProcessing"
    | "avatarUpload"
    | "aiQuota"
    | "appearance"
    | "authentication"
    | "challenge"
    | "communityComposer"
    | "content"
    | "contentAiChat"
    | "contentAiAnchored"
    | "contentAiSettings"
    | "cookiePreferences"
    | "cvPreview"
    | "cvReviewLevelDetails"
    | "cvSubmissionAttemptsDrawer"
    | "cvUpdate"
    | "e2eResult"
    | "feedbackDetails"
    | "followList"
    | "foundation"
    | "headhunter"
    | "language"
    | "lessonVideo"
    | "linkGithub"
    | "livestreamCalendar"
    | "miniCart"
    | "payment"
    | "personalProjectTaskAttemptsDrawer"
    | "pinnedProjects"
    | "premiumGate"
    | "search"
    | "share"
    | "submissionAttempts"

/** Every key — used to build the initial state (all overlays default to closed). */
const OVERLAY_KEYS: ReadonlyArray<OverlayKey> = [
    "accountMenu",
    "adModal",
    "aiProcessing",
    "avatarUpload",
    "aiQuota",
    "appearance",
    "authentication",
    "challenge",
    "communityComposer",
    "content",
    "contentAiChat",
    "contentAiAnchored",
    "contentAiSettings",
    "cookiePreferences",
    "cvPreview",
    "cvReviewLevelDetails",
    "cvSubmissionAttemptsDrawer",
    "cvUpdate",
    "e2eResult",
    "feedbackDetails",
    "followList",
    "foundation",
    "headhunter",
    "language",
    "lessonVideo",
    "linkGithub",
    "livestreamCalendar",
    "miniCart",
    "payment",
    "personalProjectTaskAttemptsDrawer",
    "pinnedProjects",
    "premiumGate",
    "search",
    "share",
    "submissionAttempts",
]

/** Overlay store shape: the open map plus per-key actions. */
interface OverlayStoreState {
    /** openMap[key] = whether that overlay is open. */
    openMap: Record<OverlayKey, boolean>
    /** Authentication modal context message — an i18n KEY (serializable string) describing why
     * sign-in is needed (e.g. `auth.context.enroll`), set by the `useRequireAuth` guard and
     * rendered above the active section; cleared when the modal closes. */
    authenticationContext: string | null
    /** Payment overlay payload (flow + tier) — the modal reads it to pick the mutation. */
    paymentContext: PaymentContext | null
    /** Interstitial ad modal payload (the active ad to render). */
    adModalContext: QueryActiveAdvertisementData | null
    /** Follow-list modal payload (whose graph + which tab). */
    followListContext: FollowListContext | null
    /** Content-AI selected model — shared between the chat composer + the settings modal. */
    contentAiSelectedModel: string | null
    /** Bumped by the settings modal after clearing history → signals the chat to reset its thread. */
    contentAiClearNonce: number
    /** Lesson passage the learner highlighted to ask about ("ask AI about this passage"). */
    contentAiSelection: string | null
    /** Surrounding context of the highlighted passage (the containing paragraph) —
     * sent to the model as HIDDEN grounding so it can reason about a short selection,
     * NOT shown in the chat thread. */
    contentAiSelectionContext: string | null
    /** Snapshot of the selection rect the desktop anchored AI panel is placed against
     * (captured before the browser selection is cleared). Null when no anchored panel. */
    contentAiAnchorRect: AnchorRect | null
    /** Stash (or clear) the authentication modal context message key. */
    setAuthenticationContext: (context: string | null) => void
    /** Set the open state of an overlay (used by `onOpenChange`). */
    setOpenFor: (key: OverlayKey, isOpen: boolean) => void
    /** Open an overlay. */
    openOverlay: (key: OverlayKey) => void
    /** Close an overlay. */
    closeOverlay: (key: OverlayKey) => void
    /** Toggle an overlay. */
    toggleOverlay: (key: OverlayKey) => void
    /** Stash the payment overlay payload. */
    setPaymentContext: (context: PaymentContext | null) => void
    /** Stash the interstitial ad modal payload. */
    setAdModalContext: (context: QueryActiveAdvertisementData | null) => void
    /** Stash the follow-list modal payload. */
    setFollowListContext: (context: FollowListContext | null) => void
    /** Set the content-AI selected model. */
    setContentAiSelectedModel: (model: string | null) => void
    /** Signal the chat thread to reset (after the settings modal clears the saved history). */
    signalContentAiCleared: () => void
    /** Set (or clear) the highlighted passage + its surrounding context (hidden grounding). */
    setContentAiSelection: (passage: string | null, context?: string | null) => void
    /** Set (or clear) the selection rect the desktop anchored AI panel anchors to. */
    setContentAiAnchorRect: (rect: AnchorRect | null) => void
}

/** Initial open map — every overlay closed. */
const buildInitialOpenMap = (): Record<OverlayKey, boolean> =>
    OVERLAY_KEYS.reduce(
        (acc, key) => {
            acc[key] = false
            return acc
        },
        {} as Record<OverlayKey, boolean>,
    )

/**
 * Single Zustand store for all overlay state (replaces the old `OverlayStateContext`).
 *
 * Each overlay is a boolean in `openMap`; a component subscribes via a selector to its own key
 * (see the `useXxxOverlayState` accessors), so opening one overlay does NOT re-render consumers of
 * other overlays — unlike the old mega-context (changing one re-rendered all 25). Actions are
 * stable references (never change), so selecting an action never triggers a re-render.
 */
export const useOverlayStore = create<OverlayStoreState>((set) => ({
    openMap: buildInitialOpenMap(),
    authenticationContext: null,
    paymentContext: null,
    adModalContext: null,
    followListContext: null,
    contentAiSelectedModel: null,
    contentAiClearNonce: 0,
    contentAiSelection: null,
    contentAiSelectionContext: null,
    contentAiAnchorRect: null,
    setOpenFor: (key, isOpen) =>
        set((state) => ({ openMap: { ...state.openMap, [key]: isOpen } })),
    openOverlay: (key) =>
        set((state) => ({ openMap: { ...state.openMap, [key]: true } })),
    closeOverlay: (key) =>
        set((state) => ({ openMap: { ...state.openMap, [key]: false } })),
    toggleOverlay: (key) =>
        set((state) => ({ openMap: { ...state.openMap, [key]: !state.openMap[key] } })),
    setAuthenticationContext: (context) => set({ authenticationContext: context }),
    setPaymentContext: (context) => set({ paymentContext: context }),
    setAdModalContext: (context) => set({ adModalContext: context }),
    setFollowListContext: (context) => set({ followListContext: context }),
    setContentAiSelectedModel: (model) => set({ contentAiSelectedModel: model }),
    signalContentAiCleared: () =>
        set((state) => ({ contentAiClearNonce: state.contentAiClearNonce + 1 })),
    setContentAiSelection: (passage, context) => set({
        contentAiSelection: passage,
        contentAiSelectionContext: passage ? (context ?? null) : null,
    }),
    setContentAiAnchorRect: (rect) => set({ contentAiAnchorRect: rect }),
}))
