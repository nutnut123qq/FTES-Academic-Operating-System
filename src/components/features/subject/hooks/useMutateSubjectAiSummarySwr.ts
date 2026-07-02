"use client"

import useSWRMutation from "swr/mutation"

/** A generated mock summary for a picked source. */
export interface SubjectAiSummary {
    /** Bulleted key points. */
    keyPoints: Array<string>
    /** A short abstract paragraph. */
    abstract: string
}

/** Args for a summary generation. */
export interface GenerateSummaryArgs {
    subjectCode: string
    sourceTitle: string
    /** Force the mock failure path (retry testing). */
    fail?: boolean
}

/** ~1s so the loading skeleton is observable. */
const MOCK_DELAY_MS = 900

// ponytail: mock BE — no summary endpoint. Builds a source-aware canned summary.
const generateSummaryMock = async (
    _key: string,
    { arg }: { arg: GenerateSummaryArgs },
): Promise<SubjectAiSummary> => {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
    if (arg.fail) {
        throw new Error("mock-summary-failure")
    }
    return {
        keyPoints: [
            `Nội dung chính của "${arg.sourceTitle}" (${arg.subjectCode}).`,
            "Các khái niệm cốt lõi được nêu bật để ôn nhanh.",
            "Ví dụ minh hoạ và lưu ý thường gặp.",
            "Gợi ý bước tiếp theo để luyện tập.",
        ],
        abstract:
            `Đây là bản tóm tắt demo cho "${arg.sourceTitle}". Trợ lý AI sẽ ` +
            `chắt lọc ý chính từ tài liệu của môn ${arg.subjectCode}, sắp xếp ` +
            "theo trình tự dễ ôn và nêu các điểm cần lưu ý. (AI demo — nội dung " +
            "mô phỏng phía client.)",
    }
}

/**
 * Generates a mock summary for a picked subject source. SWR-mutation-shaped so a
 * real BE fetcher drops in without UI changes. BE assumption (logged): a real BE
 * summarizes the (subject, source) pair server-side.
 *
 * @param subjectId - the `[subjectId]` route segment (scopes the SWR key).
 */
export const useMutateSubjectAiSummarySwr = (subjectId: string) => {
    return useSWRMutation<
        SubjectAiSummary,
        Error,
        string,
        GenerateSummaryArgs
    >(`subject-ai-summary:${subjectId}`, generateSummaryMock)
}
