// Mô hình THUẦN cho thang khung avatar (profile.avatar_frames, V341).
//
// Hai loại khung KHÔNG được trộn khi sắp xếp hay khi tính "bậc kế tiếp":
//  - LIFETIME   : mở theo EXP TRỌN ĐỜI, giữ vĩnh viễn.
//  - SEASON_TOP : hạng 1/2/3 của một bảng trong một kì, HẾT KÌ SAU LÀ MẤT.
// Trộn chúng vào một dãy "bậc tiếp theo" sẽ hứa với người dùng rằng cứ cày EXP là có
// khung top mùa — sai, khung đó phải GIÀNH được, không mua được bằng thời gian.

import type { AvatarFrameLadderItemView, AvatarFrameLadderView } from "@/modules/api/rest/gamification"

/** Khung mở bằng EXP trọn đời, đã sắp theo mốc tăng dần. */
export const lifetimeFrames = (
    items: ReadonlyArray<AvatarFrameLadderItemView>,
): Array<AvatarFrameLadderItemView> =>
    items
        .filter((item) => item.kind === "LIFETIME")
        .slice()
        .sort((a, b) => (a.requiredXp ?? 0) - (b.requiredXp ?? 0))

/** Khung top mùa, nhóm theo bảng rồi theo hạng (1 trước 3). */
export const seasonTopFrames = (
    items: ReadonlyArray<AvatarFrameLadderItemView>,
): Array<AvatarFrameLadderItemView> =>
    items
        .filter((item) => item.kind === "SEASON_TOP")
        .slice()
        .sort((a, b) => {
            const byBoard = (a.board ?? "").localeCompare(b.board ?? "")
            return byBoard !== 0 ? byBoard : (a.topRank ?? 0) - (b.topRank ?? 0)
        })

/**
 * Bậc LIFETIME kế tiếp người xem chưa mở, kèm số EXP còn thiếu.
 *
 * @returns `null` khi đã mở hết mọi bậc trọn đời (người gọi nói "đã đạt bậc cao nhất",
 *   KHÔNG hiện thanh tiến độ rỗng — thanh 0% ở đây đọc thành "chưa mở gì cả").
 *
 * Chỉ xét `LIFETIME`: khung top mùa không có mốc EXP nào để tiến tới.
 */
export const nextLifetimeFrame = (
    items: ReadonlyArray<AvatarFrameLadderItemView>,
    lifetimeXp: number,
): { frame: AvatarFrameLadderItemView; remainingXp: number } | null => {
    const next = lifetimeFrames(items).find(
        (item) => !item.unlocked && (item.requiredXp ?? 0) > lifetimeXp,
    )
    if (!next) {
        return null
    }
    return { frame: next, remainingXp: Math.max(0, (next.requiredXp ?? 0) - lifetimeXp) }
}

/**
 * Tiến độ tới một bậc khung, để vẽ thanh đo (dùng lại idiom badge chưa đạt).
 *
 * @returns `null` khi bậc này KHÔNG đo được bằng EXP (khung top mùa, hoặc mốc bằng 0) —
 *   giống hệt luật của badge: `counterKey === null` thì không được vẽ thanh nào.
 */
export const frameProgress = (
    item: AvatarFrameLadderItemView,
    lifetimeXp: number,
): { value: number; max: number } | null => {
    if (item.kind !== "LIFETIME" || !item.requiredXp || item.requiredXp <= 0) {
        return null
    }
    return { value: Math.max(0, Math.min(lifetimeXp, item.requiredXp)), max: item.requiredXp }
}

/**
 * Khung top mùa đã hết hạn chưa.
 *
 * @param now - thời điểm hiện tại (tiêm vào để test tất định).
 *
 * `expiresAt === null` = vĩnh viễn ⇒ KHÔNG hết hạn. Đừng đảo mặc định: coi `null` là
 * "hết hạn rồi" sẽ tước khung vĩnh viễn của mọi người chỉ vì máy chủ không gửi ngày.
 */
export const isFrameExpired = (item: AvatarFrameLadderItemView, now: Date): boolean => {
    if (!item.expiresAt) {
        return false
    }
    const expiresAt = new Date(item.expiresAt).getTime()
    return !Number.isNaN(expiresAt) && expiresAt <= now.getTime()
}

/** Khung người xem đang ĐEO (theo `currentCode`), hoặc `null`. */
export const wornFrame = (
    ladder: AvatarFrameLadderView | undefined,
): AvatarFrameLadderItemView | null => {
    if (!ladder?.currentCode) {
        return null
    }
    return ladder.items.find((item) => item.code === ladder.currentCode) ?? null
}

/**
 * Giá trị `background` để vẽ vòng viền của một khung.
 *
 * An toàn cắm thẳng vào `style` vì `css_gradient` do QUẢN TRỊ seed (V341), người dùng
 * chỉ gửi lên `code`. Nếu về sau có đường cho người dùng tự nhập gradient thì chỗ này
 * PHẢI validate trước — đây là chỗ duy nhất chuỗi đó biến thành CSS.
 */
export const frameRingBackground = (
    item: Pick<AvatarFrameLadderItemView, "cssGradient"> | null | undefined,
): string | undefined => item?.cssGradient || undefined
