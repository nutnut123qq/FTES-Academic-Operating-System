import { describe, expect, it } from "vitest"
import { RestError } from "@/modules/api/rest/client"
import { readAccountLockedPayload } from "./accountLocked"

/**
 * Bộ đọc payload 423 là chỗ dễ hỏng ÂM THẦM nhất của luồng khoá tài khoản: nó đứng giữa hai
 * repo, và mọi trường đều optional. Đọc sai thì màn hình vẫn render — chỉ là render "undefined"
 * hoặc mời người dùng bấm một cái nút không tồn tại ở backend.
 */
describe("readAccountLockedPayload", () => {
    const lockedError = (body: Record<string, unknown>) =>
        new RestError("Account locked", 423, "IDENTITY_ACCOUNT_LOCKED", body as never)

    it("reads the full admin-lock payload", () => {
        const info = readAccountLockedPayload(
            lockedError({
                reason: "Đăng nhập từ 6 thiết bị trong 30 ngày: Windows·Chrome",
                lockType: "ADMIN",
                lockedAt: "2026-08-10T03:00:00Z",
                violationCount: 2,
                canAppeal: true,
                hasPendingAppeal: false,
            }),
        )

        expect(info).toEqual({
            reason: "Đăng nhập từ 6 thiết bị trong 30 ngày: Windows·Chrome",
            lockType: "ADMIN",
            lockedAt: "2026-08-10T03:00:00Z",
            unlockAt: undefined,
            violationCount: 2,
            canAppeal: true,
            hasPendingAppeal: false,
        })
    })

    it("ignores errors that are not an account lock", () => {
        expect(readAccountLockedPayload(new RestError("Bad credentials", 401, "IDENTITY_INVALID_CREDENTIALS")))
            .toBeNull()
        expect(readAccountLockedPayload(new Error("network down"))).toBeNull()
        expect(readAccountLockedPayload(null)).toBeNull()
    })

    it("survives a backend that only sends unlockAt (pre-change)", () => {
        const info = readAccountLockedPayload(lockedError({ unlockAt: "2026-08-13T10:00:00Z" }))

        expect(info?.unlockAt).toBe("2026-08-13T10:00:00Z")
        expect(info?.reason).toBeUndefined()
        // Không có cờ ⇒ KHÔNG mời gửi đơn: backend đó chưa có endpoint /auth/appeals, mời là dẫn
        // người dùng vào một cái nút 404.
        expect(info?.canAppeal).toBe(false)
        expect(info?.violationCount).toBeUndefined()
    })

    it("drops junk values instead of passing them to the screen", () => {
        const info = readAccountLockedPayload(
            lockedError({
                reason: "",
                lockType: "SOMETHING_ELSE",
                violationCount: "2",
                canAppeal: "true",
            }),
        )

        expect(info?.reason).toBeUndefined()
        expect(info?.lockType).toBeUndefined()
        // Chuỗi "2" không phải số ⇒ bỏ, thà không hiện còn hơn hiện sai.
        expect(info?.violationCount).toBeUndefined()
        // Chuỗi "true" KHÔNG được coi là bật — cờ này quyết định có mời gửi đơn hay không.
        expect(info?.canAppeal).toBe(false)
    })
})
