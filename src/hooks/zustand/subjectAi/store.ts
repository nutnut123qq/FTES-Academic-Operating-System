"use client"

import { create } from "zustand"

/**
 * Role of a tutor chat message. `assistant` bubbles hold mock-streamed answers.
 */
export type SubjectAiRole = "user" | "assistant"

/** A single tutor chat message. */
export interface SubjectAiMessage {
    /** Stable id (client-generated in the mock; a real BE assigns its own). */
    id: string
    role: SubjectAiRole
    content: string
}

/** A tutor conversation session, scoped to a subject. */
export interface SubjectAiSession {
    id: string
    /** Auto-titled from the first question; null until the first send. */
    title: string | null
    messages: Array<SubjectAiMessage>
    /** Epoch ms of the last activity — drives the recency sort. */
    updatedAt: number
}

/** Static mock model list surfaced in the composer's model picker. */
export type SubjectAiModel = "ftes-fast" | "ftes-pro"

/**
 * Client store for the subject AI tutor: sessions + messages keyed by `subjectId`
 * so conversations survive tab switches within the SPA session, plus the selected
 * model. Cross-component intent lives here as serializable fields (house rule),
 * not callbacks.
 *
 * BE assumption (logged): the real BE persists sessions/messages per (user,
 * subject) with an auto-title from the first question; the hook layer
 * (`useQuerySubjectAiSessionsSwr`, `useMutateSubjectAiAskSwr`) is shaped so the
 * mock producer swaps out without UI changes. FE-only persistence loses sessions
 * on reload — accepted for the mock phase.
 */
interface SubjectAiStoreState {
    /** Sessions per subject, most-recent activity first is derived at read time. */
    sessionsBySubject: Record<string, Array<SubjectAiSession>>
    /** Currently open session per subject (null = a fresh, uncreated conversation). */
    currentSessionBySubject: Record<string, string | null>
    /** Selected answering model (shared across subjects for the SPA session). */
    model: SubjectAiModel

    /** Lazily create a session (on first send) and make it current. */
    createSession: (subjectId: string, sessionId: string) => void
    /** Set the current session for a subject (null = fresh conversation). */
    setCurrentSession: (subjectId: string, sessionId: string | null) => void
    /** Append a message to a session and bump its recency + auto-title. */
    appendMessage: (
        subjectId: string,
        sessionId: string,
        message: SubjectAiMessage,
    ) => void
    /** Replace the content of an existing message (streaming reveal). */
    updateMessage: (
        subjectId: string,
        sessionId: string,
        messageId: string,
        content: string,
    ) => void
    /** Delete a session; clears current if it was active. */
    deleteSession: (subjectId: string, sessionId: string) => void
    /** Clear every session for a subject (destructive settings action). */
    clearSubject: (subjectId: string) => void
    /** Pick the answering model. */
    setModel: (model: SubjectAiModel) => void
}

const initialState = {
    sessionsBySubject: {} as Record<string, Array<SubjectAiSession>>,
    currentSessionBySubject: {} as Record<string, string | null>,
    model: "ftes-fast" as SubjectAiModel,
}

export const useSubjectAiStore = create<SubjectAiStoreState>((set) => ({
    ...initialState,

    createSession: (subjectId, sessionId) =>
        set((state) => {
            const existing = state.sessionsBySubject[subjectId] ?? []
            const session: SubjectAiSession = {
                id: sessionId,
                title: null,
                messages: [],
                updatedAt: Date.now(),
            }
            return {
                sessionsBySubject: {
                    ...state.sessionsBySubject,
                    [subjectId]: [session, ...existing],
                },
                currentSessionBySubject: {
                    ...state.currentSessionBySubject,
                    [subjectId]: sessionId,
                },
            }
        }),

    setCurrentSession: (subjectId, sessionId) =>
        set((state) => ({
            currentSessionBySubject: {
                ...state.currentSessionBySubject,
                [subjectId]: sessionId,
            },
        })),

    appendMessage: (subjectId, sessionId, message) =>
        set((state) => {
            const sessions = state.sessionsBySubject[subjectId] ?? []
            return {
                sessionsBySubject: {
                    ...state.sessionsBySubject,
                    [subjectId]: sessions.map((session) =>
                        session.id === sessionId
                            ? {
                                ...session,
                                messages: [...session.messages, message],
                                // auto-title from the first user question
                                title:
                                      session.title ??
                                      (message.role === "user"
                                          ? message.content
                                          : null),
                                updatedAt: Date.now(),
                            }
                            : session,
                    ),
                },
            }
        }),

    updateMessage: (subjectId, sessionId, messageId, content) =>
        set((state) => {
            const sessions = state.sessionsBySubject[subjectId] ?? []
            return {
                sessionsBySubject: {
                    ...state.sessionsBySubject,
                    [subjectId]: sessions.map((session) =>
                        session.id === sessionId
                            ? {
                                ...session,
                                messages: session.messages.map((m) =>
                                    m.id === messageId ? { ...m, content } : m,
                                ),
                                updatedAt: Date.now(),
                            }
                            : session,
                    ),
                },
            }
        }),

    deleteSession: (subjectId, sessionId) =>
        set((state) => {
            const sessions = state.sessionsBySubject[subjectId] ?? []
            const wasCurrent =
                state.currentSessionBySubject[subjectId] === sessionId
            return {
                sessionsBySubject: {
                    ...state.sessionsBySubject,
                    [subjectId]: sessions.filter((s) => s.id !== sessionId),
                },
                currentSessionBySubject: wasCurrent
                    ? {
                        ...state.currentSessionBySubject,
                        [subjectId]: null,
                    }
                    : state.currentSessionBySubject,
            }
        }),

    clearSubject: (subjectId) =>
        set((state) => ({
            sessionsBySubject: {
                ...state.sessionsBySubject,
                [subjectId]: [],
            },
            currentSessionBySubject: {
                ...state.currentSessionBySubject,
                [subjectId]: null,
            },
        })),

    setModel: (model) => set({ model }),
}))
