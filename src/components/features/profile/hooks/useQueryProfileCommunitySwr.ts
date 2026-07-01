"use client"

import useSWR from "swr"

/** An activity-timeline entry. */
export interface ActivityEntry {
    id: string
    text: string
    timeLabel: string
}

/** Community payload for the profile (§2/§18). */
export interface ProfileCommunity {
    followers: number
    following: number
    activity: Array<ActivityEntry>
}

// ponytail: mock BE — no activity endpoint yet. Deterministic sample.
const fetchCommunityMock = async (): Promise<ProfileCommunity> => ({
    followers: 128,
    following: 84,
    activity: [
        { id: "a1", text: "Hoàn thành bài học “Con trỏ cơ bản”", timeLabel: "2 giờ trước" },
        { id: "a2", text: "Đăng câu hỏi trong cộng đồng PRF192", timeLabel: "hôm qua" },
        { id: "a3", text: "Nhận huy hiệu “7 ngày liên tục”", timeLabel: "3 ngày trước" },
        { id: "a4", text: "Tham gia môn CSD201", timeLabel: "1 tuần trước" },
    ],
})

/** Loads the viewer's community/activity. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProfileCommunitySwr = () => {
    const { data, isLoading, error } = useSWR(["profile-community", "me"], () => fetchCommunityMock())
    return { community: data, isLoading, error }
}
