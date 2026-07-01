import type { GraphQLResponse } from "../../types"
import type { HeadhuntingCompanyEntity } from "@/modules/types/entities/headhunting-company"

/** Request body for the `headhuntingCompany` query (mirrors GraphQL `HeadhuntingCompanyRequest`). */
export interface HeadhuntingCompanyRequest {
    /** The primary id of the headhunting company to fetch. */
    id?: string
    /** The display id of the headhunting company to fetch. */
    displayId?: string
}

/** Apollo response shape for the `headhuntingCompany` query. */
export interface QueryHeadhuntingCompanyResponse {
    /** Top-level `headhuntingCompany` field wrapping the standard API response. */
    headhuntingCompany: GraphQLResponse<HeadhuntingCompanyEntity>
}
