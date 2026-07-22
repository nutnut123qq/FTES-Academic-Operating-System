import { describe, expect, it, vi } from "vitest"
import { createSseParser, type SseEvent } from "./parser"

/** Collect every dispatched event for assertion. */
const collect = () => {
    const events: Array<SseEvent> = []
    const parser = createSseParser((event) => events.push(event))
    return { events, parser }
}

describe("createSseParser", () => {
    it("parses a complete named event", () => {
        const { events, parser } = collect()
        parser.push("event:unread\ndata:5\n\n")
        expect(events).toEqual([{ event: "unread", data: "5" }])
    })

    it("defaults the event name to \"message\" when no event: field is present", () => {
        const { events, parser } = collect()
        parser.push("data:hello\n\n")
        expect(events).toEqual([{ event: "message", data: "hello" }])
    })

    it("strips one optional leading space after data:", () => {
        const { events, parser } = collect()
        parser.push("data: spaced\n\ndata:  double\n\n")
        // first space is field-syntax, any further spaces are payload
        expect(events).toEqual([
            { event: "message", data: "spaced" },
            { event: "message", data: " double" },
        ])
    })

    it("joins multiple data lines with newlines", () => {
        const { events, parser } = collect()
        parser.push("event:notification\ndata:{\ndata:\"id\":1}\n\n")
        expect(events).toEqual([{ event: "notification", data: "{\n\"id\":1}" }])
    })

    it("reassembles an event split across arbitrary chunk boundaries", () => {
        const { events, parser } = collect()
        parser.push("eve")
        parser.push("nt:unr")
        parser.push("ead\nda")
        parser.push("ta:12\n")
        expect(events).toEqual([])
        parser.push("\n")
        expect(events).toEqual([{ event: "unread", data: "12" }])
    })

    it("dispatches multiple events arriving in one chunk, in order", () => {
        const { events, parser } = collect()
        parser.push("event:notification\ndata:{\"id\":\"a\"}\n\nevent:unread\ndata:2\n\n")
        expect(events).toEqual([
            { event: "notification", data: "{\"id\":\"a\"}" },
            { event: "unread", data: "2" },
        ])
    })

    it("ignores comment-only heartbeat blocks", () => {
        const { events, parser } = collect()
        parser.push(":hb\n\n:hb\n\nevent:unread\ndata:0\n\n")
        expect(events).toEqual([{ event: "unread", data: "0" }])
    })

    it("discards a block that names an event but carries no data", () => {
        const { events, parser } = collect()
        parser.push("event:unread\n\n")
        expect(events).toEqual([])
    })

    it("normalizes CRLF newlines, including a CRLF split across two chunks", () => {
        const { events, parser } = collect()
        parser.push("event:unread\r\ndata:7\r")
        parser.push("\n\r\n")
        expect(events).toEqual([{ event: "unread", data: "7" }])
    })

    it("flush dispatches a trailing unterminated block once", () => {
        const { events, parser } = collect()
        parser.push("event:unread\ndata:9")
        expect(events).toEqual([])
        parser.flush()
        expect(events).toEqual([{ event: "unread", data: "9" }])
        // flush cleared the buffer — a second flush must not re-dispatch
        parser.flush()
        expect(events).toHaveLength(1)
    })

    it("never calls onEvent for pure whitespace", () => {
        const onEvent = vi.fn()
        const parser = createSseParser(onEvent)
        parser.push("\n\n\n\n")
        parser.flush()
        expect(onEvent).not.toHaveBeenCalled()
    })
})
