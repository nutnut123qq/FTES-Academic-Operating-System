"use client"

import { useCallback, useEffect } from "react"
import {
    useOverlayStore,
    EMPTY_CONTENT_AI_CONVERSATION,
    type OverlayKey,
    type FollowListContext,
    type CommunityQuoteContext,
    type CommunityPhotoContext,
    type SessionRevokeContext,
    type AnchorRect,
    type ContentAiMessage,
} from "./store"
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
/**
 * Authentication overlay state — the base handle plus an optional CONTEXT MESSAGE key.
 *
 * `open(contextKey?)` stays backward-compatible with the plain `open()` callers (account
 * menu, legacy shell, feature gates): with no argument it clears any stale context; the
 * `useRequireAuth` guard passes an i18n key (e.g. `auth.context.like`) so the modal can
 * explain WHY sign-in is needed. The modal reads `context` and clears it on close via
 * `setContext(null)`.
 * @returns the overlay handle plus `context` and `setContext`.
 */
export const useAuthenticationOverlayState = () => {
    const base = useOverlayHandle("authentication")
    const context = useOverlayStore((state) => state.authenticationContext)
    const setContext = useOverlayStore((state) => state.setAuthenticationContext)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(
        (contextKey?: string) => {
            setContext(typeof contextKey === "string" ? contextKey : null)
            openOverlay("authentication")
        },
        [setContext, openOverlay],
    )
    return { ...base, open, context, setContext }
}
/** Avatar-upload modal overlay state (edit-profile avatar dropzone). */
export const useAvatarUploadOverlayState = () => useOverlayHandle("avatarUpload")
/** Challenge overlay state. */
export const useChallengeOverlayState = () => useOverlayHandle("challenge")
/**
 * Community composer modal overlay state (feed "Có gì mới?" trigger).
 *
 * `open()` starts a plain compose and CLEARS any stale quote; `openQuote(post)`
 * opens the composer in repost/quote mode with the embedded post (C-1). The
 * composer reads `quote` to render the quoted-post card and route submit to
 * `sharePost`, and clears it via `setQuote(null)` after a successful share.
 * @returns the overlay handle plus `openQuote`, `quote`, and `setQuote`.
 */
export const useCommunityComposerOverlayState = () => {
    const base = useOverlayHandle("communityComposer")
    const quote = useOverlayStore((state) => state.communityComposerQuote)
    const setQuote = useOverlayStore((state) => state.setCommunityComposerQuote)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(() => {
        setQuote(null)
        openOverlay("communityComposer")
    }, [setQuote, openOverlay])
    const openQuote = useCallback(
        (context: CommunityQuoteContext) => {
            setQuote(context)
            openOverlay("communityComposer")
        },
        [setQuote, openOverlay],
    )
    return { ...base, open, openQuote, quote, setQuote }
}
/**
 * Community photo lightbox overlay state (Facebook-style photo viewer). Like
 * {@link useFollowListOverlayState}, overrides `open` to accept a
 * {@link CommunityPhotoContext} (which post + its images + the clicked index)
 * and stashes it so the global modal (mounted in `ModalContainer`) can render
 * the image pane + the post's comment thread.
 * @returns the overlay handle plus `context` and `open(context)`.
 */
export const useCommunityPhotoOverlayState = () => {
    const base = useOverlayHandle("communityPhoto")
    const context = useOverlayStore((state) => state.communityPhotoContext)
    const setContext = useOverlayStore((state) => state.setCommunityPhotoContext)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(
        (next: CommunityPhotoContext) => {
            setContext(next)
            openOverlay("communityPhoto")
        },
        [setContext, openOverlay],
    )
    return { ...base, open, context }
}
/** Community live-chat floating panel overlay state (< xl; the SSE + heartbeat run while open). */
export const useCommunityLiveChatOverlayState = () => useOverlayHandle("communityLiveChat")
/** Content overlay state. */
export const useContentOverlayState = () => useOverlayHandle("content")
/** Content AI chat drawer overlay state (ask FTES AOS AI about the current content). */
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
/** Mini-cart drawer overlay state (nav cart button → slide-out cart preview). */
export const useMiniCartOverlayState = () => useOverlayHandle("miniCart")
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

/**
 * Desktop selection-anchored AI panel overlay state. Like {@link useAdModalOverlayState},
 * overrides `open` to accept the {@link AnchorRect} snapshot (captured before the browser
 * selection is cleared) so the panel can place itself next to the highlighted passage.
 * `close` also clears the stored rect. Mobile keeps the FAB bottom-sheet (`contentAiChat`).
 * @returns the overlay handle plus `anchorRect`, `open(rect)`, and a rect-clearing `close()`.
 */
export const useContentAiAnchoredPanel = () => {
    const base = useOverlayHandle("contentAiAnchored")
    const anchorRect = useOverlayStore((state) => state.contentAiAnchorRect)
    const setAnchorRect = useOverlayStore((state) => state.setContentAiAnchorRect)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const closeOverlay = useOverlayStore((state) => state.closeOverlay)
    const open = useCallback(
        (rect: AnchorRect) => {
            setAnchorRect(rect)
            openOverlay("contentAiAnchored")
        },
        [setAnchorRect, openOverlay],
    )
    const close = useCallback(() => {
        closeOverlay("contentAiAnchored")
        setAnchorRect(null)
    }, [closeOverlay, setAnchorRect])
    return { ...base, open, close, anchorRect }
}

