"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createSession, sendSessionMessageStream } from "@/modules/api/rest/ai"
import { submitInterviewAnswer } from "@/modules/api/rest/interview"
import type { SubmitAnswerView } from "@/modules/api/rest/interview"

/** One chat turn in the oral viva. */
export interface VivaMessage {
    role: "user" | "assistant"
    content: string
}

/** Resolved failure reason for the viva stream. */
export type InterviewOralVivaError = "error" | "quota"

/** Return shape of {@link useInterviewOralViva}. */
export interface UseInterviewOralVivaReturn {
    /** Chat transcript so far. */
    messages: VivaMessage[]
    /** True while the examiner is streaming a turn. */
    isStreaming: boolean
    /** Non-null once the stream fails (error / quota gate). */
    error: InterviewOralVivaError | null
    /** Kick off the viva with an optional opening prompt. */
    start: (initialPrompt?: string) => Promise<void>
    /** Send the student's reply; persists it and streams the examiner's next turn. */
    send: (text: string) => Promise<SubmitAnswerView | undefined>
    /** Clear the transcript and error (keeps the reused session). */
    reset: () => void
}

/**
 * Oral viva over the shared AI chat SSE session.
 *
 * Creates a single `INTERVIEW_COURSE` session grounded on the question set. The
 * examiner (backend-prompted model) asks oral questions one at a time over SSE;
 * every student reply is also persisted to the interview attempt via
 * {@link submitInterviewAnswer} so it can be graded.
 *
 * @param attemptId - the current interview attempt id (for REST persistence).
 * @param questionSetId - the generated question set id (for session context).
 * @param questionId - the current ORAL question id (for REST persistence).
 */
export const useInterviewOralViva = (
    attemptId: string,
    questionSetId: string,
    questionId: string,
): UseInterviewOralVivaReturn => {
    const [messages, setMessages] = useState<VivaMessage[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<InterviewOralVivaError | null>(null)

    /** Reused INTERVIEW_COURSE session id — created lazily on first start/send. */
    const sessionIdRef = useRef<string | null>(null)
    /** Aborts the in-flight SSE stream. */
    const abortRef = useRef<AbortController | null>(null)
    const isStreamingRef = useRef(false)

    const reset = useCallback(() => {
        setMessages([])
        setError(null)
    }, [])

    const ensureSession = useCallback(async () => {
        if (!sessionIdRef.current) {
            const session = await createSession({
                feature: "INTERVIEW_COURSE",
                contextRef: { questionSetId },
            })
            sessionIdRef.current = session.id
        }
        return sessionIdRef.current
    }, [questionSetId])

    const streamAssistant = useCallback(
        async (sessionId: string, userText: string) => {
            if (isStreamingRef.current) return

            abortRef.current?.abort()
            isStreamingRef.current = true
            setIsStreaming(true)
            setError(null)

            let received = false
            let failure: InterviewOralVivaError | null = null

            try {
                const controller = new AbortController()
                abortRef.current = controller

                await sendSessionMessageStream(sessionId, userText, {
                    onDelta: (delta) => {
                        received = true
                        setMessages((prev) => {
                            const last = prev[prev.length - 1]
                            if (last?.role === "assistant") {
                                return [...prev.slice(0, -1), { ...last, content: last.content + delta }]
                            }
                            return [...prev, { role: "assistant", content: delta }]
                        })
                    },
                    onError: () => {
                        failure = failure ?? "error"
                    },
                    onQuota: () => {
                        failure = "quota"
                    },
                    signal: controller.signal,
                })

                if (failure) {
                    setError(failure)
                } else if (!received) {
                    setError("error")
                }
            } catch {
                setError("error")
            } finally {
                isStreamingRef.current = false
                setIsStreaming(false)
            }
        },
        [],
    )

    const start = useCallback(
        async (initialPrompt?: string) => {
            if (isStreamingRef.current || messages.length > 0) return
            const sessionId = await ensureSession()
            await streamAssistant(sessionId, initialPrompt ?? "")
        },
        [ensureSession, messages.length, streamAssistant],
    )

    const send = useCallback(
        async (text: string) => {
            if (isStreamingRef.current || !text.trim()) return undefined

            setMessages((prev) => [...prev, { role: "user", content: text.trim() }])
            setError(null)

            let persisted: SubmitAnswerView | undefined
            try {
                persisted = await submitInterviewAnswer(attemptId, {
                    questionId,
                    type: "ORAL",
                    answer: text.trim(),
                })
            } catch {
                setError("error")
                return undefined
            }

            const sessionId = await ensureSession()
            await streamAssistant(sessionId, text.trim())
            return persisted
        },
        [attemptId, ensureSession, questionId, streamAssistant],
    )

    // abort any in-flight stream on unmount (BE releases its Redis lock on disconnect)
    useEffect(() => () => abortRef.current?.abort(), [])

    return { messages, isStreaming, error, start, send, reset }
}
