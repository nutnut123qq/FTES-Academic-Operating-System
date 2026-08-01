"use client"

import useSWRMutation from "swr/mutation"
import { executeSql } from "@/modules/api/rest/ai"
import type { SqlExecuteRequest, SqlRunResult } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link executeSql}
 * (`POST /api/v1/ai/coding/execute-sql` — Postgres sandbox, no LLM quota spent).
 */
export const usePostExecuteSqlSwr = () => {
    const swr = useSWRMutation<SqlRunResult, Error, string, SqlExecuteRequest>(
        "POST_EXECUTE_SQL_SWR",
        async (_key, { arg }) => {
            return executeSql(arg)
        },
    )

    return swr
}
