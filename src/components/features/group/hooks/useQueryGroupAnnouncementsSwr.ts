"use client"

import useSWR from "swr"

/** A group announcement (§7, mock until BE lands). */
export interface GroupAnnouncement {
    id: string
    title: string
    body: string
    timeLabel: string
}

// ponytail: mock BE — no announcement endpoint yet. Deterministic sample.
const fetchAnnouncementsMock = async (): Promise<Array<GroupAnnouncement>> => [
    { id: "an1", title: "Lịch sinh hoạt tháng 7", body: "CLB sinh hoạt vào tối thứ 6 hằng tuần tại phòng lab A.", timeLabel: "2 ngày trước" },
    { id: "an2", title: "Tuyển thành viên ban nội dung", body: "Đăng ký qua form trong tab Tài nguyên trước 15/07.", timeLabel: "5 ngày trước" },
]

/** Loads a group's announcements. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupAnnouncementsSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group-announcements", groupId], () => fetchAnnouncementsMock())
    return { announcements: data ?? [], isLoading, error }
}
