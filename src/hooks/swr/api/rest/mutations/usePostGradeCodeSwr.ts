"use client"

import useSWRMutation from "swr/mutation"
import { gradeCode } from "@/modules/api/rest/ai"
import type { CodeGradeResult, GradeCodeRequest } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link gradeCode}
 * (`POST /api/v1/ai/coding/grade-code` — Judge0 + LLM, sync 10–60s).
 */
export const usePostGradeCodeSwr = () => {
    const swr = useSWRMutation<CodeGradeResult, Error, string, GradeCodeRequest>(
        "POST_GRADE_CODE_SWR",
        async (_key, { arg }) => {
            return gradeCode(arg)
        },
    )

    return swr
}
