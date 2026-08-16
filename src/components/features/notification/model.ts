import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"

/**
 * Notification rows → what the user actually reads.
 *
 * Unlike the activity timeline, the BE *does* render notification `title`/`body`
 * into prose before storing them, so the happy path needs no mapping here. This
 * module exists for the two ways that rendering degrades into machine output,
 * both of which have already reached real users:
 *
 * 1. **Template miss → the raw enum name.** `NotificationContentBuilder.build`
 *    (BE `notification/service/NotificationContentBuilder.java:55`) ends with
 *    `new Content(event.notificationType().name(), null)` whenever the dispatched
 *    `templateCode` has no `IN_APP` row in `notification.templates` and no
 *    `titleRaw` was sent. The row is then stored with title `"EVENT"` and an
 *    empty body, and the bell/centre print it verbatim. Observed twice already —
 *    see the migration comments on `V296__event_reminder_template.sql` ("rơi
 *    xuống fallback cuối, title = tên type \"EVENT\"") and
 *    `V302__event_notification_templates_vn_time.sql` ("Đã quan sát thật khi huỷ
 *    event thử 2026-08-10"). Each was patched by seeding one more template; the
 *    NEXT unseeded `templateCode` fails exactly the same way.
 *
 * 2. **Placeholders that survive rendering.** `TemplateRenderer` only substitutes
 *    `{{name}}` where `name` matches `[a-zA-Z0-9_.]+`; a missing variable becomes
 *    an empty string (a hole, not a brace), but a placeholder the regex does not
 *    recognise — `{{event-title}}`, or an admin-authored template from
 *    `POST /api/v1/admin/notification/templates` — passes straight through to the
 *    screen as literal `{{…}}`.
 *
 * Neither can be fixed from the FE at the source. What the FE can guarantee is
 * that **no notification row ever shows a technical identifier, a bare `{{…}}`,
 * or an empty headline**: {@link resolveNotificationDisplay} substitutes a
 * translated per-type sentence instead. Adding a type below is optional;
 * forgetting to is safe (it lands on the generic fallback).
 */

/** Leaf under `notifications.typeFallback` used when the type is unknown to the FE. */
export const NOTIFICATION_FALLBACK_UNKNOWN_KEY = "UNKNOWN"

/**
 * Every backend `vn.ftes.aos.notification.domain.NotificationType` name, including
 * the eight transactional ones that {@link NotificationType} does not model because
 * they are e-mail-only today (the `notification.notifications` CHECK constraint from
 * V33/V183 rejects them in-app). They are listed anyway: the enum is the key space of
 * `item.type`, so the day that CHECK is widened these rows arrive with nothing but
 * their type name to show.
 */
const FALLBACK_KEY_BY_TYPE: Readonly<Record<string, string>> = {
    // in-app types (V33/V183 CHECK constraint)
    [NotificationType.Mention]: "MENTION",
    [NotificationType.Course]: "COURSE",
    [NotificationType.Event]: "EVENT",
    [NotificationType.Deadline]: "DEADLINE",
    [NotificationType.Challenge]: "CHALLENGE",
    [NotificationType.Coin]: "COIN",
    [NotificationType.Group]: "GROUP",
    [NotificationType.System]: "SYSTEM",

    // transactional types — e-mail-only today, see the doc comment above
    EMAIL_VERIFY: "EMAIL_VERIFY",
    PASSWORD_RESET: "PASSWORD_RESET",
    EMAIL_OTP: "EMAIL_OTP",
    SMS_OTP: "SMS_OTP",
    SECURITY_ALERT: "SECURITY_ALERT",
    RBAC_CHANGE: "RBAC_CHANGE",
    EXPORT_DONE: "EXPORT_DONE",
    CTV_INVITE: "CTV_INVITE",
}

/** Every leaf this module can return — used by the test to check both catalogs. */
export const NOTIFICATION_FALLBACK_KEYS: ReadonlyArray<string> = [
    ...new Set([
        ...Object.values(FALLBACK_KEY_BY_TYPE),
        NOTIFICATION_FALLBACK_UNKNOWN_KEY,
    ]),
]

