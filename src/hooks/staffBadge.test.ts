import { describe, expect, it } from "vitest"
import { StaffRole, staffBadgeFor } from "./useViewerStaffRole"

/**
 * Pins the role → badge rule the owner chose (2026-08-16): admin AND mentor wear the
 * verified seal, a moderator wears a shield, everybody else wears nothing.
 *
 * Every identity surface reads the rule through this one function, so these cases are
 * simultaneously the contract for the profile hero, the community feed, comments, the
 * group member list and the account menu.
 *
 * The MODERATOR / mentor cases cannot be checked against apitest — that box only has
 * ADMIN accounts (no MODERATOR, no SUPER_ADMIN, no GLOBAL LECTURER), so "the shield
 * never appears" there is a data fact, not a defect. Hence the fixtures below.
 */
describe("staffBadgeFor", () => {
    it("gives an administrator the verified seal", () => {
        expect(staffBadgeFor("ADMIN")).toEqual({
            role: StaffRole.Admin,
            kind: "verified",
            labelKey: "verifiedBadge.role.admin",
            descriptionKey: "verifiedBadge.description",
        })
    })

    it("gives a super admin the verified seal", () => {
        expect(staffBadgeFor("SUPER_ADMIN")?.kind).toBe("verified")
    })

    /**
     * The mentor tier arrives on the wire as `LECTURER`: identity seeds no `MENTOR`
     * role, and LECTURER is the only teaching role grantable at GLOBAL scope.
     */
    it("gives a mentor (BE code LECTURER) the verified seal", () => {
        expect(staffBadgeFor("LECTURER")).toEqual({
            role: StaffRole.Mentor,
            kind: "verified",
            labelKey: "verifiedBadge.role.mentor",
            descriptionKey: "verifiedBadge.description",
        })
    })

    it("gives a moderator the shield, not the seal", () => {
        expect(staffBadgeFor("MODERATOR")).toEqual({
            role: StaffRole.Moderator,
            kind: "shield",
            labelKey: "verifiedBadge.role.moderator",
            descriptionKey: "verifiedBadge.moderatorDescription",
        })
    })

    it("gives an ordinary member no badge", () => {
        expect(staffBadgeFor("STUDENT")).toBeNull()
    })

    /**
     * An unknown / future / misspelled code must degrade to NO badge. The failure this
     * guards against is rendering a raw wire string next to a person's name, or worse
     * crashing on a missing i18n key, the day identity seeds a new role.
     */
    it.each(["CTV", "ADMIN_COMMUNITY", "admin", "GLOBAL_OVERLORD", ""])(
        "gives no badge for the unrecognized code %j",
        (code) => {
            expect(staffBadgeFor(code)).toBeNull()
        },
    )

    it("gives no badge when the role is absent", () => {
        expect(staffBadgeFor(null)).toBeNull()
        expect(staffBadgeFor(undefined)).toBeNull()
    })
})
