import { describe, expect, it } from "vitest"

import { titleEchoesBody } from "./title-echo"

/**
 * Unit — {@link titleEchoesBody}: does the stored title add anything the body's first
 * line does not already say? Drives whether the announcement card draws a heading, so a
 * false negative brings back the "test 23 / test 23" double print (góp ý #15) and a false
 * positive silently hides a REAL title.
 */
describe("titleEchoesBody", () => {
    it("is an echo when the title is exactly the body's first line (the one-line case)", () => {
        expect(titleEchoesBody("test 23", "test 23")).toBe(true)
    })

    it("is an echo when the body's first line only differs by Markdown marks or case", () => {
        expect(titleEchoesBody("Lịch thi", "# Lịch thi\n\nThứ 5 tuần sau.")).toBe(true)
        expect(titleEchoesBody("lịch thi", "**Lịch thi**\n\nThứ 5.")).toBe(true)
        expect(titleEchoesBody("Nhắc nộp bài", "- Nhắc nộp bài")).toBe(true)
    })

    it("is NOT an echo when the author wrote a real, different heading", () => {
        expect(titleEchoesBody("Lịch thi cuối kỳ", "Thi vào thứ 5 tuần sau, phòng 302.")).toBe(false)
    })

    it("is NOT an echo when the title is only a PREFIX of the first line", () => {
        // A truncated title (the composer caps at 120 chars) still says less than the body
        // line, so hiding it would drop the summary the reader scans by.
        expect(titleEchoesBody("Lịch thi", "Lịch thi cuối kỳ đã có trên cổng.")).toBe(false)
    })

    it("treats a blank title as nothing to draw", () => {
        expect(titleEchoesBody("", "Nội dung.")).toBe(true)
        expect(titleEchoesBody("   ", "Nội dung.")).toBe(true)
    })

    it("keeps a title when the body is empty — it is the only text there is", () => {
        expect(titleEchoesBody("Chỉ có tiêu đề", "")).toBe(false)
    })
})
