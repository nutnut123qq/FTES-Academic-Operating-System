"use client"

import useSWRMutation from "swr/mutation"
import { runTests } from "@/modules/api/rest/ai"
import type { CodeExecutionSummary, RunTestsRequest } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link runTests}
 * (`POST /api/v1/ai/coding/run-tests` — sandbox run against a challenge's SAMPLE test
 * cases, no LLM quota spent). Mirrors {@link usePostExecuteCodeSwr}.
 */
export const usePostRunTestsSwr = () => {
    const swr = useSWRMutation<CodeExecutionSummary, Error, string, RunTestsRequest>(
        "POST_RUN_TESTS_SWR",
        async (_key, { arg }) => {
            return runTests(arg)
        },
    )

    return swr
}
