import { describe, expect, it } from "vitest"
import { replyMention } from "./replyMention"

describe("replyMention", () => {
    it("prefers the display name, then falls back to the username", () => {
        expect(replyMention({ displayName: "Nguyễn Anh Khoa", username: "khoa" }))
            .toBe("@Nguyễn Anh Khoa ")
        expect(replyMention({ username: "khoa" })).toBe("@khoa ")
    })

    it("does not invent a mention when the author is unresolved", () => {
        expect(replyMention(null)).toBe("")
        expect(replyMention({ displayName: "  ", username: null })).toBe("")
    })
})
