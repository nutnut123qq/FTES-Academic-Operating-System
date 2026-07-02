"use client"

import useSWR from "swr"

/** A pending join request (§7, mock until BE lands). */
export interface JoinRequest {
    id: string
    name: string
}

/** Group management payload. */
export interface GroupManage {
    joinRequests: Array<JoinRequest>
    rules: Array<string>
    pinned: Array<string>
}

// ponytail: mock BE — no group management endpoint yet. Deterministic sample.
const fetchManageMock = async (): Promise<GroupManage> => ({
    joinRequests: [
        { id: "jr1", name: "Đỗ Hoàng Nam" },
        { id: "jr2", name: "Trần Thị Y" },
    ],
    rules: [
        "Tôn trọng thành viên, không spam.",
        "Chia sẻ tài nguyên có bản quyền hợp lệ.",
        "Đặt câu hỏi rõ ràng, đúng chủ đề.",
    ],
    pinned: [
        "Nội quy nhóm & hướng dẫn tham gia",
        "Lộ trình học tập gợi ý cho thành viên mới",
    ],
})

/** Loads a group's management data. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupManageSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group-manage", groupId], () => fetchManageMock())
    return {
        joinRequests: data?.joinRequests ?? [],
        rules: data?.rules ?? [],
        pinned: data?.pinned ?? [],
        isLoading,
        error,
    }
}
