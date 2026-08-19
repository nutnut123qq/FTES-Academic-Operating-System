"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { TrophyIcon } from "@phosphor-icons/react"
import { useGetBadgeCatalogSwr } from "@/hooks/swr/api/rest/queries/useGetBadgeCatalogSwr"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"
import { BadgeCatalogGrid } from "../ProfileBadges/BadgeCatalogGrid"
import { BadgeDetailModal } from "../ProfileBadges/BadgeCatalogGrid/BadgeDetailModal"

/**
 * Tab THÀNH TỰU của hồ sơ — TOÀN BỘ danh mục huy hiệu dạng LƯỚI ô vuông: mỗi ô là
 * một huy hiệu (xám khi chưa mở), HOVER hiện tên, BẤM mở chi tiết (cách đạt + tiến
 * trình hiện tại). Lưới giữ 40 huy hiệu gọn trong vài hàng thay vì một danh sách dài.
 *
 * <p>Trước đợt này danh mục chỉ nằm sau nút "xem tất cả" trong tab Portfolio (mở
 * modal) nên gần như không ai thấy — thầy phản hồi "chưa thấy phần hiển thị
 * achievement". Giờ là một tab riêng, tải ngay khi mở.
 *
 * <p>Dùng {@link BadgeCatalogGrid} nên có sẵn 3 trạng thái: đang tải (skeleton lưới),
 * lỗi (nút thử lại), rỗng (không có huy hiệu — khác lỗi mạng). Bấm một ô ⇒
 * {@link BadgeDetailModal} hiện cách đạt + thanh tiến trình `current/total`.
 */
export const ProfileAchievementsSection = () => {
    const t = useTranslations("profile.badgeCatalog")
    // Tab đã mở nghĩa là cần dữ liệu ngay → bật fetch (khác modal gate theo isOpen).
    const { data, isLoading, error, mutate } = useGetBadgeCatalogSwr(true)
    const items = data?.items ?? []

    // Huy hiệu đang mở chi tiết; `null` = đóng modal.
    const [selected, setSelected] = React.useState<BadgeCatalogItem | null>(null)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <TrophyIcon className="size-5" weight="fill" aria-hidden focusable="false" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <Typography type="h6" weight="bold">
                        {t("title")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {data
                            ? t("summary", { earned: data.earnedCount, total: data.totalCount })
                            : t("subtitle")}
                    </Typography>
                </div>
            </div>

            <BadgeCatalogGrid
                isLoading={isLoading && !data}
                // Có bản cache rồi thì revalidate lỗi KHÔNG được thay bằng trang lỗi.
                error={data ? undefined : error}
                items={items}
                onRetry={() => void mutate()}
                onSelect={setSelected}
            />

            <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
        </div>
    )
}

export default ProfileAchievementsSection
