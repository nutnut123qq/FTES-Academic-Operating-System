"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { MedalIcon, StackIcon, UserPlusIcon, UsersThreeIcon } from "@phosphor-icons/react"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"

/**
 * Một chỉ số: icon + con số, KHÔNG bọc card. Con số là thứ người đọc lướt qua để so sánh,
 * nên nó mang trọng số chữ; nhãn đầy đủ chỉ sống trong `title`/`aria` cho trình đọc màn
 * hình và tooltip — bốn ô vuông có nhãn dài biến một dòng liếc mắt thành một bảng phải đọc.
 */
const ProfileStat = ({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode
    /** Số đã được localise sẵn. */
    value: string
    /** Tên đầy đủ của chỉ số (ví dụ "Người theo dõi"). */
    label: string
}) => {
    const t = useTranslations()
    const srLabel = t("publicProfile.stats.srLabel", { label, value })

    return (
        <span title={srLabel} className="inline-flex items-center gap-1.5">
            <span className="text-muted">{icon}</span>
            <Typography type="body-sm" weight="semibold">
                {value}
            </Typography>
            <span className="sr-only">{label}</span>
        </span>
    )
}

/**
 * Hàng chỉ số của hồ sơ công khai — người theo dõi / đang theo dõi / dự án / thành tựu.
 *
 * Sống TRONG ô thông tin, ngay dưới phần giới thiệu, chứ không nằm dưới dải tab: bốn con số
 * này mô tả CON NGƯỜI, nên chúng thuộc về khối danh tính. Đặt dưới dải tab thì chúng trông
 * như thuộc riêng tab Tổng quan, và biến mất khi người xem chuyển tab — trong khi thứ chúng
 * mô tả thì không đổi.
 *
 * Số dự án và thành tựu lấy từ độ dài mảng mà endpoint hồ sơ công khai trả về NGUYÊN VẸN,
 * nên là số chính xác chứ không phải số của một trang.
 */
export const ProfileStatsRow = ({ profile }: { profile: PublicProfile }) => {
    const t = useTranslations()

    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ProfileStat
                icon={<UsersThreeIcon className="size-5" aria-hidden focusable="false" />}
                value={profile.followers.toLocaleString()}
                label={t("profile.community.connections.followers")}
            />
            <ProfileStat
                icon={<UserPlusIcon className="size-5" aria-hidden focusable="false" />}
                value={profile.following.toLocaleString()}
                label={t("profile.community.connections.following")}
            />
            <ProfileStat
                icon={<StackIcon className="size-5" aria-hidden focusable="false" />}
                value={profile.projects.length.toLocaleString()}
                label={t("publicProfile.stats.projects")}
            />
            <ProfileStat
                icon={<MedalIcon className="size-5" aria-hidden focusable="false" />}
                value={profile.achievements.length.toLocaleString()}
                label={t("publicProfile.stats.achievements")}
            />
        </div>
    )
}