/** Personal project task attempts drawer overlay state. */
export const usePersonalProjectTaskAttemptsDrawerOverlayState = () => useOverlayHandle("personalProjectTaskAttemptsDrawer")
/** Manage-pinned-projects modal overlay state (profile owner only). */
export const usePinnedProjectsOverlayState = () => useOverlayHandle("pinnedProjects")
/** Premium gate overlay state. */
export const usePremiumGateOverlayState = () => useOverlayHandle("premiumGate")
/** Search overlay state. */
export const useSearchOverlayState = () => useOverlayHandle("search")
/**
 * Security-settings "sign this device out" confirm overlay.
 *
 * Like {@link useFollowListOverlayState}, overrides `open` to take a
 * {@link SessionRevokeContext} — a serializable descriptor of WHICH sign-out is being
 * confirmed (one session, or every session but this one). The global modal (mounted in
 * `ModalContainer`) reads it and owns the revoke mutation, so the device list never
 * hand-rolls a `useState` dialog nor stashes a callback in the store.
 * @returns the overlay handle plus `context` and `open(context)`.
 */
export const useSessionRevokeOverlayState = () => {
    const base = useOverlayHandle("sessionRevoke")
    const context = useOverlayStore((state) => state.sessionRevokeContext)
    const setContext = useOverlayStore((state) => state.setSessionRevokeContext)
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(
        (next: SessionRevokeContext) => {
            setContext(next)
            openOverlay("sessionRevoke")
        },
        [setContext, openOverlay],
    )
    return { ...base, open, context }
}
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
 * Discard the stored content-AI conversation when the learner opens a DIFFERENT lesson —
 * and only then. Mount this in a host that lives for the whole lesson (`ContentAiFab`) so a
 * lesson change clears the thread even when the chat is never opened on the new lesson,
 * which is what stops an old thread from being resurrected by navigating A → B → A.
 *
 * ★ It CANNOT clear on mount: the guard lives in
 * {@link import("./store").OverlayStoreState.syncContentAiLesson} and compares the lesson the
 * stored conversation already carries against the live one, so remounting with the same
 * lesson is a no-op. (Rules: ai-selection-anchored-ask-passage,
 * content-ai-multi-session-conversations — never reset shared state in an effect-on-mount.)
 * @param contentId - the lesson currently open (`null` when none).
 */
export const useContentAiLessonReset = (contentId: string | null): void => {
    const syncLesson = useOverlayStore((state) => state.syncContentAiLesson)
    useEffect(() => {
        syncLesson(contentId)
    }, [syncLesson, contentId])
}

/** Handle over the lesson-scoped content-AI conversation (thread + draft + session + streaming). */
export interface ContentAiConversationHandle {
    /** The thread, oldest turn first. */
    readonly messages: ReadonlyArray<ContentAiMessage>
    /** Unsent composer text. */
    readonly draft: string
    /** Reused TUTOR_CHAT session id (null until the first send creates one). */
    readonly sessionId: string | null
    /** Whether an answer is streaming right now. */
    readonly isStreaming: boolean
    /** Replace the composer draft. */
    setDraft: (draft: string) => void
    /** Patch the thread from its previous value. */
    setMessages: (update: (previous: ReadonlyArray<ContentAiMessage>) => Array<ContentAiMessage>) => void
    /** Remember the lazily-created session id. */
    setSessionId: (sessionId: string | null) => void
    /** Flag/unflag an in-flight stream. */
    setStreaming: (isStreaming: boolean) => void
}

/**
 * The lesson-scoped content-AI conversation, lifted OUT of the chat panel so closing the
 * panel (which unmounts it) preserves both the thread and the half-typed question. Only a
 * real lesson change clears them — see {@link useContentAiLessonReset}.
 *
 * Reads are SCOPED: a conversation belonging to another lesson reads as empty, so a stale
 * thread can never be shown against the wrong lesson even for one frame. Writes are scoped
 * the same way, which is what makes it safe for a stream to outlive the panel.
 *
 * @param contentId - the lesson the caller is rendering for (`null` when none).
 * @returns the conversation plus its setters.
 */
export const useContentAiConversation = (contentId: string | null): ContentAiConversationHandle => {
    useContentAiLessonReset(contentId)
    const stored = useOverlayStore((state) => state.contentAiConversation)
    const update = useOverlayStore((state) => state.updateContentAiConversation)
    const conversation = stored.contentId === contentId ? stored : EMPTY_CONTENT_AI_CONVERSATION
    const setDraft = useCallback(
        (draft: string) => update(contentId, () => ({ draft })),
        [update, contentId],
    )
    const setMessages = useCallback(
        (nextMessages: (previous: ReadonlyArray<ContentAiMessage>) => Array<ContentAiMessage>) =>
            update(contentId, (previous) => ({ messages: nextMessages(previous.messages) })),
        [update, contentId],
    )
    const setSessionId = useCallback(
        (sessionId: string | null) => update(contentId, () => ({ sessionId })),
        [update, contentId],
    )
    const setStreaming = useCallback(
        (isStreaming: boolean) => update(contentId, () => ({ isStreaming })),
        [update, contentId],
    )
    return {
        messages: conversation.messages,
        draft: conversation.draft,
        sessionId: conversation.sessionId,
        isStreaming: conversation.isStreaming,
        setDraft,
        setMessages,
        setSessionId,
        setStreaming,
    }
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
