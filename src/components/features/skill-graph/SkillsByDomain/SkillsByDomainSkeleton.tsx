"use client"

import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Loading skeleton soi gương đúng bố cục thật: thanh tóm tắt bốn lát (kèm legend), hàng
 * lọc, rồi ba tiêu đề accordion trong đó nhóm đầu đã bung sẵn bốn hàng kỹ năng.
 *
 * Tiêu đề card và thanh tab KHÔNG được skeleton hoá: chúng là chrome tĩnh, vẽ shimmer lên
 * chữ có sẵn chỉ tạo nhấp nháy thừa khi dữ liệu về.
 */
export const SkillsByDomainSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton.SegmentBar legendItems={4} />
        <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-full rounded-2xl sm:max-w-xs" />
        </div>
        <div className="flex flex-col gap-3">
            {/* nhóm đầu mở sẵn: header + thanh tiến độ + 4 hàng kỹ năng */}
            <div className="flex flex-col gap-3 rounded-3xl border border-default p-4">
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-2 w-full rounded-full" />
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton.ListRow key={index} withTrailing />
                ))}
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-3xl" />
            ))}
        </div>
    </div>
)
