"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { TrophyIcon } from "@phosphor-icons/react"
import { useGetBadgeCatalogSwr } from "@/hooks/swr/api/rest/queries/useGetBadgeCatalogSwr"
import { BadgeCatalogList } from "../ProfileBadges/BadgeCatalogModal/BadgeCatalogList"

/**
 * Tab THÀNH TỰU của hồ sơ — TOÀN BỘ danh mục huy hiệu, hiện thẳng ra: mỗi huy hiệu
 * kèm tên, CÁCH đạt (mô tả), đã mở khoá hay chưa, và với huy hiệu đo được thì tiến
 * trình hiện tại (progress/threshold, do {@link BadgeCatalogRow} vẽ).
 *
 * <p>Trước đợt này danh mục chỉ nằm sau nút "xem tất cả" trong tab Portfolio (mở
 * modal) nên gần như không ai thấy — thầy phản hồi "chưa thấy cái phần để hiển thị
 * các achievement". Giờ nó là một tab riêng, tải ngay khi mở (không cần bấm gì).
 *
 * <p>Dùng lại {@link BadgeCatalogList} y như modal nên đã có sẵn 3 trạng thái: đang
 * tải (skeleton), lỗi (nút thử lại), rỗng (không có huy hiệu — khác với lỗi mạng).
 */
export const ProfileAchievementsSection = () => {
    const t = useTranslations("profile.badgeCatalog")
    // Tab đã mở nghĩa là cần dữ liệu ngay → bật fetch (khác modal gate theo isOpen).
    const { data, isLoading, error, mutate } = useGetBadgeCatalogSwr(true)
    const items = data?.items ?? []

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
            <BadgeCatalogList
                isLoading={isLoading && !data}
                // Có bản cache rồi thì revalidate lỗi KHÔNG được thay bằng trang lỗi.
                error={data ? undefined : error}
                items={items}
                onRetry={() => void mutate()}
            />
        </div>
    )
}

export default ProfileAchievementsSection
