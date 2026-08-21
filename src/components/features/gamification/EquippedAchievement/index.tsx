"use client"

import React from "react"
import { cn } from "@heroui/react"
import { badgeKindIcon } from "@/components/features/gamification/badgeIcon"
import { useBadgeLabel } from "@/components/features/gamification/useBadgeLabel"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { profileAssetThumbnailUrl } from "@/utils/profileAsset"

/**
 * THÀNH TÍCH đang được GHIM, ở dạng tối thiểu đủ để VẼ.
 *
 * <p>Cố tình khai báo theo CẤU TRÚC (không import kiểu của tầng REST): trường duy nhất
 * bắt buộc là `code`, phần còn lại đều tuỳ chọn + nullable, nên một backend chưa deploy
 * (thiếu hẳn trường) và một thành tích chưa có art (`null`) đi CÙNG một nhánh — rơi về
 * glyph theo `kind`, không bao giờ vẽ `<img>` rỗng.
 */
export interface EquippedAchievementRef {
    /** Mã thành tích (`badges.code`, vd `FIRST_LESSON`). KHÔNG BAO GIỜ in ra thô. */
    code: string
    /** Tên backend gửi kèm — bậc 2 của {@link useBadgeLabel} sau bản dịch curated. */
    name?: string | null
    /** `kind` của badge (`BADGE`/`TITLE`/`TROPHY`) → chọn glyph dự phòng. */
    kind?: string | null
    /** Art do BE seed (`badges.icon`); vắng/`null` ⇒ dùng glyph. */
    iconUrl?: string | null
}

/** Props for {@link AchievementArt} and {@link EquippedAchievement}. */
export interface EquippedAchievementProps extends WithClassNames<undefined> {
    /**
     * Thành tích người này đang ghim. `null` / `undefined` / thiếu `code` ⇒ KHÔNG vẽ gì
     * cả: không ô rỗng, không khoảng trắng giữ chỗ. Phần lớn tài khoản không ghim gì,
     * nên cây markup của họ phải y hệt như trước.
     */
    achievement?: EquippedAchievementRef | null
    /**
     * Thang icon theo đúng nấc của {@link import("@/components/reuseable/StaffBadge").StaffBadge}:
     * `sm` = `size-4` (cạnh tên `body-sm` trong feed/bình luận — mặc định),
     * `md` = `size-5` (cạnh tiêu đề `h4` của trang hồ sơ).
     */
    size?: "sm" | "md"
}

/**
 * Ảnh (hoặc glyph dự phòng) của một thành tích — phần VẼ thuần, không nhãn, không a11y.
 *
 * <p>Tách riêng để màn CHỌN thành tích (ô lớn trong `AvatarAppearancePicker`) và con dấu
 * nhỏ sau tên dùng CHUNG một quy tắc art: hai chỗ vẽ khác kích thước nhưng không được
 * phép bất đồng về "badge này trông thế nào". Đây cũng là lý do cả file chỉ cần MỘT mục
 * trong danh sách `<img>` hiện trạng.
 *
 * @param achievement - thành tích cần vẽ; thiếu `code` ⇒ `null`.
 * @param className - lớp kích thước do caller cấp (`size-4`, `size-full`, …).
 */
export const AchievementArt = ({
    achievement,
    className,
}: Pick<EquippedAchievementProps, "achievement" | "className">) => {
    const art = achievement?.iconUrl?.trim()
    if (!achievement?.code?.trim()) {
        return null
    }
    if (art) {
        // Plain <img>: art do BE seed nên host không ghim được vào next/image
        // remotePatterns — hệt ba bề mặt danh mục badge đã có (BadgeCatalogCell /
        // BadgeCatalogRow / BadgeDetailModal).
        return (
            <img
                src={profileAssetThumbnailUrl(art) ?? art}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className={cn("object-contain", className)}
            />
        )
    }
    const Glyph = badgeKindIcon(achievement.kind)
    return <Glyph weight="fill" aria-hidden focusable="false" className={cn("text-accent", className)} />
}

/**
 * Con dấu THÀNH TÍCH ghim ngay sau tên một người — THE một component duy nhất mọi bề mặt
 * danh tính dùng, nên feed, bình luận, danh sách thành viên và trang hồ sơ không bao giờ
 * vẽ khác nhau cho cùng một tài khoản (đúng mô hình {@link
 * import("@/components/reuseable/StaffBadge").StaffBadge} đứng cạnh).
 *
 * <p><b>Không sở hữu quy tắc nào của riêng nó.</b> Tên đọc ra sao là việc của
 * {@link useBadgeLabel} (bản dịch curated → `name` backend → mã đã humanize) và glyph dự
 * phòng là việc của {@link badgeKindIcon} — hai file đã tồn tại sẵn cho đúng câu hỏi này.
 * Một bản sao quy tắc đặt tại chỗ chính là cách bảng xếp hạng từng vẽ một chiếc cúp cứng
 * cho MỌI badge trong khi trang hồ sơ vẽ art thật.
 *
 * <p><b>Trang trí, không chen vào đường đọc.</b> `inline-flex` + `shrink-0` + không
 * margin riêng: con dấu ăn theo `gap` của hàng chứa nên không đẩy chữ, không làm vỡ dòng,
 * và tên vẫn là thứ chính. Không ghim gì ⇒ trả `null` (không ô rỗng, không placeholder).
 *
 * <p>A11y: `role="img"` + `aria-label` mang TÊN thành tích, vì riêng hình vẽ không nói
 * được gì với trình đọc màn hình; `title` chỉ là tooltip hover phụ thêm. Cố tình KHÔNG
 * dùng tooltip react-aria: nó biến trigger thành phần tử focus được, mà con dấu này nằm
 * cạnh (đôi khi trong) thẻ `<a>` hồ sơ — thêm một điểm dừng Tab ma trên mọi cái tên.
 *
 * @param props - {@link EquippedAchievementProps}
 */
export const EquippedAchievement = ({
    achievement,
    size = "sm",
    className,
}: EquippedAchievementProps) => {
    const badgeLabel = useBadgeLabel()
    const code = achievement?.code?.trim()
    if (!code) {
        return null
    }
    const label = badgeLabel(code, achievement?.name)
    return (
        <span
            role="img"
            aria-label={label}
            title={label}
            data-testid="equipped-achievement"
            className={cn("inline-flex shrink-0 items-center", className)}
        >
            <AchievementArt achievement={achievement} className={size === "md" ? "size-5" : "size-4"} />
        </span>
    )
}

export default EquippedAchievement
