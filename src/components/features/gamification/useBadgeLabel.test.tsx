import React from "react"
import { renderHook } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it } from "vitest"
import en_messages from "@/messages/en.json"
import vi_messages from "@/messages/vi.json"
import { useBadgeLabel } from "./useBadgeLabel"

/**
 * Hook — {@link useBadgeLabel} against the REAL vi/en catalogs (no echo-the-key
 * mock): the wiring under test is precisely that the hook binds the right
 * namespace, and a translator mock would happily "pass" while the namespace
 * string was wrong and every badge silently fell through to its fallback.
 *
 * The four codes below (`FIRST_ENROLL`, `STREAK_3`, `FIRST_POST`,
 * `FIRST_COMMENT`) are milestone rows the backend awards today; they are pinned
 * here so the catalog keeps a curated name for them.
 */

/** Renders the hook inside the given locale catalog and returns the resolver. */
const labelIn = (locale: "vi" | "en") =>
    renderHook(() => useBadgeLabel(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <NextIntlClientProvider
                locale={locale}
                messages={locale === "vi" ? vi_messages : en_messages}
            >
                {children}
            </NextIntlClientProvider>
        ),
    }).result.current

describe("useBadgeLabel — curated catalog first", () => {
    it("resolves a curated milestone to its localized name", () => {
        expect(labelIn("en")("FIRST_LESSON")).toBe("First Lesson")
        expect(labelIn("vi")("FIRST_LESSON")).toBe("Bài học đầu tiên")
    })

    it("prefers the curated name over the name the backend sent", () => {
        expect(labelIn("vi")("CHALLENGER", "Challenger")).toBe("Đấu sĩ")
    })

    it("carries a curated name for every milestone the backend awards today", () => {
        for (const code of ["FIRST_ENROLL", "STREAK_3", "FIRST_POST", "FIRST_COMMENT"]) {
            for (const locale of ["vi", "en"] as const) {
                const label = labelIn(locale)(code, null)
                expect(label).not.toContain("gamification.milestones")
                expect(label).not.toBe(code)
                expect(label.length).toBeGreaterThan(0)
            }
        }
    })
})

describe("useBadgeLabel — a milestone seeded after this release", () => {
    it("falls back to the backend name, never the key path", () => {
        const label = labelIn("vi")("MYSTERY_MILESTONE", "Huy hiệu bí ẩn")

        expect(label).toBe("Huy hiệu bí ẩn")
        expect(label).not.toContain("gamification.milestones")
    })

    it("humanizes the code when the backend sent no name either", () => {
        for (const locale of ["vi", "en"] as const) {
            const label = labelIn(locale)("MYSTERY_MILESTONE")

            expect(label).toBe("Mystery Milestone")
            expect(label).not.toContain("gamification.milestones")
        }
    })
})
