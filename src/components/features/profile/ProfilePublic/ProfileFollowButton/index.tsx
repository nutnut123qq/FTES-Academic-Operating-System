"use client"

import React from "react"
import { Button, Spinner } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useMutateFollowUserSwr } from "@/components/features/identity/UserLink/useMutateFollowUserSwr"
import { useQueryFollowedUserIdsSwr } from "@/components/features/identity/UserLink/useQueryFollowedUserIdsSwr"
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
 * chứ KHÔNG phải `/profiles/{username}/follow`: hai endpoint đó ghi vào HAI bảng khác nhau
 * (`community.follows` vs `profile.follows`) mà không có cầu nối nào.
 *
 * ĐỌC cờ cũng phải hỏi ĐÚNG cái bảng vừa ghi, nếu không nút reset sau F5. `profile.isFollowedByMe`
 * (từ `GET /profiles/{username}`) đang KHÔNG dùng được làm nguồn sự thật: trong service core,
 * `PublicProfileAssembler` hỏi `FollowStatusPort` mà bean thật chưa được nối (adapter sang
 * community nằm ở service khác), nên stub trả `false` cho mọi cặp người xem/người được xem.
 * Trước F5 nút vẫn đúng chỉ vì vá lạc quan trong cache SWR; F5 xoá cache là về `false`.
 * Vì vậy cờ đọc từ {@link useQueryFollowedUserIdsSwr} — `GET /api/v1/community/follows/me?userIds=`,
 * có bearer, do service community trả lời, đọc thẳng `community.follows` = đúng bảng đường ghi vừa
 * đụng — và cùng lô cache mà `toggleFollow` vá lạc quan nên rollback vẫn chạy y như cũ.
 * `profile.isFollowedByMe` chỉ còn là giá trị TẠM lúc lô batch chưa có câu trả lời (và sẽ tự đúng
 * trở lại khi BE nối `FollowStatusPort` thật).
 *
 * ponytail: truyền nguyên `profile` thay vì 3 prop rời — hook seed lô hovercard từ chính
 * object này khi cache còn trống, nên đưa đủ tên/avatar/counter thì thẻ hover mở ra không
 * chớp một khoảnh trống. Cụm i18n dùng lại `hovercard.*` của `<UserLink>`: câu chữ khớp 100%.
 */
export const ProfileFollowButton = ({ profile }: { profile: PublicProfile }) => {
    const t = useTranslations()
    const { toggleFollow, isPending } = useMutateFollowUserSwr()
    const { data: followedIds, error, isLoading, isFollowing } = useQueryFollowedUserIdsSwr([profile.userId])

    // Chưa có câu trả lời của lô batch (đang bay, hoặc khách chưa đăng nhập nên hook không gọi)
    // thì tạm dùng cờ của hồ sơ — đỡ chớp nhãn, và tự đúng khi BE nối cổng follow thật.
    const followed = followedIds ? isFollowing(profile.userId) : profile.isFollowedByMe

    // `followedIds` vắng mặt KHÔNG chỉ có nghĩa "đang bay": `fetchFollowedUserIds` throw khi
    // MỌI lot fail (401 hết phiên, 429, mất mạng), và `keepPreviousData` cũng không cứu được
    // lần tải nguội. Cả hai trường hợp đều rơi về `profile.isFollowedByMe` — trường mà service
    // core đang stub `false` CỨNG — nên nút lại mời "Theo dõi" đúng người mình đang theo dõi,
    // và cú bấm sẽ ghi lên một quan hệ đã tồn tại. Chưa biết thì KHÔNG cho bấm, chứ không đoán;
    // riêng lúc đang bay thì để nút ở trạng thái chờ, đỡ nháy nhãn/variant sau đúng 1 RTT.
    // (Khách chưa đăng nhập: hook không gọi ⇒ không loading, không lỗi ⇒ nút vẫn bấm được và
    // rơi vào cổng đăng nhập của `toggleFollow` như cũ.)
    const unanswered = !followedIds && (isLoading || Boolean(error))

    return (
        <Button
            size="sm"
            className="ml-auto shrink-0"
            variant={followed ? "secondary" : "primary"}
            isPending={isPending || isLoading}
            isDisabled={isPending || unanswered}
            onPress={() =>
                void toggleFollow({
                    id: profile.userId,
                    username: profile.username,
                    displayName: profile.name,
                    bio: profile.about,
                    avatar: profile.avatarUrl,
                    followerCount: profile.followers,
                    followingCount: profile.following,
                    isFollowedByMe: followed,
                })
            }
        >
            {({ isPending: pending }) => (
                <>
                    {pending ? <Spinner color="current" size="sm" /> : null}
                    {t(followed ? "hovercard.unfollow" : "hovercard.follow")}
                </>
            )}
        </Button>
    )
}
