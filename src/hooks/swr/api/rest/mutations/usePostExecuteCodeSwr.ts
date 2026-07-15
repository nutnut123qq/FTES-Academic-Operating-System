"use client"

import useSWRMutation from "swr/mutation"
import { executeCode } from "@/modules/api/rest/ai"
import type { CodeExecuteResult, ExecuteCodeRequest } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link executeCode}
 * (`POST /api/v1/ai/coding/execute-code` — Judge0 only, no LLM quota spent).
 */
export const usePostExecuteCodeSwr = () => {
    const swr = useSWRMutation<CodeExecuteResult, Error, string, ExecuteCodeRequest>(
        "POST_EXECUTE_CODE_SWR",
        async (_key, { arg }) => {
            return executeCode(arg)
        },
    )

    return swr
}