/**
 * Resolves a backend `NotificationType` name to its leaf under
 * `notifications.typeFallback`. An unknown (or empty) type resolves to
 * {@link NOTIFICATION_FALLBACK_UNKNOWN_KEY} — the raw name is never handed back.
 *
 * @param type - the backend type name carried on the row (e.g. `COURSE`).
 * @returns the message leaf to translate.
 */
export const notificationFallbackKey = (type: string | null | undefined): string =>
    (type && FALLBACK_KEY_BY_TYPE[type]) || NOTIFICATION_FALLBACK_UNKNOWN_KEY

/** Backend type names, used to recognise a title that is just the enum name. */
const TYPE_NAMES: ReadonlySet<string> = new Set(Object.keys(FALLBACK_KEY_BY_TYPE))

/**
 * A dotted/hyphenated lowercase identifier — the shape of a `templateCode`
 * (`event-reminder`, `course.access_expiring`, `chat.new-message`). Deliberately
 * narrow: prose never matches it, so an admin broadcast titled "SALE" or
 * "Khai giảng" is left alone.
 */
const TEMPLATE_CODE = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/

/** Mustache placeholder the BE renderer did not substitute. */
const UNRESOLVED_PLACEHOLDER = /\{\{[^{}]*\}\}/g

/**
 * True when a BE-rendered string is a machine identifier rather than a sentence:
 * a bare `NotificationType` name (`EVENT`) or a `templateCode`
 * (`course.access_expiring`). Blank input is NOT machine text — callers treat
 * "empty" separately.
 *
 * @param text - the server-rendered title or body.
 * @returns whether the string must be replaced before it reaches the screen.
 */
export const isMachineText = (text: string | null | undefined): boolean => {
    const trimmed = text?.trim() ?? ""
    return trimmed.length > 0
        && (TYPE_NAMES.has(trimmed) || TEMPLATE_CODE.test(trimmed))
}

/**
 * Drops `{{placeholder}}` tokens the BE renderer left unresolved and collapses the
 * whitespace they leave behind. Only double-brace tokens are removed: single braces
 * are legitimate in user-authored broadcast text.
 *
 * @param text - the server-rendered title or body.
 * @returns the same string with unresolved placeholders removed.
 */
export const stripUnresolvedPlaceholders = (text: string): string =>
    text.replace(UNRESOLVED_PLACEHOLDER, " ").replace(/\s{2,}/g, " ").trim()

/** The strings a notification row should actually render. */
export interface NotificationDisplay {
    /** Headline — always a human sentence, never empty. */
    title: string
    /** Supporting line, or null when there is nothing worth a second line. */
    body: string | null
}

/**
 * Turns a delivered notification into safe display strings.
 *
 * - unresolved `{{…}}` placeholders are stripped from both fields;
 * - a title that is blank or a machine identifier is replaced by the translated
 *   per-type sentence;
 * - a body that is blank, a machine identifier, or a duplicate of the title is
 *   dropped (the BE emits title === body whenever a template has no `subject`,
 *   see `NotificationContentBuilder.build`).
 *
 * @param notification - the delivered row (`type`, server-rendered `title`/`body`).
 * @param translateFallback - resolves a leaf of `notifications.typeFallback`.
 * @returns the title and body to render.
 */
export const resolveNotificationDisplay = (
    notification: { type: string, title: string | null, body: string | null },
    translateFallback: (key: string) => string,
): NotificationDisplay => {
    const rawTitle = stripUnresolvedPlaceholders(notification.title ?? "")
    const rawBody = stripUnresolvedPlaceholders(notification.body ?? "")

    // A string equal to the row's OWN type name is the BE's last-resort fallback
    // verbatim, whether or not the FE has heard of that type — the one check that
    // also covers a type shipped after this file was written. It cannot misfire on
    // human text: a SYSTEM broadcast titled "SALE" is not the string "SYSTEM".
    const echoesOwnType = (text: string) => text === notification.type?.trim()
    const machine = (text: string) => isMachineText(text) || echoesOwnType(text)

    const title = rawTitle.length > 0 && !machine(rawTitle)
        ? rawTitle
        : translateFallback(notificationFallbackKey(notification.type))

    const body = rawBody.length > 0 && !machine(rawBody) && rawBody !== title
        ? rawBody
        : null

    return { title, body }
}
