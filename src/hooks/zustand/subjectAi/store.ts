"use client"

import { create } from "zustand"

/**
 * Role of a tutor chat message. `assistant` bubbles hold the SSE-streamed answer.
 */
export type SubjectAiRole = "user" | "assistant"

/** A single tutor chat message rendered in the thread. */
export interface SubjectAiMessage {
    /** BE message id once persisted; a client id while the turn is streaming. */
    id: string
    role: SubjectAiRole
    content: string
    /** Model that actually served this answer (SSE `done` event). */
    modelUsed?: string
}

/**
 * Client VIEW CACHE for the subject AI tutor. Sessions and messages are owned by
 * the backend (`/api/v1/ai/sessions`, feature `TUTOR_CHAT`) — this store only
 * remembers, for the SPA session, WHICH conversation is open per subject and
 * WHICH catalog model the composer picker selected, so switching tabs/tools does
 * not lose the open thread. Nothing here is a source of truth: the conversations
 * list, the transcript and deletion all go through SWR + REST.
 *
 * Cross-component intent lives here as serializable fields (house rule), not
 * callbacks.
 */
interface SubjectAiStoreState {
    /**
     * Open BE session id per subject (`null` / missing = a fresh conversation
     * that has not been created yet — the session is created lazily on the first
     * send so no empty session is ever persisted).
     */
    currentSessionBySubject: Record<string, string | null>
    /**
     * Picked catalog model id (`GET /ai/models`), shared across subjects for the
     * SPA session. `null` = no explicit pick → the BE answers with `defaults.chat`.
     */
    model: string | null

    /** Set the open session for a subject (null = fresh, uncreated conversation). */
    setCurrentSession: (subjectId: string, sessionId: string | null) => void
    /** Pick the answering model (null resets to the BE default). */
    setModel: (model: string | null) => void
}

export const useSubjectAiStore = create<SubjectAiStoreState>((set) => ({
    currentSessionBySubject: {},
    model: null,

    setCurrentSession: (subjectId, sessionId) =>
        set((state) => ({
            currentSessionBySubject: {
                ...state.currentSessionBySubject,
                [subjectId]: sessionId,
            },
        })),

    setModel: (model) => set({ model }),
}))
