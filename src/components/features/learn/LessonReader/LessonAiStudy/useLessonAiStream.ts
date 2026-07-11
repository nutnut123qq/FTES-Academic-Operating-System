"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createSession, sendSessionMessageStream } from "@/modules/api/rest/ai"

/** A resolved failure reason for a generation (maps to an i18n key by the caller). */
export type LessonAiStreamError = "error" | "quota"

/** Return shape of {@link useLessonAiStream}. */
export interface UseLessonAiStreamReturn {
    /** The accumulated assistant text streamed so far (markdown / JSON). */
    text: string
    /** True while a generation is in flight. */
    isStreaming: boolean
    /** Non-null once a generation failed (error / quota gate). */
    error: LessonAiStreamError | null
    /** Kick off a generation with `prompt`; streams into `text`. */
    generate: (prompt: string) => Promise<void>
    /** Clear the text + error (keeps the reused session). */
    reset: () => void
}

/**
 * Lesson-grounded AI generation over the SAME proven capability the tutor chat
 * uses: a lazily-created `TUTOR_CHAT` session grounded on the current lesson
 * (`contextRef: { lessonId }`, so the BE loads the lesson body server-side) plus
 * {@link sendSessionMessageStream} (SSE). A task-specific prompt (a summary /
 * "produce N flashcards as JSON" instruction) shapes the output — there is no
 * dedicated lesson-scoped note/flashcard REST endpoint reachable from the client
 * today (the `/ai/learning/summary` + `/ai/learning/flashcards` JOB endpoints
 * return `code=1002` Accepted, which the shared `restRequest` surfaces as an
 * error), so both study tools reuse this stream.
 *
 * The session is created once and reused across regenerations; the in-flight
 * stream is aborted on unmount so the BE releases its Redis lock.
 *
 * @param lessonId - the current `contentId` route param (grounds the session).
 */
export const useLessonAiStream = (lessonId: string | undefined): UseLessonAiStreamReturn => {
    const [text, setText] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<LessonAiStreamError | null>(null)
    /** Reused TUTOR_CHAT session id — created lazily on the first generate. */
    const sessionIdRef = useRef<string | null>(null)
    /** Aborts the in-flight SSE stream (regenerate / unmount). */
    const abortRef = useRef<AbortController | null>(null)
    const isStreamingRef = useRef(false)

    const reset = useCallback(() => {
        setText("")
        setError(null)
    }, [])

    const generate = useCallback(
        async (prompt: string) => {
            if (isStreamingRef.current) {
                return
            }
            // drop any earlier stream, start clean
            abortRef.current?.abort()
            isStreamingRef.current = true
            setText("")
            setError(null)
            setIsStreaming(true)

            let received = false
            let failure: LessonAiStreamError | null = null
            try {
                // Lazy TUTOR_CHAT session, grounded on the lesson (BE loads its body).
                if (!sessionIdRef.current) {
                    const session = await createSession({
                        feature: "TUTOR_CHAT",
                        ...(lessonId ? { contextRef: { lessonId } } : {}),
                    })
                    sessionIdRef.current = session.id
                }
                const controller = new AbortController()
                abortRef.current = controller
                await sendSessionMessageStream(sessionIdRef.current, prompt, {
                    onDelta: (delta) => {
                        received = true
                        setText((prev) => prev + delta)
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
        [lessonId],
    )

    // abort any in-flight stream on unmount (BE releases its Redis lock on disconnect)
    useEffect(() => () => abortRef.current?.abort(), [])

    return { text, isStreaming, error, generate, reset }
}
