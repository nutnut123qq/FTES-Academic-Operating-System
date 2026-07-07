import {
    BellIcon,
    BookOpenIcon,
    CalendarBlankIcon,
    ChatCircleTextIcon,
    CheckCircleIcon,
    ClockIcon,
    CodeIcon,
    CoinsIcon,
    type Icon,
    MegaphoneIcon,
    SealCheckIcon,
    TrophyIcon,
    UserPlusIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"

/**
 * Icon per backend {@link vn.ftes.aos.notification.domain.NotificationType} value
 * — the glyph rendered on each delivered notification row (bell popover +
 * center). Keyed by the real REST enum name; unknown types fall back to the bell
 * via {@link resolveNotificationIcon}.
 */
const BACKEND_TYPE_ICON: Record<string, Icon> = {
    MENTION: ChatCircleTextIcon,
    COURSE: BookOpenIcon,
    EVENT: CalendarBlankIcon,
    DEADLINE: ClockIcon,
    CHALLENGE: TrophyIcon,
    COIN: CoinsIcon,
    GROUP: UsersThreeIcon,
}

/**
 * Resolve the icon for a delivered notification's backend `type` string, with a
 * bell fallback so a new/unknown backend type never crashes the row.
 *
 * @param type - the backend `NotificationType` name (e.g. `COURSE`).
 * @returns the matching phosphor icon, or the bell fallback.
 */
export const resolveNotificationIcon = (type: string): Icon =>
    BACKEND_TYPE_ICON[type] ?? BellIcon

/**
 * Icon per (mock) preferences {@link NotificationType} — drives the per-type
 * toggle rows in the preferences surface. This enum is the FE-only preferences
 * mock's key space (distinct from the delivered notifications' backend types
 * handled by {@link resolveNotificationIcon}).
 */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, Icon> = {
    [NotificationType.System]: BellIcon,
    [NotificationType.ChallengeGraded]: TrophyIcon,
    [NotificationType.CodingGraded]: CodeIcon,
    [NotificationType.MilestoneGraded]: CheckCircleIcon,
    [NotificationType.NewFollower]: UserPlusIcon,
    [NotificationType.CommentReply]: ChatCircleTextIcon,
    [NotificationType.SubscriptionGranted]: SealCheckIcon,
    [NotificationType.Announcement]: MegaphoneIcon,
}
