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
 * The post being quoted/reposted, carried into the community composer so it can
 * render the embedded quoted-post card and share it (C-1
 * `POST /community/posts/{id}/shares`). A minimal serializable snapshot of the
 * feed card — never a live node.
 */
export interface CommunityQuoteContext {
    id: string
    author: string
    authorUsername: string
    title: string
    snippet: string
}

/**
 * Payload for the community photo lightbox: which post's photos to view, the
 * ordered image attachments (a serializable snapshot — never a live node), and
 * which one was clicked. The modal's LEFT pane navigates `media`; the RIGHT pane
 * fetches the full post by `postId`.
 */
export interface CommunityPhotoContext {
    /** Id of the post whose photos are being viewed (drives the right-pane fetch). */
    postId: string
    /** The post's image attachments in server order (re-filtered to IMAGE by the modal). */
    media: Array<{ id: string; storageKey: string; mediaType: string }>
    /** Index (within `media`) of the image the viewer clicked to open the lightbox. */
    startIndex: number
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
 * One turn in the lesson-scoped content-AI conversation.
 *
 * Lives in the STORE rather than in `ContentAiChat`'s local state because the popover /
 * bottom-sheet that hosts the chat UNMOUNTS on every close (click-outside, Escape, the
 * mascot toggle) — component state would throw the whole thread away each time.
 */
export interface ContentAiMessage {
    /** Who spoke. */
    role: "user" | "assistant"
    /** The message text (assistant content may be markdown; a user turn carries the grounding block). */
    content: string
    /** What to show in the bubble (user turns hide the prepended quote context). */
    display: string
    /** Model that served this assistant answer (from the SSE `done` event); rendered as a caption. */
    modelUsed?: string
}

/**
 * The content-AI conversation for ONE lesson: the thread, the unsent composer draft, the
 * lazily-created TUTOR_CHAT session id, and whether an answer is currently streaming.
 *
 * `contentId` is the lesson the conversation BELONGS TO, and doubles as the reset guard:
 * everything survives closing/reopening the panel and is discarded only when the learner
 * opens a DIFFERENT lesson (see {@link OverlayStoreState.syncContentAiLesson}).
 *
 * Memory only — deliberately NOT persisted: the owner asked for "the session", not across
 * reloads.
 */
export interface ContentAiConversation {
    /** Lesson the conversation belongs to (`null` = none claimed yet). */
    contentId: string | null
    /** The thread, oldest turn first. */
    messages: Array<ContentAiMessage>
    /** Unsent composer text — preserved across closes exactly like the thread. */
    draft: string
    /** Reused TUTOR_CHAT session id, created lazily on the first send. */
    sessionId: string | null
    /** Whether an answer is streaming right now (a stream OUTLIVES the panel — see the chat). */
    isStreaming: boolean
}

/** An empty conversation — the initial value, and what a FOREIGN lesson reads as. */
export const EMPTY_CONTENT_AI_CONVERSATION: ContentAiConversation = {
    contentId: null,
    messages: [],
    draft: "",
    sessionId: null,
    isStreaming: false,
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
    | "authentication"
    | "challenge"
    | "communityComposer"
    | "communityLiveChat"
    | "communityPhoto"
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
    "authentication",
    "challenge",
    "communityComposer",
    "communityLiveChat",
    "communityPhoto",
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
    /** Post being quoted/reposted in the community composer (null for a plain compose). */
    communityComposerQuote: CommunityQuoteContext | null
    /** Community photo lightbox payload (which post + images + start index). */
    communityPhotoContext: CommunityPhotoContext | null
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
    /** Lesson-scoped content-AI conversation (thread + draft + session id + streaming flag),
     * held here so closing the chat panel — which UNMOUNTS it — never destroys it. */
    contentAiConversation: ContentAiConversation
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
    /** Stash (or clear) the post being quoted/reposted in the composer. */
    setCommunityComposerQuote: (context: CommunityQuoteContext | null) => void
    /** Stash the community photo lightbox payload. */
    setCommunityPhotoContext: (context: CommunityPhotoContext | null) => void
    /** Set the content-AI selected model. */
    setContentAiSelectedModel: (model: string | null) => void
    /** Signal the chat thread to reset (after the settings modal clears the saved history). */
    signalContentAiCleared: () => void
    /** Set (or clear) the highlighted passage + its surrounding context (hidden grounding). */
    setContentAiSelection: (passage: string | null, context?: string | null) => void
    /** Set (or clear) the selection rect the desktop anchored AI panel anchors to. */
    setContentAiAnchorRect: (rect: AnchorRect | null) => void
    /**
     * Point the stored conversation at `contentId`, DISCARDING it when it belongs to a
     * different lesson. This is the one and only clear-the-chat rule.
     *
     * The "previous lesson" it compares against is the one the CONVERSATION carries, held in
     * the store — never a component ref. That is what makes this safe to call from a surface
     * that remounts on every open (the chat popover/drawer does): a remount calls it again
     * with the SAME `contentId` and takes the no-op branch, so it can NOT clear on mount.
     * A `useRef` previous-value would be wiped by that same remount, and a plain
     * reset-on-mount effect would eat the thread every time the panel opened — exactly the
     * bug this replaces (rules ai-selection-anchored-ask-passage /
     * content-ai-multi-session-conversations).
     * @returns whether a conversation was actually discarded.
     */
    syncContentAiLesson: (contentId: string | null) => boolean
    /**
     * Patch the conversation, but ONLY while it still belongs to `contentId`.
     *
     * A stream OUTLIVES the panel (closing the chat does not abort it), so a late `onDelta` /
     * `onDone` can land after the learner has already moved on. Scoping every write to the
     * lesson it was started for drops those instead of polluting the next lesson's fresh thread.
     */
    updateContentAiConversation: (
        contentId: string | null,
        update: (previous: ContentAiConversation) => Partial<ContentAiConversation>,
    ) => void
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
export const useOverlayStore = create<OverlayStoreState>((set, get) => ({
    openMap: buildInitialOpenMap(),
    authenticationContext: null,
    paymentContext: null,
    adModalContext: null,
    followListContext: null,
    communityComposerQuote: null,
    communityPhotoContext: null,
    contentAiSelectedModel: null,
    contentAiClearNonce: 0,
    contentAiSelection: null,
    contentAiSelectionContext: null,
    contentAiAnchorRect: null,
    contentAiConversation: EMPTY_CONTENT_AI_CONVERSATION,
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
    setCommunityComposerQuote: (context) => set({ communityComposerQuote: context }),
    setCommunityPhotoContext: (context) => set({ communityPhotoContext: context }),
    setContentAiSelectedModel: (model) => set({ contentAiSelectedModel: model }),
    signalContentAiCleared: () =>
        set((state) => ({ contentAiClearNonce: state.contentAiClearNonce + 1 })),
    setContentAiSelection: (passage, context) => set({
        contentAiSelection: passage,
        contentAiSelectionContext: passage ? (context ?? null) : null,
    }),
    setContentAiAnchorRect: (rect) => set({ contentAiAnchorRect: rect }),
    syncContentAiLesson: (contentId) => {
        // Same lesson (including EVERY remount of the panel) → keep the conversation.
        if (get().contentAiConversation.contentId === contentId) {
            return false
        }
        set({ contentAiConversation: { ...EMPTY_CONTENT_AI_CONVERSATION, contentId } })
        return true
    },
    updateContentAiConversation: (contentId, update) =>
        set((state) => {
            const previous = state.contentAiConversation
            // a write for a lesson the learner already left is dropped, not applied
            if (previous.contentId !== contentId) {
                return {}
            }
            return { contentAiConversation: { ...previous, ...update(previous) } }
        }),
}))
