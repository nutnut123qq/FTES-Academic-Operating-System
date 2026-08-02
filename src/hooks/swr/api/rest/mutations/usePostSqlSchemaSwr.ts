"use client"

import useSWRMutation from "swr/mutation"
import { sqlSchema } from "@/modules/api/rest/ai"
import type { SqlSchema, SqlSchemaRequest } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link sqlSchema}
 * (`POST /api/v1/ai/coding/sql-schema` — seed-dataset schema introspection, no LLM quota
 * spent). Mirrors {@link usePostExecuteSqlSwr}; the SQL sandbox surface triggers it to
 * show the schema/ERD of the dataset the learner queries.
 */
export const usePostSqlSchemaSwr = () => {
    const swr = useSWRMutation<SqlSchema, Error, string, SqlSchemaRequest>(
        "POST_SQL_SCHEMA_SWR",
        async (_key, { arg }) => {
            return sqlSchema(arg)
        },
    )

    return swr
}
