"use client"

import useSWR from "swr"

/** Coding-problem difficulty. Maps to a chip color + `subjects.practice.difficulty.*`. */
export type CodingDifficulty = "easy" | "medium" | "hard"

/** Whether the current user has an accepted solution for a problem. */
export type CodingStatus = "solved" | "unsolved"

/** A worked example on a problem (input → output, optional explanation). */
export interface CodingExample {
    /** Rendered as a fenced-ish block; kept as plain text for the mock. */
    input: string
    output: string
    /** Optional prose explaining why the output follows. */
    explanation?: string
}

/** A single mock test case shown in the Run/Submit result rows. */
export interface CodingTestCase {
    id: string
    /** Short label, e.g. `Test 1` (already localized-agnostic — a bare index). */
    input: string
    expected: string
    /**
     * The (mock) actual output. Equals `expected` for passing rows; differs for a
     * deterministic failing row so Submit shows a realistic pass/fail mix.
     */
    actual: string
}

/** A LeetCode-style coding problem in the subject's bank. */
export interface CodingChallenge {
    id: string
    title: string
    difficulty: CodingDifficulty
    status: CodingStatus
    /** Acceptance rate as a whole percent (0..100). */
    acceptance: number
    /** Topic tags, e.g. `["Array", "Hash Table"]`. */
    tags: Array<string>
    /** Problem statement (plain paragraphs for the mock). */
    prompt: Array<string>
    examples: Array<CodingExample>
    /** Constraint bullet lines. */
    constraints: Array<string>
    /** Sample cases the Run/Submit buttons grade against (mock). */
    testCases: Array<CodingTestCase>
}

