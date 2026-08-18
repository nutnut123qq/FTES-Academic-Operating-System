import { describe, expect, it } from "vitest"

import { renderTexToHtml } from "./MathFormula"
import { hasMath, splitMath } from "./math"

/**
 * Unit — the TeX scanner and the KaTeX call behind `MarkdownContent math`.
 *
 * Two contracts matter here and they pull against each other. Math must be FOUND: an exam
 * question typed as `$F(x)=\sqrt{x-3}\sin x$` has to reach KaTeX, or the reader sees the
 * LaTeX source, which is the bug this exists to fix. And prose must be LEFT ALONE: `$` is
 * an ordinary character, so a price list, a shell snippet or a `$`-heavy sentence has to
 * come out of the scanner exactly as it went in — byte for byte, which is what the
 * "untouched" assertions below check rather than merely "no math was found".
 */

/** Rebuilds the prose the scanner kept, for the untouched-content assertions. */
const proseOf = (input: string): string =>
    splitMath(input)
        .filter((token) => token.type === "text")
        .map((token) => token.value)
        .join("")

describe("splitMath — finding math", () => {
    it("reads inline math out of a question", () => {
        const tokens = splitMath("State the domain of $F(x)=\\sqrt{x-3}\\sin x$ please")

        expect(tokens).toEqual([
            { type: "text", value: "State the domain of " },
            { type: "inline", value: "F(x)=\\sqrt{x-3}\\sin x" },
            { type: "text", value: " please" },
        ])
    })

    it("reads several formulas out of one answer line", () => {
        const tokens = splitMath("A. $(0,3)$ B. $[3,\\infty)$")

        expect(tokens.filter((token) => token.type === "inline").map((token) => token.value))
            .toEqual(["(0,3)", "[3,\\infty)"])
    })

    it("reads display math, newlines and all", () => {
        const tokens = splitMath("Given:\n$$\n\\int_0^1 x^2 dx\n$$\nsolve it.")

        expect(tokens[1]).toEqual({ type: "display", value: "\n\\int_0^1 x^2 dx\n" })
        expect(tokens[2]).toEqual({ type: "text", value: "\nsolve it." })
    })

    it("says whether a string carries math at all", () => {
        expect(hasMath("$x$")).toBe(true)
        expect(hasMath("no math here")).toBe(false)
    })
})

describe("splitMath — leaving prose alone", () => {
    /** Every one of these must survive the scanner completely unchanged. */
    const untouched = [
        "Khóa học giá $5 và $10, mua cả hai $15.",
        "Chạy `echo $PATH` rồi $HOME sau đó dừng.",
        "A lone $ sign.",
        "US$100–$200 is the range.",
        "Cost: $ 5 $ 10",
        "An escaped \\$5 stays a price.",
        "Nothing here at all.",
        "",
    ]

    for (const input of untouched) {
        it(`leaves ${JSON.stringify(input)} byte-identical`, () => {
            expect(hasMath(input)).toBe(false)
            expect(proseOf(input)).toBe(input)
        })
    }

    it("never opens math straight after a letter or digit", () => {
        expect(hasMath("US$x$")).toBe(false)
    })

    it("refuses to close on a space, so a price range cannot become a formula", () => {
        expect(hasMath("$5 and $10")).toBe(false)
    })

    it("keeps inline math inside one line", () => {
        expect(hasMath("$5\nand $6")).toBe(false)
    })

    it("ignores an empty display run", () => {
        expect(hasMath("$$$$")).toBe(false)
    })

    it("rebuilds the prose around every formula it does take", () => {
        // The delimiters are the ONLY characters a scan may consume.
        expect(proseOf("before $x$ after")).toBe("before  after")
    })
})

describe("renderTexToHtml", () => {
    it("typesets a formula into KaTeX markup", () => {
        const html = renderTexToHtml("x^2", false)

        expect(html).toContain("katex")
        expect(html).toContain("<span")
    })

    it("marks display math as display", () => {
        expect(renderTexToHtml("x^2", true)).toContain("katex-display")
    })

    it("escapes what it echoes back, so bad TeX cannot smuggle markup", () => {
        // `throwOnError: false` makes KaTeX print the offending source; it must print it as
        // TEXT. Parsing the output is the assertion that matters — the source characters
        // WILL appear in the string (escaped, inside <annotation>), what must not appear is
        // an ELEMENT. If this ever fails, the `dangerouslySetInnerHTML` in MathFormula is a
        // hole and the whole approach has to be revisited.
        const host = document.createElement("div")
        host.innerHTML = renderTexToHtml("\\unknowncmd<img src=x onerror=alert(1)>", false)

        expect(host.querySelector("img")).toBeNull()
        expect(host.querySelector("[onerror]")).toBeNull()
    })

    it("refuses the commands that could emit a link (trust: false)", () => {
        const host = document.createElement("div")
        host.innerHTML = renderTexToHtml("\\href{javascript:alert(1)}{click}", false)

        expect(host.querySelector("a")).toBeNull()
        expect(host.querySelector("[href]")).toBeNull()
    })

    it("never throws on nonsense, so one bad formula cannot blank an exam page", () => {
        expect(() => renderTexToHtml("\\frac{", false)).not.toThrow()
        expect(renderTexToHtml("\\frac{", false).length).toBeGreaterThan(0)
    })
})
