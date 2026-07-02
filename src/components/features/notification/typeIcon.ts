import {
    AtIcon,
    CalendarDotsIcon,
    ClockCountdownIcon,
    CoinIcon,
    GraduationCapIcon,
    type Icon,
    LightningIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import type { NotificationType } from "./hooks/useQueryNotificationsSwr"

/**
 * Icon per notification type (§15) — the single source shared by the navbar
 * {@link import("@/components/features/navbar/Navbar/NotificationBell").NotificationBell}
 * popover and the {@link import("./NotificationCenter").NotificationCenter} page
 * so both render the same glyph for a given type.
 */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, Icon> = {
    mention: AtIcon,
    course: GraduationCapIcon,
    event: CalendarDotsIcon,
    deadline: ClockCountdownIcon,
    challenge: LightningIcon,
    coin: CoinIcon,
    group: UsersThreeIcon,
}
