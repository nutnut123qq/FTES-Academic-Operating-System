"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import {
    CommunitySearchSort,
    useQueryCommunitySearchSwr,
    type CommunitySearchCriteria,
} from "../hooks/useQueryCommunitySearchSwr"
import { CommunityPoll, PollSkeleton } from "./index"

/**
 * Lọc Ở SERVER bằng `communitySearch(postType: "POLL")` — GraphQL `Post.kind` CHÍNH LÀ
 * `postType` (xem `PostEnricher`), nên bộ lọc này khớp đúng cái mà trang cũ phải tự bới
 * trong 20 item đầu của feed For You. Hằng số cấp module để định danh không đổi giữa các
 * lần render, nếu không khoá SWR đổi mỗi lần và danh sách nạp lại từ trang 1.
 */
const POLL_CRITERIA: CommunitySearchCriteria = {
    q: "",
    sort: CommunitySearchSort.Newest,
    postType: "POLL",
}

/** Ba khung xương xếp chồng — cùng hình dạng với hàng thật nên danh sách không nhảy khi tải xong. */
const PollListSkeleton = () => (
    <div className="flex flex-col divide-y divide-separator">
        {[0, 1, 2].map((index) => (
            <div key={index} className="px-4 py-3">
                <PollSkeleton />
            </div>
        ))}
    </div>
)

/**
 * Trang `/community/poll` — MỌI bài bình chọn đã đăng, mới nhất trước, cuộn vô hạn.
 *
 * Trang cũ mở được đúng MỘT poll: nó quét 20 item đầu của feed For You rồi lấy bài POLL
 * đầu tiên gặp được, nên poll thứ hai trở đi không còn lối vào và poll nằm sau item thứ 20
 * thì trang hiện rỗng dù hệ thống đang có poll.
 *
 * Mỗi hàng render thẳng {@link CommunityPoll} thay vì một link: thẻ poll vốn đã tự lo khoá
 * SWR riêng + bỏ phiếu lạc quan + rollback, nên bỏ phiếu ngay tại danh sách không tốn thêm
 * dòng code nào so với việc dựng một danh sách link mới.
 */
export const CommunityPollList = () => {
    const t = useTranslations("communityHub")
    const { posts, isLoading, isLoadingMore, error, hasMore, setSize, mutate } =
        useQueryCommunitySearchSwr(POLL_CRITERIA)

    return (
        <div className="flex flex-col">
            <div className="px-4 py-3">
                <Typography type="h5" weight="semibold">
                    {t("poll.title")}
                </Typography>
            </div>
            <AsyncContent
                isLoading={isLoading && posts.length === 0}
                skeleton={<PollListSkeleton />}
                isEmpty={posts.length === 0}
                emptyContent={{ title: t("poll.empty") }}
                error={posts.length === 0 ? error : undefined}
                errorContent={{
                    title: t("poll.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col divide-y divide-separator">
                    {posts.map((post) => (
                        <div key={post.id} className="px-4 py-3">
                            <CommunityPoll postId={post.id} />
                        </div>
                    ))}
                </div>
                <InfiniteScrollSentinel
                    onReach={() => void setSize((current) => current + 1)}
                    disabled={!hasMore || isLoadingMore}
                />
            </AsyncContent>
        </div>
    )
}
