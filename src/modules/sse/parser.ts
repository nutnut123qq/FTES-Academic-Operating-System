/** One parsed Server-Sent Event. */
export interface SseEvent {
    /** Event name (`event:` field), defaulting to `"message"` per the SSE spec. */
    event: string
    /** Event payload — every `data:` line of the block, joined with `\n`. */
    data: string
}

/** Incremental SSE parser — see {@link createSseParser}. */
export interface SseParser {
    /** Feed a decoded chunk of the stream (chunks may split events anywhere). */
    push: (chunk: string) => void
    /** Dispatch a trailing, unterminated block after the stream ends. */
    flush: () => void
}

/**
 * Creates an incremental parser for a `text/event-stream` body.
 *
 * Transport-agnostic: the caller reads bytes (fetch + `ReadableStream` — `EventSource` cannot
 * send an `Authorization` header, which the BE requires), decodes them, and feeds the text in
 * with `push`. The parser buffers until an event block closes (blank line) and calls `onEvent`
 * once per complete event, in order, no matter how the network fragmented the stream.
 *
 * Spec subset implemented (all the BE `SseEmitter` output uses):
 * - `event:` names the event (default `"message"`).
 * - multiple `data:` lines accumulate, joined with `\n`; one optional space after the colon is
 *   stripped (`data: x` → `"x"`).
 * - comment lines (`:` prefix — the BE 25s heartbeat sends `:hb`) are ignored.
 * - a block whose data buffer is empty dispatches nothing (per spec) — so heartbeat-only
 *   blocks never surface.
 * - CRLF newlines are normalized, even when split across chunks.
 *
 * @param onEvent - Callback fired for each complete event.
 * @returns The parser handle ({@link SseParser}).
 */
export const createSseParser = (onEvent: (event: SseEvent) => void): SseParser => {
    let buffer = ""

    const dispatchBlock = (block: string) => {
        let event = "message"
        const dataLines: Array<string> = []
        for (const line of block.split("\n")) {
            if (line.startsWith(":")) {
                // comment (heartbeat) — ignore
                continue
            }
            if (line.startsWith("event:")) {
                event = line.slice(6).trim()
            } else if (line.startsWith("data:")) {
                // per spec, a single leading space after the colon is not part of the payload
                dataLines.push(line.slice(5).replace(/^ /, ""))
            } else if (line === "data") {
                dataLines.push("")
            }
        }
        // per spec: an empty data buffer means "discard the event" (covers heartbeat-only blocks)
        if (dataLines.length === 0) {
            return
        }
        onEvent({ event, data: dataLines.join("\n") })
    }

    return {
        push: (chunk: string) => {
            // Normalize CRLF over the whole (small) working buffer so a CRLF split across two
            // chunks — "…\r" then "\n…" — still collapses once the halves meet.
            buffer = (buffer + chunk).replace(/\r\n/g, "\n")
            let separator = buffer.indexOf("\n\n")
            while (separator !== -1) {
                const block = buffer.slice(0, separator)
                buffer = buffer.slice(separator + 2)
                if (block.trim()) {
                    dispatchBlock(block)
                }
                separator = buffer.indexOf("\n\n")
            }
        },
        flush: () => {
            if (buffer.trim()) {
                dispatchBlock(buffer)
            }
            buffer = ""
        },
    }
}
