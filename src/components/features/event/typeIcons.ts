import {
    CalendarIcon,
    ChalkboardTeacherIcon,
    ConfettiIcon,
    TrophyIcon,
    VideoCameraIcon,
    WrenchIcon,
} from "@phosphor-icons/react"
import type { EventType } from "./hooks/useQueryEventsSwr"

/**
 * Icon theo loại sự kiện — dùng chung cho card catalog, trang chi tiết và rail cộng đồng
 * (cùng họ `course/tierLabels.ts`: bảng tra dùng lại giữa nhiều feature nên đứng riêng,
 * không nằm trong component, để 3 nơi không trôi khỏi nhau).
 */
export const TYPE_ICON: Record<EventType, typeof CalendarIcon> = {
    webinar: VideoCameraIcon,
    workshop: WrenchIcon,
    hackathon: ChalkboardTeacherIcon,
    competition: TrophyIcon,
    meetup: ConfettiIcon,
}
