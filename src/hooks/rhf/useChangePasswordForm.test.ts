import { describe, expect, it } from "vitest"
import {
    PASSWORD_MIN_LENGTH,
    createChangePasswordSchema,
} from "./useChangePasswordForm"

/**
 * Unit — the change-password validation rules.
 *
 * The schema is built from injected copy (the hook feeds it `t(...)` inside a `useMemo`)
 * precisely so it can be exercised here without React or a locale: what is asserted is
 * the RULE and the field the error lands on, not the wording.
 */

const messages = {
    required: "required",
    tooShort: "tooShort",
    weak: "weak",
    mismatch: "mismatch",
    sameAsCurrent: "sameAsCurrent",
}

const schema = createChangePasswordSchema(messages)

/**
 * Runs the schema and returns `{ field: message }`, keeping the FIRST issue per field —
 * zod reports every failed check on a field (empty string fails "required", "too short"
 * AND "weak" at once), while react-hook-form renders only the first.
 */
const errorsFor = (values: Record<string, string>): Record<string, string> => {
    const result = schema.safeParse(values)
    if (result.success) {
        return {}
    }
    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
        const field = String(issue.path[0])
        errors[field] ??= issue.message
    }
    return errors
}

describe("createChangePasswordSchema", () => {
    it("accepts a valid change", () => {
        expect(
            schema.safeParse({
                currentPassword: "oldPass1",
                newPassword: "newPass1",
                confirmPassword: "newPass1",
            }).success,
        ).toBe(true)
    })

    it("requires every field", () => {
        expect(
            errorsFor({ currentPassword: "", newPassword: "", confirmPassword: "" }),
        ).toMatchObject({
            currentPassword: "required",
            newPassword: "required",
            confirmPassword: "required",
        })
    })

    it("rejects a new password shorter than the backend minimum", () => {
        const short = "a1b2c3"
        expect(short.length).toBeLessThan(PASSWORD_MIN_LENGTH)
        expect(
            errorsFor({
                currentPassword: "oldPass1",
                newPassword: short,
                confirmPassword: short,
            }).newPassword,
        ).toBe("tooShort")
    })

    it("rejects a long password with no digit, and one with no letter", () => {
        expect(
            errorsFor({
                currentPassword: "oldPass1",
                newPassword: "onlyletters",
                confirmPassword: "onlyletters",
            }).newPassword,
        ).toBe("weak")
        expect(
            errorsFor({
                currentPassword: "oldPass1",
                newPassword: "12345678",
                confirmPassword: "12345678",
            }).newPassword,
        ).toBe("weak")
    })

    it("reports a mismatch on the confirmation field", () => {
        expect(
            errorsFor({
                currentPassword: "oldPass1",
                newPassword: "newPass1",
                confirmPassword: "newPass2",
            }),
        ).toMatchObject({ confirmPassword: "mismatch" })
    })

    it("rejects reusing the current password", () => {
        expect(
            errorsFor({
                currentPassword: "samePass1",
                newPassword: "samePass1",
                confirmPassword: "samePass1",
            }).newPassword,
        ).toBe("sameAsCurrent")
    })
})
