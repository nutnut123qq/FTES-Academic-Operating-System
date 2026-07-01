"use client"

import useSWR from "swr"

/** A comment on a post. */
export interface PostComment {
    id: string
    author: string
    text: string
    timeLabel: string
}

/** Full post detail (§6, mock until BE lands). */
export interface PostDetail {
    id: string
    author: string
    timeLabel: string
    title: string
    body: string
    likes: number
    comments: Array<PostComment>
}

// ponytail: mock BE — no community endpoint yet. Derives from the id.
const fetchPostDetailMock = async (postId: string): Promise<PostDetail> => ({
    id: postId,
    author: "Minh Trần",
    timeLabel: "1 giờ trước",
    title: "Chia sẻ lộ trình học Backend",
    body: "Mình tổng hợp lộ trình 6 tháng từ con số 0: tháng 1-2 nền tảng ngôn ngữ, tháng 3-4 database + API, tháng 5-6 dự án thật. Ai cần chi tiết comment nhé!",
    likes: 42,
    comments: [
        { id: "pc1", author: "An", text: "Cảm ơn bạn, rất hữu ích!", timeLabel: "45 phút trước" },
        { id: "pc2", author: "Hoa", text: "Cho mình xin thêm tài liệu phần API với.", timeLabel: "20 phút trước" },
    ],
})

/** Loads a post's detail. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryPostDetailSwr = (postId: string) => {
    const { data, isLoading, error } = useSWR(
        ["post-detail", postId],
        () => fetchPostDetailMock(postId),
    )
    return { post: data, isLoading, error }
}
