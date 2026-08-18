"use client"

import React from "react"
import { Button, Spinner } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useMutateFollowUserSwr } from "@/components/features/identity/UserLink/useMutateFollowUserSwr"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"

/**
 * Nút "Theo dõi / Đang theo dõi" của hồ sơ công khai, đặt cuối hàng danh tính trong hero.
 *
 * Ghi qua ĐÚNG một đường: {@link useMutateFollowUserSwr} — cùng cái mà `<UserLink>` dùng.
 * Hook đó đã lo trọn bộ (chặn khách bằng `useRequireAuth`, `isPending`, vá lạc quan, rollback,
 * toast theo mã lỗi) và quan trọng hơn: nó vá CẢ BA lô cache đang cùng giữ cờ follow —
 * hovercard, lô batch của các hàng danh sách, và lô `public-profile` của chính trang này.
 * Tự gọi `followUser`/`unfollowUser` ở đây thì hai lô kia đứng im, nên follow ở hồ sơ xong
 * quay lại feed vẫn thấy "Theo dõi" suốt `dedupingInterval`.
 *
 * Đường ghi là CỘNG ĐỒNG (`PUT` / `DELETE /api/v1/community/follows/{userId}`, đều idempotent)
 * chứ KHÔNG phải `/profiles/{username}/follow`: cờ `isFollowedByMe` mà nút này hiển thị được
 * `PublicProfileAssembler` hỏi `FollowStatusPort` → `community.follows`, còn endpoint của module
 * profile ghi vào một bảng KHÁC (`profile.follows`) mà không có cầu nối nào.
 *
 * ponytail: truyền nguyên `profile` thay vì 3 prop rời — hook seed lô hovercard từ chính
 * object này khi cache còn trống, nên đưa đủ tên/avatar/counter thì thẻ hover mở ra không
 * chớp một khoảnh trống. Cụm i18n dùng lại `hovercard.*` của `<UserLink>`: câu chữ khớp 100%.
 */
export const ProfileFollowButton = ({ profile }: { profile: PublicProfile }) => {
    const t = useTranslations()
    const { toggleFollow, isPending } = useMutateFollowUserSwr()

    return (
        <Button
            size="sm"
            className="ml-auto shrink-0"
            variant={profile.isFollowedByMe ? "secondary" : "primary"}
            isPending={isPending}
            isDisabled={isPending}
            onPress={() =>
                void toggleFollow({
                    id: profile.userId,
                    username: profile.username,
                    displayName: profile.name,
                    bio: profile.about,
                    avatar: profile.avatarUrl,
                    followerCount: profile.followers,
                    followingCount: profile.following,
                    isFollowedByMe: profile.isFollowedByMe,
                })
            }
        >
            {({ isPending: pending }) => (
                <>
                    {pending ? <Spinner color="current" size="sm" /> : null}
                    {t(profile.isFollowedByMe ? "hovercard.unfollow" : "hovercard.follow")}
                </>
            )}
        </Button>
    )
}
