import type { GraphQLResponse } from "../../types"
import type { HeadhuntingCompanyEntity } from "@/modules/types/entities/headhunting-company"

/** Apollo response shape for the `headhuntingCompanies` query. */
export interface QueryHeadhuntingCompaniesResponse {
    /** Top-level `headhuntingCompanies` field wrapping the standard API response containing the array of companies. */
    headhuntingCompanies: GraphQLResponse<Array<HeadhuntingCompanyEntity>>
}
