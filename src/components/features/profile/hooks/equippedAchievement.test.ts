import { describe, expect, it, vi } from "vitest"
import type { PublicProfile as PublicProfileDto, SelfProfile } from "@/modules/api/rest/profile"

/**
 * Mappers — the pinned THÀNH TÍCH reaching the two profile HEADERS.
 *
 * Neither header renders through `UserLink` (they draw the name with raw
 * `Typography` + `StaffBadge`), so the mark only appears there if these two view
 * models carry the field. The JSX beside the staff badge is one line; THIS is the
 * part that can silently break.
 *
 * The object is carried WHOLE rather than flattened to a code the way
 * `avatarFrame` → `avatarFrameCode` is: the mark needs the artwork and the name to
 * draw, and the profile read already supplies both — flattening would force the
 * renderer to go re-fetch the catalog for what it just threw away.
 *
 * Both mappers must fold `undefined` (backend has not shipped the field) into the
 * same `null` as "nothing pinned", so no renderer has to know which it is looking at.
 */

vi.mock("swr", () => ({ default: vi.fn() }))
vi.mock("next-intl", () => ({ useLocale: () => "vi" }))
vi.mock("@/redux/hooks", () => ({ useAppSelector: vi.fn() }))
vi.mock("@/hooks/swr/viewerScope", () => ({ useViewerScopeId: vi.fn() }))
vi.mock("@/modules/api/rest/profile", () => ({
    getSelfProfile: vi.fn(),
    getPublicProfile: vi.fn(),
}))

const { toShellProfile } = await import("./useQueryProfileSwr")
const { toPublicProfile } = await import("./useQueryPublicProfileSwr")

const PINNED = {
    code: "FIRST_LESSON",
    name: "Bài học đầu tiên",
    kind: "TROPHY",
    iconUrl: "https://cdn.example/first-lesson.png",
}

const selfDto = (over: Partial<SelfProfile> = {}) =>
    ({ userId: "u-1", username: "minh", displayName: "Minh Trần", ...over }) as SelfProfile

const publicDto = (over: Partial<PublicProfileDto> = {}) =>
    ({ userId: "u-1", username: "minh", displayName: "Minh Trần", ...over }) as PublicProfileDto

describe("profile headers — the pinned achievement in the view models", () => {
    it("carries the WHOLE achievement (art + name) onto the self header model", () => {
        expect(toShellProfile(selfDto({ equippedAchievement: PINNED })).equippedAchievement)
            .toEqual(PINNED)
    })

    it("carries the WHOLE achievement onto the public header model", () => {
        expect(toPublicProfile(publicDto({ equippedAchievement: PINNED })).equippedAchievement)
            .toEqual(PINNED)
    })

    it("folds 'nothing pinned' and 'backend has not shipped the field' into the same null", () => {
        for (const dto of [selfDto({ equippedAchievement: null }), selfDto()]) {
            expect(toShellProfile(dto).equippedAchievement).toBeNull()
        }
        for (const dto of [publicDto({ equippedAchievement: null }), publicDto()]) {
            expect(toPublicProfile(dto).equippedAchievement).toBeNull()
        }
    })
})
