import { RestError } from "@/modules/api/rest/client"
import type { SignInLockInfo } from "./store"

/** Mã lỗi backend trả (HTTP 423) khi tài khoản đang bị khoá. */
export const ACCOUNT_LOCKED_ERROR_CODE = "IDENTITY_ACCOUNT_LOCKED"

/**
 * Đọc chi tiết khoá tài khoản từ lỗi đăng nhập, `null` nếu lỗi không phải là "tài khoản bị khoá".
 *
 * Backend nhét chi tiết vào `data` của envelope lỗi (`DataDomainException.extra`), và
 * {@link RestError} mang nguyên khối đó ở `body`. Mọi trường đều được đọc PHÒNG THỦ: backend chưa
 * triển khai change `identity-device-ban-appeal` chỉ trả `unlockAt`, và màn hình phải hiển thị tử
 * tế với đúng những gì nó nhận được thay vì in "undefined" lên mặt người dùng.
 *
 * `canAppeal` mặc định **false** khi thiếu: mời gửi đơn tới một backend không có endpoint đó chỉ
 * dẫn người dùng vào một cái nút 404.
 */
export const readAccountLockedPayload = (error: unknown): SignInLockInfo | null => {
    if (!(error instanceof RestError) || error.errorCode !== ACCOUNT_LOCKED_ERROR_CODE) {
        return null
    }
    const body = (error.body ?? {}) as Record<string, unknown>
    const str = (key: string): string | undefined =>
        typeof body[key] === "string" && body[key] ? (body[key] as string) : undefined
    const lockType = str("lockType")
    return {
        reason: str("reason"),
        lockType: lockType === "ADMIN" || lockType === "AUTO" ? lockType : undefined,
        lockedAt: str("lockedAt"),
        unlockAt: str("unlockAt"),
        violationCount: typeof body.violationCount === "number" ? body.violationCount : undefined,
        canAppeal: body.canAppeal === true,
        hasPendingAppeal: body.hasPendingAppeal === true,
    }
}
