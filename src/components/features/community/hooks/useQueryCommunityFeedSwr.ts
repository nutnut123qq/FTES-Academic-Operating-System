"use client"

import useSWR from "swr"

/** A community post (§6, mock until BE lands). */
export interface CommunityPost {
    id: string
    author: string
    timeLabel: string
    title: string
    snippet: string
    likes: number
    comments: number
}

// ponytail: mock BE — no community endpoint yet. Deterministic sample.
const fetchFeedMock = async (): Promise<Array<CommunityPost>> => [
    { id: "cp1", author: "Minh Trần", timeLabel: "1 giờ trước", title: "Chia sẻ lộ trình học Backend", snippet: "Mình tổng hợp lộ trình 6 tháng từ con số 0…", likes: 42, comments: 12 },
    { id: "cp2", author: "An Nguyễn", timeLabel: "3 giờ trước", title: "Hỏi về đồ án SWP391", snippet: "Nhóm mình đang phân vân chọn đề tài, mọi người tư vấn với…", likes: 8, comments: 5 },
    { id: "cp3", author: "Hoa Lê", timeLabel: "hôm qua", title: "Khoe chứng chỉ AWS đầu tiên", snippet: "Sau 2 tháng ôn cuối cùng cũng pass, cảm ơn cộng đồng…", likes: 130, comments: 24 },
]

/** Loads the community feed. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCommunityFeedSwr = () => {
    const { data, isLoading, error } = useSWR(["community-feed"], () => fetchFeedMock())
    return { posts: data ?? [], isLoading, error }
}
