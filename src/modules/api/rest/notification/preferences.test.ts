import { describe, expect, it } from "vitest"
import { NotificationType } from "@/modules/api/graphql/queries/types/notifications"
import {
    toNotificationPreferencesData,
    toPreferenceUpdates,
} from "./preferences"

describe("notification preference adapters", () => {
    it("includes order, comment and reaction in preference writes", () => {
        const updates = toPreferenceUpdates({ mutedTypes: [], muteAll: false })

        expect(updates.map((cell) => cell.type)).toEqual(
            expect.arrayContaining([
                NotificationType.Order,
                NotificationType.Comment,
                NotificationType.Reaction,
            ]),
        )
        expect(updates).toHaveLength(Object.values(NotificationType).length)
    })

    it("derives muted engagement types from the backend matrix", () => {
        const preferences = toNotificationPreferencesData([
            { type: NotificationType.Comment, channel: "IN_APP", enabled: false },
            { type: NotificationType.Reaction, channel: "IN_APP", enabled: false },
            { type: NotificationType.Order, channel: "IN_APP", enabled: true },
        ])

        expect(preferences).toEqual({
            mutedTypes: [NotificationType.Comment, NotificationType.Reaction],
            muteAll: false,
        })
    })
})
