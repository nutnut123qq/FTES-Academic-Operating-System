import {
    BellIcon,
    BookOpenIcon,
    CalendarBlankIcon,
    ChatCircleTextIcon,
    ClockIcon,
    CoinsIcon,
    type Icon,
    TrophyIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"

/**
 * Icon per backend {@link NotificationType} value — ONE key space for both the
 * glyph on each delivered notification row (bell popover + center) and the
 * per-type toggle rows in the preferences surface (the enum values ARE the
 * backend `vn.ftes.aos.notification.domain.NotificationType` names).
 */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, Icon> = {
    [NotificationType.Mention]: ChatCircleTextIcon,
    [NotificationType.Course]: BookOpenIcon,
    [NotificationType.Event]: CalendarBlankIcon,
    [NotificationType.Deadline]: ClockIcon,
    [NotificationType.Challenge]: TrophyIcon,
    [NotificationType.Coin]: CoinsIcon,
    [NotificationType.Group]: UsersThreeIcon,
    [NotificationType.System]: BellIcon,
}

/**
 * Resolve the icon for a delivered notification's backend `type` string, with a
 * bell fallback so a new/unknown backend type never crashes the row.
 *
 * @param type - the backend `NotificationType` name (e.g. `COURSE`).
 * @returns the matching phosphor icon, or the bell fallback.
 */
export const resolveNotificationIcon = (type: string): Icon =>
    NOTIFICATION_TYPE_ICON[type as NotificationType] ?? BellIcon
