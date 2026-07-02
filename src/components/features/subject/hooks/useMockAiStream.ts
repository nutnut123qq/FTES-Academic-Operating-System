"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Context injected into a mock answer so scoping is evident. */
export interface MockStreamContext {
    /** Subject code, e.g. `PRF192`. */
    subjectCode: string
    /** Subject name, e.g. "Lập trình C". */
    subjectName: string
}

/** Callbacks the caller wires to drive the thread as chunks arrive. */
export interface MockStreamHandlers {
    /** Fired for every reveal tick with the full text so far. */
    onChunk: (text: string) => void
    /** Fired once the full answer has streamed in. */
    onDone: (text: string) => void
    /** Fired if the mock stream fails (see failure path). */
    onError: () => void
}

/** ~40ms per word batch — visually indistinguishable from a token stream. */
const TICK_MS = 45
/** Words revealed per tick. */
const WORDS_PER_TICK = 2

/**
 * Builds a canned, subject-aware answer for a question. Templates inject the
 * subject code/name so the scoping is evident and answers never feel generic.
 * BE assumption (logged): a real BE streams tokens over a socket; only this
 * producer is replaced — the thread UI and the interval-reveal contract stay.
 */
const buildMockAnswer = (question: string, ctx: MockStreamContext): string => {
    const q = question.trim()
    return (
        `Về môn ${ctx.subjectName} (${ctx.subjectCode}): đây là câu trả lời demo ` +
        `cho câu hỏi "${q}". Trong thực tế, trợ lý AI sẽ dựa trên tài liệu và bài ` +
        "học của môn này để giải thích chi tiết, đưa ví dụ minh hoạ và gợi ý các " +
        "bước ôn tập tiếp theo. (AI demo — nội dung mô phỏng phía client.)"
    )
}

/**
 * Mock AI stream: reveals a subject-aware canned answer chunk-by-chunk via
 * `setInterval` with an `isStreaming` flag and a cancellable handle. A ~5% of
 * questions containing the literal word "loi" force the failure path so error
 * handling is exercisable.
 *
 * @returns `{ isStreaming, ask, cancel }` — `ask(question, ctx, handlers)` starts
 *   a stream; `cancel()` stops it (the caller keeps the partial answer).
 */
export const useMockAiStream = () => {
    const [isStreaming, setIsStreaming] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clear = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const cancel = useCallback(() => {
        clear()
        setIsStreaming(false)
    }, [clear])

    const ask = useCallback(
        (
            question: string,
            ctx: MockStreamContext,
            handlers: MockStreamHandlers,
        ) => {
            clear()
            setIsStreaming(true)

            // mock failure path: questions asking for "loi" (lỗi) fail after a beat.
            if (/\bloi\b/i.test(question)) {
                timeoutRef.current = setTimeout(() => {
                    setIsStreaming(false)
                    timeoutRef.current = null
                    handlers.onError()
                }, 600)
                return
            }

            const words = buildMockAnswer(question, ctx).split(" ")
            let index = 0
            intervalRef.current = setInterval(() => {
                index += WORDS_PER_TICK
                const revealed = words.slice(0, index).join(" ")
                if (index >= words.length) {
                    clear()
                    setIsStreaming(false)
                    handlers.onDone(words.join(" "))
                    return
                }
                handlers.onChunk(revealed)
            }, TICK_MS)
        },
        [clear],
    )

    // stop any live stream on unmount
    useEffect(() => clear, [clear])

    return { isStreaming, ask, cancel }
}
