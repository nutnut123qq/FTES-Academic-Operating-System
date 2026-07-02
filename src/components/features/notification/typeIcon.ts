import {
    BellIcon,
    ChatCircleTextIcon,
    CheckCircleIcon,
    CodeIcon,
    type Icon,
    MegaphoneIcon,
    SealCheckIcon,
    TrophyIcon,
    UserPlusIcon,
} from "@phosphor-icons/react"
import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"

/**
 * Icon per notification type — the single source shared by the navbar
 * {@link import("@/components/layouts/shell/Navbar/NotificationBell").NotificationBell}
 * popover and the {@link import("./NotificationCenter").NotificationCenter} page
 * so both render the same glyph for a given {@link NotificationType}. Keyed by
 * the real backend enum (8 values) — every type resolves to a concrete icon, no
 * fallback gap.
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
