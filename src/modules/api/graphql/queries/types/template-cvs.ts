import type { GraphQLResponse } from "../../types"
import type { TemplateCVEntity } from "@/modules/types/entities/template-cv"

/** Apollo response shape for the `templateCvs` query. */
export interface QueryTemplateCvsResponse {
    /** Top-level `templateCvs` field wrapping the standard API response containing the array of templates. */
    templateCvs: GraphQLResponse<Array<TemplateCVEntity>>
}
