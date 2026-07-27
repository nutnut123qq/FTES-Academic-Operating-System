import { IntlMessageFormat } from "intl-messageformat"
import { describe, expect, it } from "vitest"

import en from "./en.json"
import vi from "./vi.json"

/**
 * Mọi chuỗi trong catalog i18n PHẢI parse được như ICU MessageFormat.
 *
 * Vì sao cần test này: `next-intl` biên dịch từng message bằng ICU. Một dấu `{` thô
 * (ví dụ một mẫu JSON `{"q":…}` trong prompt gửi cho AI) làm ICU ném
 * `INVALID_MESSAGE: MALFORMED_ARGUMENT`, và `t()` KHÔNG ném ra ngoài mà trả về
 * ĐƯỜNG DẪN KEY ("contentAi.flashcard.prompt"). Lỗi vì thế im lặng ở runtime:
 * tính năng "Thẻ ghi nhớ AI" trong reader từng gửi chính chuỗi key đó làm prompt
 * cho mô hình → không bao giờ ra JSON thẻ → UI luôn hiện "Không tạo được thẻ ghi nhớ".
 *
 * Muốn in ra `{` hoặc `}` theo nghĩa đen thì phải bọc nháy đơn ICU: `'{'` / `'}'`.
 */

type MessageTree = { [key: string]: string | MessageTree }

const flatten = (tree: MessageTree, prefix = ""): Array<[string, string]> =>
    Object.entries(tree).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key
        return typeof value === "string"
            ? [[path, value] as [string, string]]
            : flatten(value, path)
    })

describe.each([
    ["vi", vi as unknown as MessageTree],
    ["en", en as unknown as MessageTree],
])("catalog %s", (locale, tree) => {
    const entries = flatten(tree)

    it("có message để kiểm", () => {
        expect(entries.length).toBeGreaterThan(100)
    })

    it("mọi message parse được như ICU MessageFormat", () => {
        const broken = entries.filter(([, message]) => {
            try {
                new IntlMessageFormat(message, locale)
                return false
            } catch {
                return true
            }
        })
        expect(broken.map(([path]) => path)).toEqual([])
    })
})

describe("contentAi.flashcard.prompt", () => {
    it.each([
        ["vi", vi as unknown as MessageTree],
        ["en", en as unknown as MessageTree],
    ])("%s: render ra mẫu JSON có ngoặc nhọn thật", (locale, tree) => {
        const prompt = (tree as unknown as { contentAi: { flashcard: { prompt: string } } })
            .contentAi.flashcard.prompt
        const rendered = String(new IntlMessageFormat(prompt, locale).format())
        expect(rendered).toContain('{"q"')
        expect(rendered).toContain('"}')
    })
})
