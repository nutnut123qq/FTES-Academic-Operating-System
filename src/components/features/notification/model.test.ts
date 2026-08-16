import { describe, expect, it } from "vitest"
import en from "@/messages/en.json"
import vi from "@/messages/vi.json"
import {
    NOTIFICATION_FALLBACK_KEYS,
    NOTIFICATION_FALLBACK_UNKNOWN_KEY,
    isMachineText,
    notificationFallbackKey,
    resolveNotificationDisplay,
    stripUnresolvedPlaceholders,
} from "./model"

/** Stand-in for next-intl's `t`, echoing the leaf so assertions can see the choice. */
const translate = (key: string) => `t:${key}`

/**
 * The BE stores the raw enum name as the title whenever a dispatched templateCode has
 * no IN_APP row (`NotificationContentBuilder.build` last-resort branch) — observed live
 * twice, see the V296 / V302 migration comments. These lock both halves of the guard:
 * real server prose is passed through untouched, and machine output never reaches the
 * screen.
 */
describe("resolveNotificationDisplay", () => {
    it("passes real server-rendered prose through untouched", () => {
        const display = resolveNotificationDisplay(
            {
                type: "EVENT",
                title: "Sự kiện Demo Day đã bị huỷ",
                body: "Sự kiện bạn đăng ký đã bị huỷ.",
            },
            translate,
        )
        expect(display.title).toBe("Sự kiện Demo Day đã bị huỷ")
        expect(display.body).toBe("Sự kiện bạn đăng ký đã bị huỷ.")
    })

    it("replaces a title that is just the backend enum name", () => {
        // exactly what the BE stores when a templateCode has no IN_APP template
        const display = resolveNotificationDisplay(
            { type: "EVENT", title: "EVENT", body: null },
            translate,
        )
        expect(display.title).toBe("t:EVENT")
        expect(display.body).toBeNull()
    })

    it("replaces a title that is a raw templateCode", () => {
        expect(
            resolveNotificationDisplay(
                { type: "COURSE", title: "course.access_expiring", body: null },
                translate,
            ).title,
        ).toBe("t:COURSE")
        expect(
            resolveNotificationDisplay(
                { type: "MENTION", title: "chat.new-message", body: null },
                translate,
            ).title,
        ).toBe("t:MENTION")
    })

    it("replaces an empty title and one left empty by stripping placeholders", () => {
        expect(
            resolveNotificationDisplay(
                { type: "COIN", title: "", body: null },
                translate,
            ).title,
        ).toBe("t:COIN")
        expect(
            resolveNotificationDisplay(
                { type: "COIN", title: "{{amount}}", body: null },
                translate,
            ).title,
        ).toBe("t:COIN")
    })

    it("strips placeholders the backend renderer could not substitute", () => {
        // TemplateRenderer only matches [a-zA-Z0-9_.]; a hyphenated name survives
        const display = resolveNotificationDisplay(
            {
                type: "EVENT",
                title: "Sự kiện {{event-title}} sắp bắt đầu",
                body: null,
            },
            translate,
        )
        expect(display.title).toBe("Sự kiện sắp bắt đầu")
    })

    it("drops a body that only repeats the title", () => {
        // the BE emits title === body for any template with a null subject
        const display = resolveNotificationDisplay(
            { type: "SYSTEM", title: "Bảo trì hệ thống", body: "Bảo trì hệ thống" },
            translate,
        )
        expect(display.body).toBeNull()
    })

    it("falls back generically for a type the FE has never heard of", () => {
        expect(
            resolveNotificationDisplay(
                { type: "WAREHOUSE_ALERT", title: "WAREHOUSE_ALERT", body: null },
                translate,
            ).title,
        ).toBe(`t:${NOTIFICATION_FALLBACK_UNKNOWN_KEY}`)
    })

    it("leaves human broadcast titles alone even when shouty", () => {
        // admin broadcasts carry titleRaw typed by a person — not machine text
        expect(isMachineText("SALE")).toBe(false)
        expect(isMachineText("Khai giảng")).toBe(false)
        expect(stripUnresolvedPlaceholders("Giảm 50% {khoá học}"))
            .toBe("Giảm 50% {khoá học}")
    })
})

describe("notificationFallbackKey", () => {
    it("never returns the raw type, even for empty or missing input", () => {
        expect(notificationFallbackKey("")).toBe(NOTIFICATION_FALLBACK_UNKNOWN_KEY)
        expect(notificationFallbackKey(undefined)).toBe(NOTIFICATION_FALLBACK_UNKNOWN_KEY)
        expect(notificationFallbackKey("EMAIL_VERIFY")).toBe("EMAIL_VERIFY")
    })

    it("has a sentence in both catalogs for every key it can return", () => {
        const missing = NOTIFICATION_FALLBACK_KEYS.flatMap((key) => [
            ...(key in en.notifications.typeFallback
                ? []
                : [`en → notifications.typeFallback.${key}`]),
            ...(key in vi.notifications.typeFallback
                ? []
                : [`vi → notifications.typeFallback.${key}`]),
        ])
        expect(missing).toEqual([])
    })
})