// ponytail: mock BE — no coding-problem endpoint yet. A small deterministic bank so
// the list filters (difficulty/status/search) + the detail view have real shape to
// render. Swap for a GraphQL query (subjectCodingChallenges(subjectId)) later; shape stays.
const fetchCodingChallengesMock = async (): Promise<Array<CodingChallenge>> => [
    {
        id: "two-sum",
        title: "Two Sum",
        difficulty: "easy",
        status: "solved",
        acceptance: 52,
        tags: ["Array", "Hash Table"],
        prompt: [
            "Cho một mảng số nguyên nums và một số nguyên target, trả về chỉ số của hai phần tử sao cho tổng của chúng bằng target.",
            "Giả sử mỗi đầu vào có đúng một lời giải, và không dùng cùng một phần tử hai lần.",
        ],
        examples: [
            {
                input: "nums = [2,7,11,15], target = 9",
                output: "[0,1]",
                explanation: "Vì nums[0] + nums[1] == 9 nên trả về [0, 1].",
            },
            {
                input: "nums = [3,2,4], target = 6",
                output: "[1,2]",
            },
        ],
        constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "Chỉ tồn tại đúng một lời giải hợp lệ.",
        ],
        testCases: [
            { id: "t1", input: "[2,7,11,15], 9", expected: "[0,1]", actual: "[0,1]" },
            { id: "t2", input: "[3,2,4], 6", expected: "[1,2]", actual: "[1,2]" },
            { id: "t3", input: "[3,3], 6", expected: "[0,1]", actual: "[0,1]" },
        ],
    },
    {
        id: "valid-parentheses",
        title: "Valid Parentheses",
        difficulty: "easy",
        status: "unsolved",
        acceptance: 41,
        tags: ["String", "Stack"],
        prompt: [
            "Cho một chuỗi s chỉ gồm các ký tự '(', ')', '{', '}', '[' và ']', xác định xem chuỗi đầu vào có hợp lệ hay không.",
            "Chuỗi hợp lệ khi các dấu ngoặc được đóng đúng loại và đúng thứ tự.",
        ],
        examples: [
            { input: 's = "()[]{}"', output: "true" },
            { input: 's = "(]"', output: "false", explanation: "Dấu '(' bị đóng bởi ']' sai loại." },
        ],
        constraints: [
            "1 <= s.length <= 10^4",
            "s chỉ gồm các ký tự '()[]{}'.",
        ],
        testCases: [
            { id: "t1", input: '"()"', expected: "true", actual: "true" },
            { id: "t2", input: '"()[]{}"', expected: "true", actual: "true" },
            { id: "t3", input: '"(]"', expected: "false", actual: "false" },
        ],
    },
    {
        id: "merge-intervals",
        title: "Merge Intervals",
        difficulty: "medium",
        status: "unsolved",
        acceptance: 47,
        tags: ["Array", "Sorting"],
        prompt: [
            "Cho một mảng các khoảng intervals với intervals[i] = [start_i, end_i], gộp tất cả các khoảng chồng lấn nhau.",
            "Trả về một mảng các khoảng không chồng lấn bao phủ toàn bộ các khoảng đầu vào.",
        ],
        examples: [
            {
                input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
                output: "[[1,6],[8,10],[15,18]]",
                explanation: "Khoảng [1,3] và [2,6] chồng lấn nên gộp thành [1,6].",
            },
        ],
        constraints: [
            "1 <= intervals.length <= 10^4",
            "intervals[i].length == 2",
            "0 <= start_i <= end_i <= 10^4",
        ],
        testCases: [
            { id: "t1", input: "[[1,3],[2,6],[8,10],[15,18]]", expected: "[[1,6],[8,10],[15,18]]", actual: "[[1,6],[8,10],[15,18]]" },
            { id: "t2", input: "[[1,4],[4,5]]", expected: "[[1,5]]", actual: "[[1,5]]" },
            // deterministic failing row so Submit shows a realistic mix
            { id: "t3", input: "[[1,4],[2,3]]", expected: "[[1,4]]", actual: "[[1,4],[2,3]]" },
        ],
    },
    {
        id: "lru-cache",
        title: "LRU Cache",
        difficulty: "medium",
        status: "solved",
        acceptance: 44,
        tags: ["Hash Table", "Linked List", "Design"],
        prompt: [
            "Thiết kế một cấu trúc dữ liệu tuân theo ràng buộc của bộ nhớ đệm Least Recently Used (LRU).",
            "Cài đặt hai thao tác get(key) và put(key, value) với độ phức tạp trung bình O(1).",
        ],
        examples: [
            {
                input: 'LRUCache(2); put(1,1); put(2,2); get(1)',
                output: "1",
                explanation: "get(1) trả về 1 và đánh dấu key 1 vừa được dùng gần nhất.",
            },
        ],
        constraints: [
            "1 <= capacity <= 3000",
            "0 <= key <= 10^4",
            "Tối đa 2 * 10^5 lần gọi get và put.",
        ],
        testCases: [
            { id: "t1", input: "cap=2; put(1,1); put(2,2); get(1)", expected: "1", actual: "1" },
            { id: "t2", input: "cap=2; ...; get(2) sau khi bị evict", expected: "-1", actual: "-1" },
        ],
    },
    {
        id: "word-ladder",
        title: "Word Ladder",
        difficulty: "hard",
        status: "unsolved",
        acceptance: 38,
        tags: ["BFS", "Hash Table", "String"],
        prompt: [
            "Cho hai từ beginWord, endWord và một từ điển wordList, trả về độ dài của chuỗi biến đổi ngắn nhất từ beginWord đến endWord.",
            "Mỗi bước chỉ được đổi đúng một ký tự, và từ trung gian phải nằm trong wordList.",
        ],
        examples: [
            {
                input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
                output: "5",
                explanation: 'hit -> hot -> dot -> dog -> cog, độ dài 5.',
            },
        ],
        constraints: [
            "1 <= beginWord.length <= 10",
            "endWord.length == beginWord.length",
            "1 <= wordList.length <= 5000",
        ],
        testCases: [
            { id: "t1", input: '"hit","cog",[...]', expected: "5", actual: "5" },
            { id: "t2", input: '"hit","cog",[...(no cog)]', expected: "0", actual: "0" },
        ],
    },
    {
        id: "median-two-sorted",
        title: "Median of Two Sorted Arrays",
        difficulty: "hard",
        status: "unsolved",
        acceptance: 36,
        tags: ["Array", "Binary Search", "Divide and Conquer"],
        prompt: [
            "Cho hai mảng đã sắp xếp nums1 và nums2, trả về trung vị của hai mảng gộp lại.",
            "Độ phức tạp thời gian mong muốn là O(log (m+n)).",
        ],
        examples: [
            { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "Mảng gộp = [1,2,3], trung vị là 2." },
            { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.50000" },
        ],
        constraints: [
            "0 <= m, n <= 1000",
            "1 <= m + n <= 2000",
            "-10^6 <= nums1[i], nums2[i] <= 10^6",
        ],
        testCases: [
            { id: "t1", input: "[1,3],[2]", expected: "2.00000", actual: "2.00000" },
            { id: "t2", input: "[1,2],[3,4]", expected: "2.50000", actual: "2.50000" },
        ],
    },
]

/** Loads a subject's coding-problem bank. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectCodingChallengesSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-coding-challenges", subjectId],
        () => fetchCodingChallengesMock(),
    )
    return { challenges: data ?? [], isLoading, error, mutate }
}
