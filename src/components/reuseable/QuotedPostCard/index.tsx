"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { UserLink } from "@/components/features/identity"
import { unwrapAutolinks } from "@/components/features/community/CommunityPostDetail/postLinks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** The embedded post shown inside a repost/quote. */
export interface QuotedPost {
    author: string
    authorUsername: string
    title: string
    snippet: string
    /**
     * Bài gốc còn khả dụng hay không (BE `QuotedPost.available`). **ABSENT = khả dụng**: khung xem
     * trước trong composer dựng vật thể này bằng tay và không có trường này — mặc định `false` sẽ
     * biến nó thành "bài không còn khả dụng" ngay lúc người dùng đang soạn. Vì thế nơi render phải
     * kiểm bằng `=== false`, KHÔNG phải `!available`.
     */
    available?: boolean
}

/** Props for {@link QuotedPostCard}. */
export interface QuotedPostCardProps extends WithClassNames<undefined> {
    /** The quoted post to embed. */
    post: QuotedPost
}

/**
 * Bordered, rounded card embedding a quoted/reposted community post — the author
 * line plus the post's title and snippet. Rendered inside the composer's quote
 * preview, inside a repost feed row, and on the repost's detail page. Purely
 * presentational; the author is a real {@link UserLink} hovercard.
 *
 * `available === false` (bài gốc đã xoá/ẩn hoặc thuộc nhóm kín) thay TOÀN BỘ ruột card bằng một
 * dòng nhãn: BE đã cố ý không gửi tác giả/tiêu đề/nội dung trong trường hợp đó, nên card không có
 * gì để vẽ và cũng KHÔNG được tự bịa ra.
 *
 * `snippet` in ra dưới dạng TEXT THUẦN nên chạy qua {@link unwrapAutolinks} ngay tại đây:
 * card này không có mapper riêng — quote mở từ dòng feed đã sạch (`toCommunityPost`), nhưng
 * caller nào dựng `QuotedPost` từ snippet THÔ thì cặp `<>` của autolink `<https://…>` vẫn
 * lộ ra. Helper idempotent nên chạy hai lần vô hại.
 *
 * @param props - {@link QuotedPostCardProps}
 */
export const QuotedPostCard = ({ post, className }: QuotedPostCardProps) => {
    const t = useTranslations("communityHub")

    // `=== false` chứ không phải `!post.available`: absent nghĩa là khả dụng (xem JSDoc của trường).
    if (post.available === false) {
        return (
            <div className={cn("rounded-large border border-separator p-3", className)}>
                <Typography type="body-sm" color="muted">
                    {t("feed.quoteUnavailable")}
                </Typography>
            </div>
        )
    }

    return (
        <div className={cn("rounded-large border border-separator p-3", className)}>
            <div className="flex items-center gap-2">
                <UserLink
                    username={post.authorUsername}
                    displayName={post.author}
                    hideName
                    size="sm"
                    classNames={{ avatar: "size-6" }}
                />
                <UserLink username={post.authorUsername} displayName={post.author} showAvatar={false} />
            </div>
            {post.title ? (
                <Typography type="body-sm" weight="medium" className="mt-1">
                    {post.title}
                </Typography>
            ) : null}
            {post.snippet ? (
                <Typography type="body-sm" color="muted" className="line-clamp-3">
                    {unwrapAutolinks(post.snippet)}
                </Typography>
            ) : null}
        </div>
    )
}
