import type { GraphQLResponse } from "../../types"

/** Reason a visitor is contacting FTES AOS (wire value matches the i18n key). */
export type ContactCategory = "course_support" | "partnership" | "general"

/** GraphQL `SubmitContactRequest` body for the public contact form. */
export interface SubmitContactRequest {
    /** Sender's display name. */
    name: string
    /** Sender's email (used as the reply-to of the delivered message). */
    email: string
    /** Reason for contacting (routes + labels the email). */
    category: ContactCategory
    /** The message body. */
    message: string
}

/** Apollo response shape for `submitContact` (no data — success envelope only). */
export interface MutateSubmitContactResponse {
    /** Top-level `submitContact` field wrapping the standard API response. */
    submitContact: GraphQLResponse
}
